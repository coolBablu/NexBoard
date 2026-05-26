import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { dbConnect } from "@/lib/mongodb";
import { Channel } from "@/models/Channel";
import { User } from "@/models/User";
import { requireSession, badRequest, serverError, notFound } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string().min(1),
});

/**
 * POST /api/channels/dm
 *   { userId: "<other-user>" }
 *
 * Finds or creates the 1:1 DM channel between the current user and
 * the target user. Idempotent — re-calling for the same pair always
 * returns the same channel id.
 */
export async function POST(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());
    const otherId = parsed.data.userId;
    if (!Types.ObjectId.isValid(otherId)) return badRequest("Invalid user id");
    if (otherId === session.user.id) return badRequest("Can't DM yourself");

    await dbConnect();
    const ws = await getOrCreateDefaultWorkspace(session.user.id);

    // Make sure the other user is actually in this workspace.
    const inSameWs = (ws.members ?? []).some(
      (m) => String(m.user) === otherId
    );
    if (!inSameWs) {
      return NextResponse.json(
        { error: "That user isn't in your workspace." },
        { status: 403 }
      );
    }

    const other = await User.findById(otherId, { name: 1, email: 1 }).lean();
    if (!other) return notFound("User not found");

    // Find an existing DM with exactly these two members.
    const existing = await Channel.findOne({
      workspace: ws._id,
      type: "dm",
      members: { $all: [session.user.id, otherId] },
    });

    if (existing) {
      return NextResponse.json({
        id: String(existing._id),
        type: existing.type,
        name: existing.name,
        existed: true,
      });
    }

    const me = await User.findById(session.user.id, { name: 1 }).lean();
    const myName = me?.name?.split(" ")[0] ?? "you";
    const themName = other.name?.split(" ")[0] ?? "them";

    const dm = await Channel.create({
      workspace: ws._id,
      type: "dm",
      // For DMs the name doubles as a deterministic key + a fallback label.
      name: `dm-${[session.user.id, otherId].sort().join("-")}`,
      topic: `${myName} ↔ ${themName}`,
      icon: "💬",
      isPrivate: true,
      members: [session.user.id, otherId],
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        id: String(dm._id),
        type: dm.type,
        name: dm.name,
        topic: dm.topic,
        existed: false,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
