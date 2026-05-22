import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ACTIVITY_TYPES = [
  "task_created",
  "task_completed",
  "task_moved",
  "project_created",
  "project_updated",
  "comment_added",
  "ai_summary",
  "member_joined",
  "anomaly_flagged",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const ActivitySchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    text: { type: String, required: true },
    refType: { type: String, default: null }, // e.g. "task", "project"
    refId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, collection: "activities" }
);

ActivitySchema.index({ workspace: 1, createdAt: -1 });

export type ActivityDoc = InferSchemaType<typeof ActivitySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Activity: Model<ActivityDoc> =
  (mongoose.models.Activity as Model<ActivityDoc>) ||
  mongoose.model<ActivityDoc>("Activity", ActivitySchema);
