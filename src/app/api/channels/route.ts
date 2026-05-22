import { NextResponse } from "next/server";
import { z } from "zod";

import { Channel } from "@/models/Channel";
import { ChannelMessage } from "@/models/ChannelMessage";
import { requireSession, badRequest, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.toLowerCase().replace(/[^a-z0-9_-]+/g, "-")),
  topic: z.string().max(240).optional().default(""),
  icon: z.string().max(4).optional(),
  isPrivate: z.boolean().optional().default(false),
});

/** GET — all channels in the user's workspace + unread counts. */
export async function GET() {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);

    const channels = await Channel.find({
      workspace: ws._id,
      $or: [
        { isPrivate: false },
        { members: session.user.id },
      ],
    })
      .sort({ type: 1, name: 1 })
      .lean();

    // Cheap unread-count via last-read marker on the User model would be
    // ideal; for now we just expose lastMessageAt so the client can sort.
    return NextResponse.json({
      channels: channels.map((c) => ({
        id: String(c._id),
        type: c.type,
        name: c.name,
        topic: c.topic,
        icon: c.icon,
        isPrivate: c.isPrivate,
        lastMessageAt: c.lastMessageAt,
        messageCount: c.messageCount,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

/** POST — create a new channel and post a welcome system message. */
export async function POST(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const ws = await getOrCreateDefaultWorkspace(session.user.id);

    const existing = await Channel.findOne({
      workspace: ws._id,
      name: parsed.data.name,
      type: "channel",
    });
    if (existing) return badRequest("Channel name already taken");

    const channel = await Channel.create({
      workspace: ws._id,
      type: "channel",
      name: parsed.data.name,
      topic: parsed.data.topic,
      icon: parsed.data.icon || "#",
      isPrivate: parsed.data.isPrivate,
      members: parsed.data.isPrivate ? [session.user.id] : [],
      createdBy: session.user.id,
    });

    await ChannelMessage.create({
      channel: channel._id,
      workspace: ws._id,
      author: session.user.id,
      body: `Welcome to **#${channel.name}** — kick off the conversation 🎉`,
    });
    await Channel.updateOne(
      { _id: channel._id },
      { $set: { lastMessageAt: new Date() }, $inc: { messageCount: 1 } }
    );

    return NextResponse.json(
      {
        id: String(channel._id),
        name: channel.name,
        type: channel.type,
        icon: channel.icon,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
