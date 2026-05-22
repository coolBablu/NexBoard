import { NextResponse } from "next/server";

import { requireSession, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { getWorkspacePresence, heartbeat } from "@/lib/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/presence — current state for everyone in the workspace. */
export async function GET() {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;
  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const entries = await getWorkspacePresence(ws._id);
    return NextResponse.json({
      online: entries.filter((e) => e.state === "online").map((e) => e.userId),
      away: entries.filter((e) => e.state === "away").map((e) => e.userId),
      entries,
    });
  } catch (err) {
    return serverError(err);
  }
}

/** POST /api/presence — heartbeat (called every ~30 s by AppShell). */
export async function POST() {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;
  try {
    const now = await heartbeat(session.user.id);
    return NextResponse.json({ ok: true, lastSeenAt: now });
  } catch (err) {
    return serverError(err);
  }
}
