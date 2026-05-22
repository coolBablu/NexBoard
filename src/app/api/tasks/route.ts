import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import {
  Task,
  TASK_COLUMNS,
  TASK_PRIORITIES,
} from "@/models/Task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { Project } from "@/models/Project";
import { Activity } from "@/models/Activity";
import { requireSession, badRequest, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  projectId: z.string(),
  column: z.enum(TASK_COLUMNS).optional().default("backlog"),
  priority: z.enum(TASK_PRIORITIES).optional().default("med"),
  tag: z
    .object({ label: z.string().min(1).max(40), color: z.string().min(1).max(120) })
    .optional()
    .nullable(),
  aiAssisted: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const filter: Record<string, unknown> = { workspace: ws._id };
    if (projectId && Types.ObjectId.isValid(projectId)) {
      filter.project = projectId;
    }

    const tasks = await Task.find(filter)
      .sort({ column: 1, order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      tasks: tasks.map((t) => ({
        id: String(t._id),
        title: t.title,
        description: t.description,
        project: String(t.project),
        column: t.column,
        priority: t.priority,
        tag: t.tag,
        assignees: (t.assignees || []).map(String),
        aiAssisted: t.aiAssisted,
        commentsCount: t.commentsCount,
        attachmentsCount: t.attachmentsCount,
        done: t.done,
        order: t.order,
        createdAt: t.createdAt,
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

    if (!Types.ObjectId.isValid(parsed.data.projectId)) {
      return badRequest("Invalid project id");
    }

    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const project = await Project.findOne({
      _id: parsed.data.projectId,
      workspace: ws._id,
    }).lean();
    if (!project) return badRequest("Project not found");

    // Append to end of target column
    const last = await Task.findOne({
      workspace: ws._id,
      column: parsed.data.column,
    })
      .sort({ order: -1 })
      .lean();
    const order = (last?.order ?? 0) + 10;

    const task = await Task.create({
      title: parsed.data.title,
      description: parsed.data.description,
      project: project._id,
      workspace: ws._id,
      column: parsed.data.column,
      priority: parsed.data.priority,
      tag: parsed.data.tag ?? null,
      aiAssisted: parsed.data.aiAssisted,
      assignees: [session.user.id],
      createdBy: session.user.id,
      order,
    });

    await Activity.create({
      workspace: ws._id,
      actor: session.user.id,
      type: "task_created",
      text: `created task '${task.title}'`,
      refType: "task",
      refId: task._id,
    });

    return NextResponse.json(
      {
        id: String(task._id),
        title: task.title,
        project: String(task.project),
        column: task.column,
        priority: task.priority,
        tag: task.tag,
        assignees: (task.assignees || []).map(String),
        aiAssisted: task.aiAssisted,
        commentsCount: task.commentsCount,
        attachmentsCount: task.attachmentsCount,
        done: task.done,
        order: task.order,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
