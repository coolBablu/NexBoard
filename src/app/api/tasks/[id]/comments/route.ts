import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { Task } from "@/models/Task";
import { Comment } from "@/models/Comment";
import { User } from "@/models/User";
import { Activity } from "@/models/Activity";
import { requireSession, badRequest, notFound, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { parseMentions, resolveMentionsToIds, handleFor } from "@/lib/mentions";
import { notifyMany, notify } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const attachmentSchema = z.object({
  name: z.string().min(1).max(240),
  mime: z.string().min(1).max(120),
  size: z.number().min(0),
  url: z.string().max(200_000),
});

const createSchema = z.object({
  body: z.string().min(1).max(8000),
  attachments: z.array(attachmentSchema).max(6).optional().default([]),
});

/** GET — chronological thread for the task. */
export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid task id");
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const task = await Task.findOne({ _id: id, workspace: ws._id });
    if (!task) return notFound("Task not found");

    const comments = await Comment.find({
      "target.type": "task",
      "target.id": task._id,
    })
      .sort({ createdAt: 1 })
      .populate("author", "name email image handle")
      .lean();

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: String(c._id),
        body: c.body,
        mentions: (c.mentions || []).map(String),
        attachments: c.attachments || [],
        editedAt: c.editedAt,
        createdAt: c.createdAt,
        author: {
          id: String((c.author as { _id: unknown })._id),
          name: (c.author as { name?: string }).name ?? "",
          handle: handleFor({
            handle: (c.author as { handle?: string }).handle,
            email: (c.author as { email?: string }).email,
          }),
          image: (c.author as { image?: string | null }).image ?? null,
        },
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

/** POST — add a comment, resolve @mentions, fan-out notifications. */
export async function POST(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid task id");
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const task = await Task.findOne({ _id: id, workspace: ws._id });
    if (!task) return notFound("Task not found");

    const handles = parseMentions(parsed.data.body);
    let mentionIds: string[] = [];
    if (handles.length) {
      const memberIds = (ws.members ?? []).map((m) => m.user);
      const members = await User.find(
        { _id: { $in: memberIds } },
        { handle: 1, email: 1 }
      ).lean();
      mentionIds = resolveMentionsToIds(
        handles,
        members.map((m) => ({ id: String(m._id), handle: m.handle, email: m.email }))
      );
    }

    const comment = await Comment.create({
      workspace: ws._id,
      target: { type: "task", id: task._id },
      author: session.user.id,
      body: parsed.data.body,
      mentions: mentionIds,
      attachments: parsed.data.attachments,
    });

    // Atomic counter for the badge on the kanban card.
    await Task.updateOne(
      { _id: task._id },
      {
        $inc: {
          commentsCount: 1,
          attachmentsCount: parsed.data.attachments.length,
        },
      }
    );

    await Activity.create({
      workspace: ws._id,
      actor: session.user.id,
      type: "comment_added",
      text: `commented on '${task.title}'`,
      refType: "task",
      refId: task._id,
    });

    // Notifications: assignees (not actor) + explicit mentions.
    const assigneeIds = (task.assignees || []).map(String);
    const url = `/workspace?task=${task._id}`;
    await notifyMany(assigneeIds, {
      workspace: ws._id,
      actor: session.user.id,
      kind: "comment",
      priority: "normal",
      title: `New comment on '${task.title}'`,
      body: parsed.data.body.slice(0, 240),
      url,
      entity: { type: "task", id: task._id },
    });
    for (const uid of mentionIds) {
      await notify({
        workspace: ws._id,
        recipient: uid,
        actor: session.user.id,
        kind: "mention",
        priority: "high",
        title: `You were mentioned on '${task.title}'`,
        body: parsed.data.body.slice(0, 240),
        url,
        entity: { type: "task", id: task._id },
      });
    }

    return NextResponse.json(
      {
        id: String(comment._id),
        body: comment.body,
        mentions: mentionIds,
        attachments: comment.attachments,
        createdAt: comment.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
