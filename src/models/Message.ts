import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const MESSAGE_ROLES = ["user", "assistant", "system"] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true },
    // Optional metadata for tool calls / sources / model name
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "messages" }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

export type MessageDoc = InferSchemaType<typeof MessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Message: Model<MessageDoc> =
  (mongoose.models.Message as Model<MessageDoc>) ||
  mongoose.model<MessageDoc>("Message", MessageSchema);
