import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ConversationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    title: { type: String, default: "New chat", trim: true },
    preview: { type: String, default: "" },
    lastMessageAt: { type: Date, default: () => new Date(), index: true },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "conversations" }
);

ConversationSchema.index({ user: 1, lastMessageAt: -1 });

export type ConversationDoc = InferSchemaType<typeof ConversationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Conversation: Model<ConversationDoc> =
  (mongoose.models.Conversation as Model<ConversationDoc>) ||
  mongoose.model<ConversationDoc>("Conversation", ConversationSchema);
