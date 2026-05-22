import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * In-app notification — surfaced in the topbar bell, inbox page, and the
 * "Recent activity" surface on the dashboard. Designed to be cheap to
 * write (fire-and-forget from API routes) and cheap to read (indexed for
 * the most common access pattern: a user's unread feed for a workspace).
 */

export const NOTIFICATION_KINDS = [
  "mention",
  "assigned",
  "comment",
  "project_invite",
  "due_soon",
  "ai_insight",
  "anomaly",
  "system",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_PRIORITIES = ["low", "normal", "high"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

/** Polymorphic reference to the entity that produced the notification. */
const EntityRefSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["task", "project", "comment", "conversation", "user", "workspace"],
      required: true,
    },
    id: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const NotificationSchema = new Schema(
  {
    recipient: {
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
    actor: {
      // Null for system / AI notifications.
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    kind: { type: String, enum: NOTIFICATION_KINDS, required: true },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: "normal",
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, default: "", maxlength: 1000 },
    entity: { type: EntityRefSchema, default: null },
    /** Deep link the user is taken to when they click the notification. */
    url: { type: String, default: null },
    readAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "notifications" }
);

// Hot path: "give me the unread feed for user X in workspace Y, newest first".
NotificationSchema.index({
  recipient: 1,
  workspace: 1,
  readAt: 1,
  createdAt: -1,
});
// For bell badge counts.
NotificationSchema.index({ recipient: 1, readAt: 1 });

export type NotificationDoc = InferSchemaType<typeof NotificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Notification: Model<NotificationDoc> =
  (mongoose.models.Notification as Model<NotificationDoc>) ||
  mongoose.model<NotificationDoc>("Notification", NotificationSchema);
