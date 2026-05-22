import { NextResponse } from "next/server";

import { Activity } from "@/models/Activity";
import { requireSession, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/activities
 *   ?limit=20 (default 40, max 100)
 *   ?cursor=<iso>
 *
 * Workspace-scoped timeline of every meaningful change.
 */
export async function GET(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 40)));
    const cursor = searchParams.get("cursor");

    const filter: Record<string, unknown> = { workspace: ws._id };
    if (cursor) filter.createdAt = { $lt: new Date(cursor) };

    const items = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actor", "name email image")
      .lean();

    return NextResponse.json({
      activities: items.map((a) => ({
        id: String(a._id),
        type: a.type,
        text: a.text,
        createdAt: a.createdAt,
        refType: a.refType,
        refId: a.refId ? String(a.refId) : null,
        actor: a.actor
          ? {
              id: String((a.actor as { _id: unknown })._id),
              name: (a.actor as { name?: string }).name ?? "",
              email: (a.actor as { email?: string }).email ?? "",
              image: (a.actor as { image?: string | null }).image ?? null,
            }
          : null,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}
