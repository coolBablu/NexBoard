import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { Notification } from "@/models/Notification";
import { requireSuperAdmin } from "@/lib/admin";
import { badRequest, notFound, serverError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/[id]/approve
 *   One-tap shortcut for the most common pending-queue action.
 *   Equivalent to PATCH { status: "active" } but also adds the user
 *   to the actor's default workspace.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSuperAdmin();
  if ("error" in guard) return guard.error;
  const { actor } = guard;

  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return badRequest("Invalid id");

    await dbConnect();
    const target = await User.findById(id);
    if (!target) return notFound("User not found");
    if (target.status === "active") {
      return NextResponse.json({ ok: true, alreadyActive: true });
    }

    await User.updateOne(
      { _id: target._id },
      {
        $set: {
          status: "active",
          approvedAt: new Date(),
          approvedBy: actor.id,
        },
      }
    );

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
          $push: { members: { user: target._id, role: "member" } },
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
        title: "You're approved — welcome to the workspace.",
        body: `${actor.name || actor.email} just approved your account.`,
        url: "/dashboard",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
