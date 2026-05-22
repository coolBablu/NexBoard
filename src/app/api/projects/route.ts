import { NextResponse } from "next/server";
import { z } from "zod";

import { Project, PROJECT_ICONS, PROJECT_STATUSES } from "@/models/Project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { Activity } from "@/models/Activity";
import { requireSession, badRequest, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(""),
  icon: z.enum(PROJECT_ICONS).optional().default("folder"),
  color: z.string().max(200).optional(),
  status: z.enum(PROJECT_STATUSES).optional().default("Planning"),
  progress: z.number().min(0).max(100).optional().default(0),
});

export async function GET() {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const projects = await Project.find({ workspace: ws._id })
      .sort({ starred: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json({
      workspace: { id: String(ws._id), name: ws.name, slug: ws.slug },
      projects: projects.map((p) => ({
        id: String(p._id),
        name: p.name,
        description: p.description,
        icon: p.icon,
        color: p.color,
        status: p.status,
        progress: p.progress,
        starred: p.starred,
        members: (p.members || []).map(String),
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const project = await Project.create({
      ...parsed.data,
      workspace: ws._id,
      createdBy: session.user.id,
      members: [session.user.id],
    });

    await Activity.create({
      workspace: ws._id,
      actor: session.user.id,
      type: "project_created",
      text: `created project '${project.name}'`,
      refType: "project",
      refId: project._id,
    });

    return NextResponse.json(
      {
        id: String(project._id),
        name: project.name,
        description: project.description,
        icon: project.icon,
        color: project.color,
        status: project.status,
        progress: project.progress,
        starred: project.starred,
        members: (project.members || []).map(String),
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
