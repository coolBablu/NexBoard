import { NextResponse } from "next/server";

import { Conversation } from "@/models/Conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { requireSession, serverError } from "@/lib/api";

export async function GET() {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const conversations = await Conversation.find({ user: session.user.id })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: String(c._id),
        title: c.title,
        preview: c.preview,
        messageCount: c.messageCount,
        lastMessageAt: c.lastMessageAt,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST() {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const c = await Conversation.create({
      user: session.user.id,
      title: "New chat",
      preview: "",
    });
    return NextResponse.json(
      {
        id: String(c._id),
        title: c.title,
        preview: c.preview,
        messageCount: c.messageCount,
        lastMessageAt: c.lastMessageAt,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
