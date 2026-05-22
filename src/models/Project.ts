import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const PROJECT_STATUSES = [
  "Active",
  "Planning",
  "Shipped",
  "At risk",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_ICONS = [
  "rocket",
  "credit-card",
  "cpu",
  "palette",
  "line-chart",
  "shield",
  "sparkles",
  "folder",
] as const;
export type ProjectIcon = (typeof PROJECT_ICONS)[number];

const ProjectSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    icon: { type: String, enum: PROJECT_ICONS, default: "folder" },
    color: {
      type: String,
      // Tailwind gradient class — chosen at create-time
      default: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: "Planning",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    starred: { type: Boolean, default: false },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, collection: "projects" }
);

ProjectSchema.index({ workspace: 1, createdAt: -1 });

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project: Model<ProjectDoc> =
  (mongoose.models.Project as Model<ProjectDoc>) ||
  mongoose.model<ProjectDoc>("Project", ProjectSchema);
