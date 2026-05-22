/**
 * Lightweight presence — no WebSockets required. Every authenticated
 * heartbeat writes `User.lastSeenAt = now`, and presence queries treat
 * anyone updated within `ONLINE_WINDOW_MS` as "online". The client pings
 * `/api/presence/heartbeat` every 30 s and reads `/api/presence` every
 * 20 s for a realtime-ish feel.
 */

import { User } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { toObjectId, type IdLike } from "@/lib/db/queries";

export const ONLINE_WINDOW_MS = 90_000; // 90 s
export const AWAY_WINDOW_MS = 5 * 60_000; // 5 min

export type PresenceState = "online" | "away" | "offline";

export function presenceFromLastSeen(lastSeenAt: Date | null | undefined): PresenceState {
  if (!lastSeenAt) return "offline";
  const age = Date.now() - new Date(lastSeenAt).getTime();
  if (age <= ONLINE_WINDOW_MS) return "online";
  if (age <= AWAY_WINDOW_MS) return "away";
  return "offline";
}

/** Update `lastSeenAt` for a user. Cheap upsert; ignores errors. */
export async function heartbeat(userId: IdLike): Promise<Date> {
  const _id = toObjectId(userId);
  const now = new Date();
  if (!_id) return now;
  try {
    await User.updateOne({ _id }, { $set: { lastSeenAt: now } }).exec();
  } catch {
    // ignore
  }
  return now;
}

interface PresenceEntry {
  userId: string;
  state: PresenceState;
  lastSeenAt: Date | null;
  status: string | null;
}

/** Returns the presence state for every member of a workspace. */
export async function getWorkspacePresence(
  workspaceId: IdLike
): Promise<PresenceEntry[]> {
  const wsId = toObjectId(workspaceId);
  if (!wsId) return [];

  const ws = await Workspace.findById(wsId, { members: 1 }).lean();
  if (!ws?.members?.length) return [];
  const memberIds = ws.members.map((m) => m.user);

  const users = await User.find(
    { _id: { $in: memberIds } },
    { lastSeenAt: 1, status: 1 }
  ).lean();

  return users.map((u) => ({
    userId: String(u._id),
    state: presenceFromLastSeen(u.lastSeenAt as Date | null),
    lastSeenAt: (u.lastSeenAt as Date | null) ?? null,
    status: (u.status as string | null) ?? null,
  }));
}
