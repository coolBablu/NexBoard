import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Threaded comments — attached to a task today, but the polymorphic
 * `target` field is forward-compatible with project comments / doc
 * comments / etc. Mentions are resolved at write-time so we can fan-out
 * notifications without re-parsing on every read.
 */

const AttachmentSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 240 },
    mime: { type: String, required: true, maxlength: 120 },
    /** Bytes — used for the UI badge. */
    size: { type: Number, required: true, min: 0 },
    /**
     * Storage URL. In demo mode this is a `data:` URL embedded inline; in
     * production this should point at S3 / R2 / Vercel Blob.
     */
    url: { type: String, required: true, maxlength: 200_000 },
  },
  { _id: false }
);

const CommentSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    target: {
      type: {
        type: String,
        enum: ["task", "project"],
        required: true,
      },
      id: { type: Schema.Types.ObjectId, required: true },
    },
    /** Parent comment for threaded replies (null = top-level). */
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 8_000 },
    /** Pre-resolved mention user-ids (parsed at write time). */
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attachments: { type: [AttachmentSchema], default: [] },
    editedAt: { type: Date, default: null },
    reactions: {
      type: Map,
      of: [Schema.Types.ObjectId],
      default: () => new Map(),
    },
  },
  { timestamps: true, collection: "comments" }
);

CommentSchema.index({ "target.type": 1, "target.id": 1, createdAt: 1 });
CommentSchema.index({ workspace: 1, createdAt: -1 });

export type CommentDoc = InferSchemaType<typeof CommentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Comment: Model<CommentDoc> =
  (mongoose.models.Comment as Model<CommentDoc>) ||
  mongoose.model<CommentDoc>("Comment", CommentSchema);
