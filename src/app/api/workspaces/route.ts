import { NextResponse } from "next/server";
import { z } from "zod";

import { Workspace } from "@/models/Workspace";
import { User } from "@/models/User";
import { requireSession, badRequest, serverError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().max(4).optional(),
});

/** GET — list all workspaces the user is a member of, with role + counts. */
export async function GET() {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const user = await User.findById(session.user.id, {
      defaultWorkspace: 1,
    }).lean();

    const workspaces = await Workspace.find({ "members.user": session.user.id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      defaultWorkspaceId: user?.defaultWorkspace
        ? String(user.defaultWorkspace)
        : null,
      workspaces: workspaces.map((w) => {
        const me = (w.members ?? []).find(
          (m) => String(m.user) === String(session.user.id)
        );
        return {
          id: String(w._id),
          name: w.name,
          slug: w.slug,
          icon: w.icon,
          role: me?.role ?? "member",
          memberCount: (w.members ?? []).length,
        };
      }),
    });
  } catch (err) {
    return serverError(err);
  }
}

/** POST — create a new workspace, set it as the user's default. */
export async function POST(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const base = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "workspace";
    const slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;

    const ws = await Workspace.create({
      name: parsed.data.name,
      slug,
      icon: parsed.data.icon ?? "✨",
      owner: session.user.id,
      members: [{ user: session.user.id, role: "owner" }],
    });

    await User.updateOne(
      { _id: session.user.id },
      { $set: { defaultWorkspace: ws._id } }
    );

    return NextResponse.json(
      { id: String(ws._id), name: ws.name, slug: ws.slug },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
