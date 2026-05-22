import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Short-lived single-use token that lets a user set a new password.
 *
 *  · `tokenHash` stores SHA-256 of the random token (we never persist the raw)
 *  · `expiresAt` TTL is enforced both by app logic and a MongoDB TTL index
 *  · `usedAt` makes the token single-use so reset links can't be replayed
 */
const PasswordResetTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    // No `index: true` here — the TTL declaration below is the single
    // source of truth (declaring both produces a Mongoose duplicate-
    // index warning at startup).
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    requestIp: { type: String, default: null },
  },
  { timestamps: true, collection: "password_reset_tokens" }
);

// TTL — Mongo will auto-delete expired tokens. The {expireAfterSeconds: 0}
// means: drop the document once `expiresAt` is in the past.
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDoc = InferSchemaType<
  typeof PasswordResetTokenSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const PasswordResetToken: Model<PasswordResetTokenDoc> =
  (mongoose.models.PasswordResetToken as Model<PasswordResetTokenDoc>) ||
  mongoose.model<PasswordResetTokenDoc>(
    "PasswordResetToken",
    PasswordResetTokenSchema
  );
