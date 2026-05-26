import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const USER_ROLES = ["super_admin", "admin", "member"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ["pending", "active", "suspended"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

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
    /** Self-set presence label (e.g. "🌴 OOO", "🎧 deep work"). */
    presenceText: { type: String, default: null, maxlength: 80 },
    /** Updated on every heartbeat; presence "online" = within 90 s. */
    lastSeenAt: { type: Date, default: null, index: true },

    // ── Super-admin / RBAC system ────────────────────────────────────
    /** Global role across the app. `super_admin` is the workspace owner. */
    role: {
      type: String,
      enum: USER_ROLES,
      default: "member",
      index: true,
    },
    /**
     * Account lifecycle status. New sign-ups land in `pending` and must
     * be approved by a super_admin before they can log in. The demo /
     * first user is bootstrapped as `active` super_admin.
     */
    status: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: "pending",
      index: true,
    },
    approvedAt: { type: Date, default: null },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    /** Fine-grained capabilities — overrides role defaults. */
    permissions: {
      canInviteMembers: { type: Boolean, default: false },
      canAssignTasks: { type: Boolean, default: true },
      canManageProjects: { type: Boolean, default: false },
      canAccessAnalytics: { type: Boolean, default: true },
      canManageBilling: { type: Boolean, default: false },
    },
  },
  { timestamps: true, collection: "users" }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", UserSchema);

/** Permission set granted to a role by default. */
export function defaultPermissionsFor(role: UserRole) {
  if (role === "super_admin") {
    return {
      canInviteMembers: true,
      canAssignTasks: true,
      canManageProjects: true,
      canAccessAnalytics: true,
      canManageBilling: true,
    };
  }
  if (role === "admin") {
    return {
      canInviteMembers: true,
      canAssignTasks: true,
      canManageProjects: true,
      canAccessAnalytics: true,
      canManageBilling: false,
    };
  }
  return {
    canInviteMembers: false,
    canAssignTasks: true,
    canManageProjects: false,
    canAccessAnalytics: true,
    canManageBilling: false,
  };
}
