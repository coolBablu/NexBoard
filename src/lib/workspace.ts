import { User } from "@/models/User";
import { Workspace, type WorkspaceDoc } from "@/models/Workspace";
import type { Types } from "mongoose";

/**
 * Resolve the user's default workspace.
 *   1. If `user.defaultWorkspace` is set and still exists -> use it.
 *   2. Otherwise, prefer any existing workspace the user is already a
 *      member of (admin-invited members get auto-attached here).
 *   3. Only as a last resort, bootstrap a brand-new personal workspace.
 *
 * Without step 2, invited members would silently end up in their own
 * isolated workspace and stop seeing the admin's channels, files,
 * notifications, etc.
 */
export async function getOrCreateDefaultWorkspace(
  userId: string
): Promise<WorkspaceDoc & { _id: Types.ObjectId }> {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.defaultWorkspace) {
    const ws = await Workspace.findById(user.defaultWorkspace);
    if (ws) return ws as WorkspaceDoc & { _id: Types.ObjectId };
  }

  // Prefer an existing membership over creating a new workspace.
  const existing = await Workspace.findOne({ "members.user": user._id }).sort({
    createdAt: 1,
  });
  if (existing) {
    user.defaultWorkspace = existing._id;
    await user.save();
    return existing as WorkspaceDoc & { _id: Types.ObjectId };
  }

  const base = (user.name || user.email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
  const slug = `${base}-${String(user._id).slice(-6)}`;

  const ws = await Workspace.create({
    name: `${user.name?.split(" ")[0] || "My"}'s workspace`,
    slug,
    owner: user._id,
    members: [{ user: user._id, role: "owner" }],
  });

  user.defaultWorkspace = ws._id;
  await user.save();

  return ws as WorkspaceDoc & { _id: Types.ObjectId };
}
