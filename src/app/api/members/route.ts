import { NextResponse } from "next/server";

import { Workspace } from "@/models/Workspace";
import { User } from "@/models/User";
import { requireSession, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { handleFor } from "@/lib/mentions";
import { presenceFromLastSeen } from "@/lib/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/members
 *   ?q=<search>     (matches name/handle/email, case-insensitive)
 *
 * Workspace-scoped member directory — drives the mention autocomplete,
 * the assignee picker, and the team-members surface on /workspace.
 */
export async function GET(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const memberIds = (ws.members ?? []).map((m) => m.user);
    const users = await User.find(
      { _id: { $in: memberIds } },
      {
        name: 1,
        email: 1,
        image: 1,
        handle: 1,
        title: 1,
        lastSeenAt: 1,
        presenceText: 1,
      }
    ).lean();

    const memberMeta = new Map(
      (ws.members ?? []).map((m) => [String(m.user), m])
    );

    const list = users.map((u) => {
      const meta = memberMeta.get(String(u._id));
      const handle = handleFor({ handle: u.handle, email: u.email });
      return {
        id: String(u._id),
        name: u.name,
        email: u.email,
        image:
          u.image ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            u.email
          )}`,
        handle,
        title: u.title || null,
        role: meta?.role || "member",
        status: u.presenceText || null,
        presence: presenceFromLastSeen(u.lastSeenAt as Date | null),
        lastSeenAt: u.lastSeenAt || null,
      };
    });

    const filtered = q
      ? list.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.handle.toLowerCase().includes(q)
        )
      : list;

    // Online first, then alphabetical.
    filtered.sort((a, b) => {
      const score = (s: string) =>
        s === "online" ? 0 : s === "away" ? 1 : 2;
      const diff = score(a.presence) - score(b.presence);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      workspace: { id: String(ws._id), name: ws.name, slug: ws.slug },
      members: filtered,
    });
  } catch (err) {
    return serverError(err);
  }
}
