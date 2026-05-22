/**
 * Append-only writer for the `AIHistory` collection.
 * Every AI invocation should call `logAIRun(...)` so usage,
 * cost and latency dashboards stay accurate.
 */

import { dbConnect } from "@/lib/mongodb";
import { AIHistory, type AIKind, type AIProvider, type AIStatus } from "@/models/AIHistory";
import { Workspace } from "@/models/Workspace";
import type { IdLike } from "@/lib/db/queries";
import { toObjectId } from "@/lib/db/queries";

interface LogAIRunInput {
  user: IdLike;
  /** If omitted, falls back to the user's defaultWorkspace. */
  workspace?: IdLike | null;
  conversation?: IdLike | null;
  kind: AIKind;
  provider: AIProvider;
  model: string;
  promptPreview?: string;
  responsePreview?: string;
  tokens?: { input?: number; output?: number };
  costUsd?: number;
  latencyMs?: number;
  status: AIStatus;
  error?: string | null;
  meta?: Record<string, unknown> | null;
  requestId?: string | null;
}

export async function logAIRun(input: LogAIRunInput): Promise<void> {
  try {
    await dbConnect();

    let workspaceId = toObjectId(input.workspace ?? null);
    if (!workspaceId) {
      // Fall back to the user's first/default workspace so we never lose a log.
      const ws = await Workspace.findOne(
        { "members.user": toObjectId(input.user) },
        { _id: 1 }
      ).lean();
      if (ws) workspaceId = ws._id;
    }
    if (!workspaceId) return; // No workspace context — silently drop.

    const inputTokens = input.tokens?.input ?? 0;
    const outputTokens = input.tokens?.output ?? 0;

    await AIHistory.create({
      user: toObjectId(input.user),
      workspace: workspaceId,
      conversation: toObjectId(input.conversation ?? null),
      kind: input.kind,
      provider: input.provider,
      model: input.model,
      promptPreview: truncate(input.promptPreview ?? "", 2000),
      responsePreview: truncate(input.responsePreview ?? "", 2000),
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
      costUsd: input.costUsd ?? 0,
      latencyMs: input.latencyMs ?? 0,
      status: input.status,
      error: input.error ?? null,
      meta: input.meta ?? null,
      requestId: input.requestId ?? null,
    });
  } catch (err) {
    // Don't bubble — logging failures must never break the user-facing call.
    // eslint-disable-next-line no-console
    console.error("[ai/log] Failed to persist AIHistory:", err);
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
