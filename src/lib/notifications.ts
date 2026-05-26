/**
 * Fire-and-forget notification dispatcher.
 *
 *   await notify({
 *     workspace, recipient, kind: "mention",
 *     actor, title: "Daniel mentioned you", body: "...", url: "/team#...",
 *   });
 *
 * Skips self-notifications (you don't get pinged for your own action).
 * Never throws — logging a notification must never break the user-facing
 * write that triggered it.
 */

import { Notification, type NotificationKind, type NotificationPriority } from "@/models/Notification";
import type { IdLike } from "@/lib/db/queries";
import { toObjectId } from "@/lib/db/queries";

interface NotifyInput {
  workspace: IdLike;
  recipient: IdLike;
  actor?: IdLike | null;
  kind: NotificationKind;
  priority?: NotificationPriority;
  title: string;
  body?: string;
  url?: string | null;
  entity?: {
    type: "task" | "project" | "comment" | "conversation" | "user" | "workspace";
    id: IdLike;
  };
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    const recipient = toObjectId(input.recipient);
    const workspace = toObjectId(input.workspace);
    const actor = input.actor ? toObjectId(input.actor) : null;
    if (!recipient || !workspace) return;
    if (actor && String(actor) === String(recipient)) return;

    await Notification.create({
      workspace,
      recipient,
      actor,
      kind: input.kind,
      priority: input.priority ?? "normal",
      title: input.title,
      body: input.body ?? "",
      url: input.url ?? null,
      entity: input.entity
        ? { type: input.entity.type, id: toObjectId(input.entity.id) }
        : null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[notify] failed:", err);
  }
}

/** Fan-out: one notification per recipient. Use for @mentions / assignees. */
export async function notifyMany(
  recipients: IdLike[],
  base: Omit<NotifyInput, "recipient">
): Promise<void> {
  const seen = new Set<string>();
  await Promise.all(
    recipients
      .filter((r) => {
        const key = String(r);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((r) => notify({ ...base, recipient: r }))
  );
}

/**
 * Like `notify` but coalesces: if the recipient already has an UNREAD
 * notification with the same `entity` in the last `windowMs`, we
 * update its title/body/createdAt instead of inserting a fresh row.
 *
 * Designed for chatty channels where a 30-message burst shouldn't
 * produce 30 bell badges. Always inserts when no recent unread match.
 */
export async function notifyCoalesced(
  input: NotifyInput & {
    entity: NonNullable<NotifyInput["entity"]>;
    windowMs?: number;
  }
): Promise<void> {
  try {
    const recipient = toObjectId(input.recipient);
    const workspace = toObjectId(input.workspace);
    const actor = input.actor ? toObjectId(input.actor) : null;
    const entityId = toObjectId(input.entity.id);
    if (!recipient || !workspace || !entityId) return;
    if (actor && String(actor) === String(recipient)) return;

    const windowMs = input.windowMs ?? 5 * 60_000; // 5 minutes default
    const since = new Date(Date.now() - windowMs);

    const existing = await Notification.findOne({
      recipient,
      workspace,
      readAt: null,
      kind: input.kind,
      "entity.type": input.entity.type,
      "entity.id": entityId,
      createdAt: { $gte: since },
    }).sort({ createdAt: -1 });

    if (existing) {
      existing.title = input.title;
      existing.body = input.body ?? "";
      existing.url = input.url ?? existing.url;
      existing.actor = actor;
      existing.set("createdAt", new Date());
      await existing.save();
      return;
    }

    await Notification.create({
      workspace,
      recipient,
      actor,
      kind: input.kind,
      priority: input.priority ?? "normal",
      title: input.title,
      body: input.body ?? "",
      url: input.url ?? null,
      entity: { type: input.entity.type, id: entityId },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[notifyCoalesced] failed:", err);
  }
}
