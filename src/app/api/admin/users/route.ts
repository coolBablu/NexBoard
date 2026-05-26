import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { dbConnect } from "@/lib/mongodb";
import { User, defaultPermissionsFor, USER_ROLES } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { Notification } from "@/models/Notification";
import {
  requireSuperAdmin,
  ensureDemoSuperAdmin,
  resolveInviteDomain,
  emailMatchesDomain,
} from "@/lib/admin";
import { badRequest, serverError } from "@/lib/api";
import { presenceFromLastSeen } from "@/lib/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 *   ?status=pending|active|suspended (optional filter)
 *   ?q=<search> (name/email)
 *
 * Returns every account in the system with admin metadata. Only the
 * super_admin role can call this.
 */
export async function GET(req: Request) {
  // Run the demo bootstrap before the auth check so the demo account
  // is always promotable even if the JWT was minted before role support
  // existed in the DB.
  await ensureDemoSuperAdmin();

  const guard = await requireSuperAdmin();
  if ("error" in guard) return guard.error;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const q = (searchParams.get("q") || "").trim();

    const where: Record<string, unknown> = {};
    if (
      statusFilter &&
      ["pending", "active", "suspended"].includes(statusFilter)
    ) {
      where.status = statusFilter;
    }
    if (q) {
      where.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(where, {
      name: 1,
      email: 1,
      image: 1,
      title: 1,
      role: 1,
      status: 1,
      lastSeenAt: 1,
      createdAt: 1,
      approvedAt: 1,
      permissions: 1,
    })
      .sort({ status: 1, createdAt: -1 })
      .limit(500)
      .lean();

    const pendingCount = await User.countDocuments({ status: "pending" });
    const activeCount = await User.countDocuments({ status: "active" });
    const suspendedCount = await User.countDocuments({ status: "suspended" });

    return NextResponse.json({
      counts: {
        pending: pendingCount,
        active: activeCount,
        suspended: suspendedCount,
        total: pendingCount + activeCount + suspendedCount,
      },
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        image:
          u.image ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            u.email
          )}`,
        title: u.title || null,
        role: u.role || "member",
        status: u.status || "active",
        presence: presenceFromLastSeen(u.lastSeenAt as Date | null),
        createdAt: u.createdAt,
        approvedAt: u.approvedAt || null,
        permissions: u.permissions || defaultPermissionsFor("member"),
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

const inviteSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  role: z.enum(USER_ROLES).default("member"),
  // Optional initial password — if omitted, generates a random one and
  // returns it in the response so the admin can hand it off.
  password: z.string().min(8).max(128).optional(),
});

/**
 * POST /api/admin/users
 *   Create a new account directly (skips the public signup flow).
 *   The new user is `active` from the start because the admin
 *   explicitly created them.
 */
export async function POST(req: Request) {
  const guard = await requireSuperAdmin();
  if ("error" in guard) return guard.error;
  const { actor } = guard;

  try {
    await dbConnect();
    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }
    const { name, email, role } = parsed.data;
    const lower = email.toLowerCase();

    // Enforce company email domain (if one is configured / derivable).
    // Defaults to the super-admin's own domain so a workspace owned by
    // alex@acme.com can only invite *@acme.com accounts.
    const inviteDomain = resolveInviteDomain(actor.email);
    if (!emailMatchesDomain(lower, inviteDomain)) {
      return NextResponse.json(
        {
          error: `Use a company email — only @${inviteDomain} addresses can be invited.`,
        },
        { status: 422 }
      );
    }

    const existing = await User.findOne({ email: lower });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const plain =
      parsed.data.password ||
      // 12-char random ASCII password — admin can rotate it later.
      Math.random().toString(36).slice(2, 8) +
        Math.random().toString(36).slice(2, 8);
    const passwordHash = await bcrypt.hash(plain, 12);

    const user = await User.create({
      name,
      email: lower,
      passwordHash,
      role,
      status: "active",
      approvedAt: new Date(),
      approvedBy: actor.id,
      permissions: defaultPermissionsFor(role),
    });

    // Add to the actor's default workspace so they show up in /team.
    const actorRecord = await User.findById(actor.id, {
      defaultWorkspace: 1,
    }).lean();
    if (actorRecord?.defaultWorkspace) {
      await Workspace.updateOne(
        {
          _id: actorRecord.defaultWorkspace,
          "members.user": { $ne: user._id },
        },
        {
          $push: {
            members: {
              user: user._id,
              role: role === "super_admin" ? "owner" : "member",
            },
          },
        }
      );
      user.defaultWorkspace = actorRecord.defaultWorkspace;
      await user.save();

      // Welcome notification.
      await Notification.create({
        recipient: user._id,
        workspace: actorRecord.defaultWorkspace,
        actor: actor.id,
        kind: "project_invite",
        priority: "normal",
        title: `Welcome to the workspace`,
        body: `${actor.name || actor.email} added you to the team.`,
        url: "/dashboard",
      });
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
        // Only returned when the admin DIDN'T supply a password, so they
        // can share it with the new user out-of-band.
        temporaryPassword: parsed.data.password ? undefined : plain,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
