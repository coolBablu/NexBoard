import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongodb";
import { User, defaultPermissionsFor } from "@/models/User";

/**
 * Always re-fetch the user's role from the DB rather than trusting the
 * JWT — admin-only endpoints are the most security-sensitive surface
 * in the app, and we'd rather pay one query than ship a stale role.
 */
export async function requireSuperAdmin() {
  await dbConnect();
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const me = await User.findById(session.user.id, {
    role: 1,
    status: 1,
    email: 1,
    name: 1,
  }).lean();

  if (!me) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (me.role !== "super_admin" || me.status !== "active") {
    return {
      error: NextResponse.json(
        { error: "Forbidden — super admin only" },
        { status: 403 }
      ),
    };
  }

  return {
    actor: {
      id: String(me._id),
      email: me.email,
      name: me.name,
      role: me.role,
    },
  };
}

/**
 * Idempotent bootstrap. Runs lazily on every /admin hit.
 *
 *  · If the canonical demo account exists, promote it to super_admin.
 *  · Otherwise (Atlas / production), find the earliest registered
 *    user and promote *them* to super_admin — but ONLY if no
 *    super_admin exists yet. This is the upgrade path for accounts
 *    that signed up BEFORE the RBAC system shipped.
 */
export async function ensureDemoSuperAdmin(email = "demo@novaflow.app") {
  await dbConnect();

  // Path 1: explicit demo account.
  const demo = await User.findOne({ email: email.toLowerCase() });
  if (demo) {
    const patch: Record<string, unknown> = {};
    if (demo.role !== "super_admin") patch.role = "super_admin";
    if (demo.status !== "active") {
      patch.status = "active";
      patch.approvedAt = new Date();
    }
    patch.permissions = defaultPermissionsFor("super_admin");
    if (Object.keys(patch).length) {
      await User.updateOne({ _id: demo._id }, { $set: patch });
    }
    return demo._id;
  }

  // Path 2: no demo. Promote the earliest user if there's no admin yet.
  const existingAdmin = await User.findOne({
    role: "super_admin",
    status: "active",
  });
  if (existingAdmin) return existingAdmin._id;

  const earliest = await User.findOne({}).sort({ createdAt: 1 });
  if (!earliest) return null;

  await User.updateOne(
    { _id: earliest._id },
    {
      $set: {
        role: "super_admin",
        status: "active",
        approvedAt: earliest.approvedAt ?? new Date(),
        permissions: defaultPermissionsFor("super_admin"),
      },
    }
  );
  return earliest._id;
}
