import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    // Hashed (bcrypt) — only present for credentials-based accounts.
    passwordHash: { type: String, default: null, select: false },
    title: { type: String, default: null },
    defaultWorkspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    /** Optional display handle for @mentions (defaults to slug of email). */
    handle: { type: String, default: null, lowercase: true, trim: true, index: true },
    /** Self-set status (e.g. "🌴 OOO", "🎧 deep work"). */
    status: { type: String, default: null, maxlength: 80 },
    /** Updated on every heartbeat; presence "online" = within 90 s. */
    lastSeenAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: "users" }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", UserSchema);
