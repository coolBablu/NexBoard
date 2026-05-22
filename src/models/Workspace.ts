import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const MemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "guest"],
      default: "member",
    },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const WorkspaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [MemberSchema], default: [] },
    icon: { type: String, default: "✨" },
  },
  { timestamps: true, collection: "workspaces" }
);

export type WorkspaceDoc = InferSchemaType<typeof WorkspaceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Workspace: Model<WorkspaceDoc> =
  (mongoose.models.Workspace as Model<WorkspaceDoc>) ||
  mongoose.model<WorkspaceDoc>("Workspace", WorkspaceSchema);
