import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { Project, PROJECT_STATUSES } from "@/models/Project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { Task } from "@/models/Task";
import {
  requireSession,
  badRequest,
  serverError,
  notFound,
} from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  progress: z.number().min(0).max(100).optional(),
  starred: z.boolean().optional(),
  color: z.string().max(200).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid project id");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const project = await Project.findOneAndUpdate(
      { _id: id, members: session.user.id },
      { $set: parsed.data },
      { new: true }
    );
    if (!project) return notFound("Project not found");

    return NextResponse.json({
      id: String(project._id),
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      starred: project.starred,
      color: project.color,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid project id");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const project = await Project.findOneAndDelete({
      _id: id,
      members: session.user.id,
    });
    if (!project) return notFound("Project not found");

    await Task.deleteMany({ project: project._id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
