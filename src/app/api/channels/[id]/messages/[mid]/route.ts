import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { Channel } from "@/models/Channel";
import { ChannelMessage } from "@/models/ChannelMessage";
import { User } from "@/models/User";
import { requireSession, badRequest, notFound, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; mid: string }> };

const patchSchema = z.object({
  body: z.string().min(1).max(8_000),
});

/** Helper: load the message + channel together and run common guards. */
async function loadMessage(
  channelId: string,
  messageId: string,
  userId: string
) {
  if (!Types.ObjectId.isValid(channelId)) {
    return { error: badRequest("Invalid channel id") } as const;
  }
  if (!Types.ObjectId.isValid(messageId)) {
    return { error: badRequest("Invalid message id") } as const;
  }
  const ws = await getOrCreateDefaultWorkspace(userId);
  const channel = await Channel.findOne({ _id: channelId, workspace: ws._id });
  if (!channel) return { error: notFound("Channel not found") } as const;

  // Mirror the read guard: only members can touch private channels / DMs.
  if (
    (channel.isPrivate || channel.type === "dm") &&
    !(channel.members ?? []).some((m) => String(m) === userId)
  ) {
    return {
      error: NextResponse.json(
        { error: "Not a member of this channel" },
        { status: 403 }
      ),
    } as const;
  }

  const msg = await ChannelMessage.findOne({
    _id: messageId,
    channel: channel._id,
  });
  if (!msg) return { error: notFound("Message not found") } as const;

  return { ws, channel, msg } as const;
}

/**
 * PATCH /api/channels/[id]/messages/[mid]
 *   { body: "<new text>" }
 *
 * Only the author can edit. Stamps `editedAt` so the UI can render
 * an "(edited)" hint. Doesn't re-broadcast notifications — edits are
 * read by the next poll tick.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id, mid } = await ctx.params;
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const loaded = await loadMessage(id, mid, session.user.id);
    if ("error" in loaded) return loaded.error;
    const { msg } = loaded;

    if (String(msg.author) !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own messages." },
        { status: 403 }
      );
    }

    msg.body = parsed.data.body;
    msg.editedAt = new Date();
    await msg.save();

    return NextResponse.json({
      id: String(msg._id),
      body: msg.body,
      editedAt: msg.editedAt,
      attachments: msg.attachments,
      mentions: (msg.mentions ?? []).map(String),
    });
  } catch (err) {
    return serverError(err);
  }
}

/**
 * DELETE /api/channels/[id]/messages/[mid]
 * Author can delete their own message. super_admin can delete anyone's.
 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id, mid } = await ctx.params;
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const loaded = await loadMessage(id, mid, session.user.id);
    if ("error" in loaded) return loaded.error;
    const { msg, channel } = loaded;

    const isAuthor = String(msg.author) === session.user.id;
    let isSuperAdmin = false;
    if (!isAuthor) {
      const me = await User.findById(session.user.id, { role: 1 }).lean();
      isSuperAdmin = me?.role === "super_admin";
    }
    if (!isAuthor && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Only the author or a super admin can delete this message." },
        { status: 403 }
      );
    }

    await ChannelMessage.deleteOne({ _id: msg._id });

    // Keep the per-channel counter honest, but never go negative.
    if ((channel.messageCount ?? 0) > 0) {
      await Channel.updateOne(
        { _id: channel._id },
        { $inc: { messageCount: -1 } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
