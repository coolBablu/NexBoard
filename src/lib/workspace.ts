import { User } from "@/models/User";
import { Workspace, type WorkspaceDoc } from "@/models/Workspace";
import type { Types } from "mongoose";

/**
 * Resolve the user's default workspace. If none exists yet (e.g. for
 * OAuth-created accounts), bootstrap one automatically.
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

  // Bootstrap: deterministic slug from user id
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
