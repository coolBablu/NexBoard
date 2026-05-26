import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { Channel } from "@/models/Channel";
import { ChannelMessage } from "@/models/ChannelMessage";
import { User } from "@/models/User";
import { requireSession, badRequest, notFound, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { parseMentions, resolveMentionsToIds, handleFor } from "@/lib/mentions";
import { notifyMany } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attachmentSchema = z.object({
  name: z.string().min(1).max(240),
  mime: z.string().min(1).max(120),
  size: z.number().min(0),
  url: z.string().max(200_000),
});

const createSchema = z.object({
  body: z.string().min(1).max(8000),
  attachments: z.array(attachmentSchema).max(6).optional().default([]),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/channels/[id]/messages
 *   ?since=<iso>     (delta for polling — only newer messages)
 *   ?limit=50
 *
 * Polling-friendly: clients can hit this every few seconds with `since` to
 * get only the new tail without re-rendering the whole thread.
 */
export async function GET(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid channel id");
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const channel = await Channel.findOne({ _id: id, workspace: ws._id });
    if (!channel) return notFound("Channel not found");
    if (
      channel.isPrivate &&
      !(channel.members ?? []).some((m) => String(m) === session.user.id)
    ) {
      return badRequest("Not a member of this private channel");
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));

    const filter: Record<string, unknown> = { channel: channel._id };
    if (since) {
      const d = new Date(since);
      if (!isNaN(d.getTime())) filter.createdAt = { $gt: d };
    }

    const messages = await ChannelMessage.find(filter)
      .sort(since ? { createdAt: 1 } : { createdAt: -1 })
      .limit(limit)
      .populate("author", "name email image handle")
      .lean();

    // For the initial load we sort desc + slice newest, then reverse so
    // the client can render oldest-first in a single pass.
    if (!since) messages.reverse();

    return NextResponse.json({
      channel: {
        id: String(channel._id),
        name: channel.name,
        topic: channel.topic,
        icon: channel.icon,
      },
      messages: messages.map((m) => ({
        id: String(m._id),
        body: m.body,
        mentions: (m.mentions || []).map(String),
        attachments: m.attachments || [],
        editedAt: m.editedAt,
        createdAt: m.createdAt,
        author: {
          id: String((m.author as { _id: unknown })._id),
          name: (m.author as { name?: string }).name ?? "",
          handle: handleFor({
            handle: (m.author as { handle?: string }).handle,
            email: (m.author as { email?: string }).email,
          }),
          image: (m.author as { image?: string | null }).image ?? null,
        },
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

/** POST — send a message; resolves @mentions and fans out notifications. */
export async function POST(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid channel id");
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const channel = await Channel.findOne({ _id: id, workspace: ws._id });
    if (!channel) return notFound("Channel not found");

    // Private channels (incl. DMs) — only listed members may post.
    // Public channels are open to every active workspace member.
    if (
      (channel.isPrivate || channel.type === "dm") &&
      !(channel.members ?? []).some((m) => String(m) === session.user.id)
    ) {
      return NextResponse.json(
        { error: "Not a member of this channel" },
        { status: 403 }
      );
    }

    // Resolve mentions
    const handles = parseMentions(parsed.data.body);
    let mentionIds: string[] = [];
    if (handles.length) {
      const memberIds = (ws.members ?? []).map((m) => m.user);
      const members = await User.find(
        { _id: { $in: memberIds } },
        { handle: 1, email: 1 }
      ).lean();
      mentionIds = resolveMentionsToIds(
        handles,
        members.map((m) => ({ id: String(m._id), handle: m.handle, email: m.email }))
      );
    }

    const msg = await ChannelMessage.create({
      channel: channel._id,
      workspace: ws._id,
      author: session.user.id,
      body: parsed.data.body,
      mentions: mentionIds,
      attachments: parsed.data.attachments,
    });

    await Channel.updateOne(
      { _id: channel._id },
      { $set: { lastMessageAt: new Date() }, $inc: { messageCount: 1 } }
    );

    // Touch presence so the actor lights up as online for other clients.
    await User.updateOne(
      { _id: session.user.id },
      { $set: { lastSeenAt: new Date() } }
    );

    // Notify mentions only — broadcasting to every channel member would
    // spam. Channel timelines are how non-mentioned members keep up.
    if (mentionIds.length) {
      await notifyMany(mentionIds, {
        workspace: ws._id,
        actor: session.user.id,
        kind: "mention",
        priority: "high",
        title: `You were mentioned in #${channel.name}`,
        body: parsed.data.body.slice(0, 240),
        url: `/team?channel=${channel._id}`,
        entity: { type: "conversation", id: channel._id },
      });
    }

    return NextResponse.json(
      {
        id: String(msg._id),
        body: msg.body,
        mentions: mentionIds,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
