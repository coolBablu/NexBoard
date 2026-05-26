import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Shared uploaded file (image, doc, attachment) stored at the
 * workspace level. The actual bytes live in `data` for the MongoDB
 * storage backend, or in `externalUrl` when stored on Vercel Blob /
 * S3 / R2 etc. Streamed back via /api/files/[id].
 *
 * Files can be linked to any of: a chat message, a task comment, a
 * project, or none (free-floating in the Files library).
 */

const UploadedFileSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 240 },
    mime: { type: String, required: true, maxlength: 120 },
    size: { type: Number, required: true, min: 0 },

    /** "mongo" = bytes in `data`. "blob" = href in `externalUrl`. */
    storage: {
      type: String,
      enum: ["mongo", "blob"],
      default: "mongo",
      required: true,
    },
    /** Binary content (MongoDB storage backend only). Hidden by default. */
    data: { type: Buffer, default: null, select: false },
    /** CDN URL (Vercel Blob storage backend only). */
    externalUrl: { type: String, default: null },

    /** Optional linkage so we can show "files in this channel/task". */
    channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
      index: true,
    },
    message: {
      type: Schema.Types.ObjectId,
      ref: "ChannelMessage",
      default: null,
    },
    task: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    project: { type: Schema.Types.ObjectId, ref: "Project", default: null },
  },
  { timestamps: true, collection: "uploaded_files" }
);

UploadedFileSchema.index({ workspace: 1, createdAt: -1 });

export type UploadedFileDoc = InferSchemaType<typeof UploadedFileSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UploadedFile: Model<UploadedFileDoc> =
  (mongoose.models.UploadedFile as Model<UploadedFileDoc>) ||
  mongoose.model<UploadedFileDoc>("UploadedFile", UploadedFileSchema);

/** Per-file size cap. Keep MongoDB docs well under the 16 MB hard limit. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
