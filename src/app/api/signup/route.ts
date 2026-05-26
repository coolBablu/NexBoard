import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/mongodb";
import { User, defaultPermissionsFor } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { Notification } from "@/models/Notification";
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

export async function POST(req: Request) {
  // Brute-force protection: 5 signups / 10 minutes / IP.
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

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
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

    // The very first account in the DB is bootstrapped as an active
    // super_admin (the workspace owner). Every subsequent sign-up
    // lands in `pending` and shows up in the /admin queue until a
    // super_admin approves them.
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    const role = isFirstUser ? "super_admin" : "member";
    const status = isFirstUser ? "active" : "pending";

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status,
      approvedAt: isFirstUser ? new Date() : null,
      permissions: defaultPermissionsFor(role),
    });

    const workspace = await Workspace.create({
      name: `${firstName}'s workspace`,
      slug: workspaceSlug,
      owner: user._id,
      members: [{ user: user._id, role: isFirstUser ? "owner" : "member" }],
    });

    user.defaultWorkspace = workspace._id;
    await user.save();

    // Fire-and-forget: notify every super_admin that a new user is
    // waiting for approval. They'll see it in their bell + /inbox.
    if (!isFirstUser) {
      try {
        const admins = await User.find({ role: "super_admin" }, { _id: 1 }).lean();
        if (admins.length) {
          await Notification.insertMany(
            admins.map((a) => ({
              recipient: a._id,
              workspace: workspace._id,
              actor: user._id,
              kind: "project_invite",
              priority: "high",
              title: `${name} wants to join your workspace`,
              body: `${email} just signed up. Approve or assign a role from Admin.`,
              entity: { type: "user", id: user._id },
              url: "/admin?tab=pending",
            }))
          );
        }
      } catch (err) {
        console.warn("[signup] could not notify admins", err);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        pending: status === "pending",
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
