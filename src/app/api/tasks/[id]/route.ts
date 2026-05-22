import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { Task, TASK_COLUMNS, TASK_PRIORITIES } from "@/models/Task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { Activity } from "@/models/Activity";
import { requireSession, badRequest, serverError, notFound } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { notifyMany } from "@/lib/notifications";
import { toObjectId } from "@/lib/db/queries";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  column: z.enum(TASK_COLUMNS).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  done: z.boolean().optional(),
  order: z.number().int().optional(),
  assignees: z.array(z.string()).max(20).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid task id");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const prev = await Task.findOne({ _id: id, workspace: ws._id });
    if (!prev) return notFound("Task not found");

    const { assignees: assigneeIds, ...rest } = parsed.data;
    const update: Record<string, unknown> = { ...rest };

    // Auto-set done when moved to 'done' column
    if (update.column === "done" && update.done === undefined) {
      update.done = true;
    }

    let newlyAssigned: string[] = [];
    if (assigneeIds) {
      const memberIds = new Set(
        (ws.members ?? []).map((m) => String(m.user))
      );
      const filtered = assigneeIds
        .filter((id) => memberIds.has(id))
        .map((id) => toObjectId(id)!)
        .filter(Boolean);
      update.assignees = filtered;
      const prevSet = new Set((prev.assignees || []).map(String));
      newlyAssigned = filtered
        .map(String)
        .filter((id) => !prevSet.has(id) && id !== session.user.id);
    }

    const task = await Task.findByIdAndUpdate(prev._id, { $set: update }, { new: true });
    if (!task) return notFound("Task not found");

    // Log meaningful state changes
    if (parsed.data.column && parsed.data.column !== prev.column) {
      await Activity.create({
        workspace: ws._id,
        actor: session.user.id,
        type: "task_moved",
        text: `moved '${task.title}' → ${task.column}`,
        refType: "task",
        refId: task._id,
      });
    } else if (parsed.data.done === true && !prev.done) {
      await Activity.create({
        workspace: ws._id,
        actor: session.user.id,
        type: "task_completed",
        text: `completed '${task.title}'`,
        refType: "task",
        refId: task._id,
      });
    }

    if (newlyAssigned.length) {
      await notifyMany(newlyAssigned, {
        workspace: ws._id,
        actor: session.user.id,
        kind: "assigned",
        priority: "high",
        title: `You were assigned to '${task.title}'`,
        body: task.description?.slice(0, 240) || "",
        url: `/workspace?task=${task._id}`,
        entity: { type: "task", id: task._id },
      });
    }

    return NextResponse.json({
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
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid task id");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const task = await Task.findOneAndDelete({ _id: id, workspace: ws._id });
    if (!task) return notFound("Task not found");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
