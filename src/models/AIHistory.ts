import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Append-only log of every AI invocation by a user.
 *
 * Distinct from `Conversation` + `Message` (which model chat threads).
 * This collection is the *audit + cost ledger* — used for:
 *   · Usage dashboards & per-user quotas
 *   · Cost attribution per workspace / project
 *   · Debugging failed runs (status + error + latency)
 *   · Future: rate-limit / abuse detection
 */

export const AI_KINDS = [
  "chat",
  "summary",
  "draft",
  "plan",
  "transform",
  "embedding",
  "classification",
] as const;
export type AIKind = (typeof AI_KINDS)[number];

export const AI_PROVIDERS = [
  "openai",
  "openrouter",
  "anthropic",
  "google",
  "local",
  "demo",
] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

export const AI_STATUSES = [
  "success",
  "error",
  "timeout",
  "blocked",
  "rate_limited",
] as const;
export type AIStatus = (typeof AI_STATUSES)[number];

const TokenUsageSchema = new Schema(
  {
    input: { type: Number, default: 0, min: 0 },
    output: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const AIHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    /** Optional thread link — chat invocations point at their Conversation. */
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },

    kind: { type: String, enum: AI_KINDS, required: true },
    provider: { type: String, enum: AI_PROVIDERS, required: true },
    model: { type: String, required: true, trim: true },

    /** We persist truncated copies for the audit view — full bodies live
     *  in `Message` for chat or are not stored at all for one-shots. */
    promptPreview: { type: String, default: "", maxlength: 2000 },
    responsePreview: { type: String, default: "", maxlength: 2000 },

    tokens: { type: TokenUsageSchema, default: () => ({}) },
    costUsd: { type: Number, default: 0, min: 0 },
    latencyMs: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: AI_STATUSES, required: true, index: true },
    error: { type: String, default: null },

    /** Free-form metadata — tool calls, sources, safety flags, request id. */
    meta: { type: Schema.Types.Mixed, default: null },
    requestId: { type: String, default: null, index: true },
  },
  { timestamps: true, collection: "ai_history" }
);

// Per-workspace usage dashboard: "show me last 30 days of runs in WS X".
AIHistorySchema.index({ workspace: 1, createdAt: -1 });
// Per-user usage / quotas.
AIHistorySchema.index({ user: 1, createdAt: -1 });
// Cost reporting by provider/model.
AIHistorySchema.index({ workspace: 1, provider: 1, model: 1, createdAt: -1 });

export type AIHistoryDoc = InferSchemaType<typeof AIHistorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AIHistory: Model<AIHistoryDoc> =
  (mongoose.models.AIHistory as Model<AIHistoryDoc>) ||
  mongoose.model<AIHistoryDoc>("AIHistory", AIHistorySchema);
