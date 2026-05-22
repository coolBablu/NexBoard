import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { Conversation } from "@/models/Conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { Message } from "@/models/Message";
import { requireSession, badRequest, serverError, notFound } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid conversation id");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const conv = await Conversation.findOne({ _id: id, user: session.user.id }).lean();
    if (!conv) return notFound("Conversation not found");

    const messages = await Message.find({ conversation: conv._id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      conversation: {
        id: String(conv._id),
        title: conv.title,
        preview: conv.preview,
        messageCount: conv.messageCount,
      },
      messages: messages.map((m) => ({
        id: String(m._id),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid conversation id");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const conv = await Conversation.findOneAndDelete({
      _id: id,
      user: session.user.id,
    });
    if (!conv) return notFound("Conversation not found");
    await Message.deleteMany({ conversation: conv._id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
