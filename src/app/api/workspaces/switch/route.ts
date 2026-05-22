import { NextResponse } from "next/server";
import { z } from "zod";

import { Workspace } from "@/models/Workspace";
import { User } from "@/models/User";
import { requireSession, badRequest, serverError } from "@/lib/api";
import { toObjectId } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ workspaceId: z.string() });

/** POST — set the caller's defaultWorkspace (after verifying membership). */
export async function POST(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input");
    const wsId = toObjectId(parsed.data.workspaceId);
    if (!wsId) return badRequest("Invalid workspace id");

    const ws = await Workspace.findOne({
      _id: wsId,
      "members.user": session.user.id,
    });
    if (!ws) return badRequest("Not a member of that workspace");

    await User.updateOne(
      { _id: session.user.id },
      { $set: { defaultWorkspace: ws._id } }
    );
    return NextResponse.json({ ok: true, id: String(ws._id), name: ws.name });
  } catch (err) {
    return serverError(err);
  }
}
