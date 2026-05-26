import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { Channel } from "@/models/Channel";
import { ChannelMessage } from "@/models/ChannelMessage";
import { User } from "@/models/User";
import { requireSession, badRequest, notFound, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { parseMentions, resolveMentionsToIds, handleFor } from "@/lib/mentions";
import { notify, notifyMany, notifyCoalesced } from "@/lib/notifications";

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

    // Look up the sender once — used in every notification title below.
    const sender = await User.findById(session.user.id, {
      name: 1,
      email: 1,
    }).lean();
    const senderName =
      sender?.name?.trim() || sender?.email?.split("@")[0] || "Someone";
    const preview = parsed.data.body.slice(0, 240).trim();
    const channelUrl = `/team?channel=${channel._id}`;

    // ── Mentions — always high-priority, never coalesced (the user
    //     explicitly named them, so each is its own event).
    if (mentionIds.length) {
      await notifyMany(mentionIds, {
        workspace: ws._id,
        actor: session.user.id,
        kind: "mention",
        priority: "high",
        title:
          channel.type === "dm"
            ? `${senderName} mentioned you in a DM`
            : `${senderName} mentioned you in #${channel.name}`,
        body: preview,
        url: channelUrl,
        entity: { type: "conversation", id: channel._id },
      });
    }

    if (channel.type === "dm") {
      // ── Direct messages — notify the other participant every time.
      //     DMs are personal; we never coalesce. Mentions in DMs are
      //     already covered above, so skip if they were the mention
      //     target (avoid double-notify).
      const otherIds = (channel.members ?? [])
        .map(String)
        .filter(
          (m) =>
            m !== session.user.id &&
            !mentionIds.includes(m)
        );
      await Promise.all(
        otherIds.map((rid) =>
          notify({
            workspace: ws._id,
            recipient: rid,
            actor: session.user.id,
            kind: "dm",
            priority: "high",
            title: `${senderName} sent you a message`,
            body: preview || "(attachment)",
            url: channelUrl,
            entity: { type: "conversation", id: channel._id },
          })
        )
      );
    } else {
      // ── Channel messages — notify other channel members (excluding
      //     sender + mentioned users). Coalesced so a chatty burst
      //     stays a single bell badge per channel per 5 minutes.
      //     For public channels we only ping the workspace members who
      //     opted in via `channel.members`; if `members` is empty (the
      //     public default), we fan out to everyone in the workspace.
      const audience =
        channel.members && channel.members.length > 0
          ? channel.members.map(String)
          : (ws.members ?? []).map((m) => String(m.user));
      const recipients = Array.from(new Set(audience)).filter(
        (m) =>
          m !== session.user.id &&
          !mentionIds.includes(m)
      );
      await Promise.all(
        recipients.map((rid) =>
          notifyCoalesced({
            workspace: ws._id,
            recipient: rid,
            actor: session.user.id,
            kind: "message",
            priority: "normal",
            title: `New message in #${channel.name}`,
            body: `${senderName}: ${preview || "(attachment)"}`,
            url: channelUrl,
            entity: { type: "conversation", id: channel._id },
          })
        )
      );
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
