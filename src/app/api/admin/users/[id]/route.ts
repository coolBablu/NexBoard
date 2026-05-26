import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { dbConnect } from "@/lib/mongodb";
import {
  User,
  defaultPermissionsFor,
  USER_ROLES,
  ACCOUNT_STATUSES,
} from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { Notification } from "@/models/Notification";
import { requireSuperAdmin } from "@/lib/admin";
import { badRequest, notFound, serverError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(ACCOUNT_STATUSES).optional(),
    permissions: z
      .object({
        canInviteMembers: z.boolean().optional(),
        canAssignTasks: z.boolean().optional(),
        canManageProjects: z.boolean().optional(),
        canAccessAnalytics: z.boolean().optional(),
        canManageBilling: z.boolean().optional(),
      })
      .optional(),
    title: z.string().max(120).optional(),
  })
  .strict();

/**
 * PATCH /api/admin/users/[id]
 *   Update a user's role, status, permissions, or title.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSuperAdmin();
  if ("error" in guard) return guard.error;
  const { actor } = guard;

  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return badRequest("Invalid id");

    await dbConnect();
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const target = await User.findById(id);
    if (!target) return notFound("User not found");

    // Guard: prevent the super admin from accidentally demoting
    // themselves to a non-admin role if they're the LAST super admin.
    if (
      parsed.data.role &&
      parsed.data.role !== "super_admin" &&
      String(target._id) === actor.id
    ) {
      const otherAdmins = await User.countDocuments({
        _id: { $ne: target._id },
        role: "super_admin",
        status: "active",
      });
      if (otherAdmins === 0) {
        return badRequest(
          "You're the last super admin. Promote someone else first."
        );
      }
    }

    const patch: Record<string, unknown> = {};
    if (parsed.data.role) {
      patch.role = parsed.data.role;
      // When promoting/demoting, refresh the permission matrix to the
      // sensible defaults for the new role. Admin can still override.
      patch.permissions = defaultPermissionsFor(parsed.data.role);
    }
    if (parsed.data.status) {
      patch.status = parsed.data.status;
      if (parsed.data.status === "active" && !target.approvedAt) {
        patch.approvedAt = new Date();
        patch.approvedBy = actor.id;
      }
    }
    if (parsed.data.permissions) {
      patch.permissions = {
        ...(target.permissions ?? defaultPermissionsFor(target.role ?? "member")),
        ...parsed.data.permissions,
      };
    }
    if (parsed.data.title !== undefined) {
      patch.title = parsed.data.title || null;
    }

    await User.updateOne({ _id: target._id }, { $set: patch });

    // If we just activated someone, add them to the actor's workspace
    // and notify them they're in.
    if (parsed.data.status === "active" && target.status !== "active") {
      const actorRecord = await User.findById(actor.id, {
        defaultWorkspace: 1,
      }).lean();
      if (actorRecord?.defaultWorkspace) {
        await Workspace.updateOne(
          {
            _id: actorRecord.defaultWorkspace,
            "members.user": { $ne: target._id },
          },
          {
            $push: {
              members: { user: target._id, role: "member" },
            },
          }
        );
        if (!target.defaultWorkspace) {
          await User.updateOne(
            { _id: target._id },
            { $set: { defaultWorkspace: actorRecord.defaultWorkspace } }
          );
        }
        await Notification.create({
          recipient: target._id,
          workspace: actorRecord.defaultWorkspace,
          actor: actor.id,
          kind: "project_invite",
          priority: "high",
          title: "You're in! Welcome to the workspace.",
          body: `${actor.name || actor.email} approved your account.`,
          url: "/dashboard",
        });
      }
    }

    const fresh = await User.findById(target._id, {
      name: 1,
      email: 1,
      role: 1,
      status: 1,
      permissions: 1,
      title: 1,
      approvedAt: 1,
    }).lean();

    return NextResponse.json({ ok: true, user: fresh });
  } catch (err) {
    return serverError(err);
  }
}

/**
 * DELETE /api/admin/users/[id]
 *   Hard-removes a user from the system. Also removes them from every
 *   workspace they belong to.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSuperAdmin();
  if ("error" in guard) return guard.error;
  const { actor } = guard;

  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return badRequest("Invalid id");
    if (id === actor.id) {
      return badRequest("You can't delete your own account from here.");
    }

    await dbConnect();
    const target = await User.findById(id);
    if (!target) return notFound("User not found");

    // Block deleting the last super admin.
    if (target.role === "super_admin") {
      const otherAdmins = await User.countDocuments({
        _id: { $ne: target._id },
        role: "super_admin",
        status: "active",
      });
      if (otherAdmins === 0) {
        return badRequest("Cannot delete the last super admin.");
      }
    }

    await Workspace.updateMany(
      { "members.user": target._id },
      { $pull: { members: { user: target._id } } }
    );
    await User.deleteOne({ _id: target._id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
