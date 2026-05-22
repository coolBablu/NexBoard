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
