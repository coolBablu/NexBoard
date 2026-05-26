import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { dbConnect } from "@/lib/mongodb";
import { UploadedFile } from "@/models/UploadedFile";
import { requireSession, badRequest, notFound, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { getBytes, deleteBytes } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/files/[id]
 *   ?download=1   force the browser to download instead of inline-rendering
 *
 * Streams the file back with the right Content-Type. The 200 response
 * is uncacheable on purpose — we want every fetch to re-check session
 * (so a user whose access was revoked can't keep hot-linking).
 */
export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid file id");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    await dbConnect();
    const ws = await getOrCreateDefaultWorkspace(session.user.id);

    const file = await UploadedFile.findOne({
      _id: id,
      workspace: ws._id,
    }).select("+data");
    if (!file) return notFound("File not found");

    const got = await getBytes(file);
    if (!got) return notFound("File payload missing");

    const url = new URL(req.url);
    const forceDownload = url.searchParams.get("download") === "1";
    const safeName = file.name.replace(/[\r\n"]+/g, "");

    return new NextResponse(new Uint8Array(got.bytes), {
      status: 200,
      headers: {
        "Content-Type": got.mime,
        "Content-Length": String(got.bytes.length),
        "Content-Disposition": `${
          forceDownload ? "attachment" : "inline"
        }; filename="${safeName}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    return serverError(err);
  }
}

/**
 * DELETE /api/files/[id]
 * Only the uploader or a super admin may delete.
 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid file id");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    await dbConnect();
    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const file = await UploadedFile.findOne({ _id: id, workspace: ws._id });
    if (!file) return notFound("File not found");

    if (
      String(file.uploadedBy) !== session.user.id &&
      (session.user as { role?: string }).role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "Only the uploader or a super admin can delete this file." },
        { status: 403 }
      );
    }

    await deleteBytes(file);
    await UploadedFile.deleteOne({ _id: file._id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
