import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Team chat channel — either a named workspace channel (#general, #design)
 * or a direct-message thread between members. `members` is empty for
 * public channels (= all workspace members can join).
 */

export const CHANNEL_TYPES = ["channel", "dm"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

const ChannelSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    type: { type: String, enum: CHANNEL_TYPES, default: "channel", index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    topic: { type: String, default: "", maxlength: 240 },
    icon: { type: String, default: "#" },
    /** Empty array = public (all workspace members). For DMs, the two participants. */
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPrivate: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date, default: () => new Date(), index: true },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "channels" }
);

ChannelSchema.index({ workspace: 1, lastMessageAt: -1 });
ChannelSchema.index(
  { workspace: 1, name: 1 },
  { unique: true, partialFilterExpression: { type: "channel" } }
);

export type ChannelDoc = InferSchemaType<typeof ChannelSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Channel: Model<ChannelDoc> =
  (mongoose.models.Channel as Model<ChannelDoc>) ||
  mongoose.model<ChannelDoc>("Channel", ChannelSchema);
