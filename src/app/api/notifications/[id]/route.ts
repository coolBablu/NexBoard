import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { Notification } from "@/models/Notification";
import { requireSession, badRequest, notFound, serverError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  read: z.boolean().optional(),
  archived: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid id");
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input");

    const set: Record<string, Date | null> = {};
    if (parsed.data.read === true) set.readAt = new Date();
    if (parsed.data.read === false) set.readAt = null;
    if (parsed.data.archived === true) set.archivedAt = new Date();
    if (parsed.data.archived === false) set.archivedAt = null;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, recipient: session.user.id },
      { $set: set },
      { new: true }
    );
    if (!notif) return notFound("Notification not found");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
