import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/mongodb";
import { User, defaultPermissionsFor } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { badRequest, serverError } from "@/lib/api";
import { rateLimit, tooMany } from "@/lib/rate-limit";

const signupSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  workspaceSlug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and dashes"),
});

/**
 * POST /api/signup
 *
 * Self-serve sign-up is permanently disabled in this app. The ONLY
 * exception is the very first account ever created in the database,
 * which bootstraps the workspace's super_admin. Every subsequent
 * member must be invited from /admin by a super_admin.
 */
export async function POST(req: Request) {
  // Brute-force protection: 5 attempts / 5 minutes / IP.
  const limited = rateLimit(req, { name: "signup", window: "5m", limit: 5 });
  if (!limited.ok) return tooMany(limited);

  try {
    await dbConnect();

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const { firstName, lastName, email, password, workspaceSlug } = parsed.data;

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return NextResponse.json(
        {
          error:
            "Self-serve sign-up is disabled. Ask your workspace admin to invite you from /admin.",
        },
        { status: 403 }
      );
    }

    const slugTaken = await Workspace.findOne({ slug: workspaceSlug }).lean();
    if (slugTaken) {
      return NextResponse.json(
        { error: "Workspace URL is taken. Try another." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const name = `${firstName} ${lastName}`.trim();

    // Bootstrap path: first user is the workspace's super_admin.
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "super_admin",
      status: "active",
      approvedAt: new Date(),
      permissions: defaultPermissionsFor("super_admin"),
    });

    const workspace = await Workspace.create({
      name: `${firstName}'s workspace`,
      slug: workspaceSlug,
      owner: user._id,
      members: [{ user: user._id, role: "owner" }],
    });

    user.defaultWorkspace = workspace._id;
    await user.save();

    return NextResponse.json(
      {
        ok: true,
        bootstrap: true,
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
        workspace: {
          id: String(workspace._id),
          slug: workspace.slug,
          name: workspace.name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
