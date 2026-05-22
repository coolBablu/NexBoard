import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const TASK_COLUMNS = ["backlog", "progress", "review", "done"] as const;
export type TaskColumn = (typeof TASK_COLUMNS)[number];

export const TASK_PRIORITIES = ["low", "med", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

const TaskTagSchema = new Schema(
  {
    label: { type: String, required: true },
    // Pre-defined Tailwind class strings the UI maps directly
    color: { type: String, required: true },
  },
  { _id: false }
);

const TaskSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    column: { type: String, enum: TASK_COLUMNS, default: "backlog", index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "med" },
    tag: { type: TaskTagSchema, default: null },
    assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    aiAssisted: { type: Boolean, default: false },
    commentsCount: { type: Number, default: 0 },
    attachmentsCount: { type: Number, default: 0 },
    done: { type: Boolean, default: false },
    dueAt: { type: Date, default: null },
    // Sort order within a column (for drag-and-drop reordering)
    order: { type: Number, default: 0, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, collection: "tasks" }
);

TaskSchema.index({ workspace: 1, column: 1, order: 1 });

export type TaskDoc = InferSchemaType<typeof TaskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Task: Model<TaskDoc> =
  (mongoose.models.Task as Model<TaskDoc>) ||
  mongoose.model<TaskDoc>("Task", TaskSchema);
