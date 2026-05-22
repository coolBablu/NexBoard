/**
 * Mention parsing + resolution helpers.
 *
 *   parseMentions("hey @alex pls review") → ["alex"]
 *   resolveMentions(["alex"], wsMemberHandles) → matched user-ids
 *
 * Mentions are written as `@handle` where `handle` matches /[a-z0-9_-]+/i.
 * The handle is derived from a user's `User.handle` field (preferred) or
 * falls back to the local part of their email.
 */

export const MENTION_RE = /@([a-z0-9][a-z0-9_-]{0,38})/gi;

/** Returns a deduped, lowercased list of handles found in the text. */
export function parseMentions(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  text.replace(MENTION_RE, (_m, handle: string) => {
    found.add(handle.toLowerCase());
    return _m;
  });
  return Array.from(found);
}

interface HandleSource {
  id: string;
  handle?: string | null;
  email?: string | null;
}

/** Best-effort handle for any user — falls back to email local-part. */
export function handleFor(user: { handle?: string | null; email?: string | null }): string {
  if (user.handle) return user.handle.toLowerCase();
  if (user.email) {
    return user.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-");
  }
  return "user";
}

/** Map a list of @handles to user ids (only those that exist in the source). */
export function resolveMentionsToIds(
  handles: string[],
  source: HandleSource[]
): string[] {
  if (handles.length === 0) return [];
  const set = new Set(handles.map((h) => h.toLowerCase()));
  const hits = new Set<string>();
  for (const u of source) {
    const h = handleFor(u);
    if (set.has(h)) hits.add(u.id);
  }
  return Array.from(hits);
}
