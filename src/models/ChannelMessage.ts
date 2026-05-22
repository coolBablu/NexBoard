import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Message inside a team chat `Channel`. Kept separate from the AI
 * `Message` model so the two have independent indexes / pagination
 * patterns / retention rules.
 */

const AttachmentSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 240 },
    mime: { type: String, required: true, maxlength: 120 },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true, maxlength: 200_000 },
  },
  { _id: false }
);

const ChannelMessageSchema = new Schema(
  {
    channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 8_000 },
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attachments: { type: [AttachmentSchema], default: [] },
    /** Reply-in-thread anchor (null = top-level channel message). */
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "ChannelMessage",
      default: null,
    },
    editedAt: { type: Date, default: null },
    reactions: {
      type: Map,
      of: [Schema.Types.ObjectId],
      default: () => new Map(),
    },
  },
  { timestamps: true, collection: "channel_messages" }
);

ChannelMessageSchema.index({ channel: 1, createdAt: 1 });
ChannelMessageSchema.index({ workspace: 1, createdAt: -1 });

export type ChannelMessageDoc = InferSchemaType<typeof ChannelMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChannelMessage: Model<ChannelMessageDoc> =
  (mongoose.models.ChannelMessage as Model<ChannelMessageDoc>) ||
  mongoose.model<ChannelMessageDoc>("ChannelMessage", ChannelMessageSchema);
