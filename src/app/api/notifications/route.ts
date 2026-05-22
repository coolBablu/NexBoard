import { NextResponse } from "next/server";

import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { requireSession, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 *   ?limit=20 (default 30, max 100)
 *   ?cursor=<iso>     (older-than pagination)
 *   ?unread=1         (only unread)
 *
 * Always returns `unreadCount` for the bell badge.
 */
export async function GET(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 30)));
    const cursor = searchParams.get("cursor");
    const unreadOnly = searchParams.get("unread") === "1";

    const filter: Record<string, unknown> = {
      recipient: session.user.id,
      workspace: ws._id,
      archivedAt: null,
    };
    if (unreadOnly) filter.readAt = null;
    if (cursor) filter.createdAt = { $lt: new Date(cursor) };

    const [items, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("actor", "name email image")
        .lean(),
      Notification.countDocuments({
        recipient: session.user.id,
        readAt: null,
        archivedAt: null,
      }),
    ]);

    return NextResponse.json({
      unreadCount,
      notifications: items.map((n) => ({
        id: String(n._id),
        kind: n.kind,
        priority: n.priority,
        title: n.title,
        body: n.body,
        url: n.url,
        readAt: n.readAt,
        createdAt: n.createdAt,
        actor: n.actor
          ? {
              id: String((n.actor as { _id: unknown })._id),
              name: (n.actor as { name?: string }).name ?? "",
              image: (n.actor as { image?: string | null }).image ?? null,
            }
          : null,
        entity: n.entity,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

/**
 * POST /api/notifications/read-all -- mark every unread notification
 * for the current user as read in one shot.
 */
export async function POST() {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;
  try {
    const now = new Date();
    const res = await Notification.updateMany(
      { recipient: session.user.id, readAt: null },
      { $set: { readAt: now } }
    );
    // Touch lastSeenAt as a side-effect (user is clearly active).
    await User.updateOne(
      { _id: session.user.id },
      { $set: { lastSeenAt: now } }
    );
    return NextResponse.json({ ok: true, updated: res.modifiedCount });
  } catch (err) {
    return serverError(err);
  }
}
