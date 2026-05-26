import { NextResponse } from "next/server";

import { dbConnect } from "@/lib/mongodb";
import { UploadedFile, MAX_FILE_BYTES } from "@/models/UploadedFile";
import { requireSession, badRequest, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { putBytes } from "@/lib/storage";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/upload
 *   multipart/form-data
 *     file:      the binary
 *     channelId: optional — link the file to a chat channel
 *     messageId: optional — link to a message
 *     taskId:    optional
 *     projectId: optional
 *
 * Returns { id, name, mime, size, url } where `url` is a relative
 * path that streams the file back via /api/files/[id].
 */
export async function POST(req: Request) {
  // 20 uploads / minute / IP — generous but blocks runaway scripts.
  const limited = rateLimit(req, { name: "upload", window: "1m", limit: 20 });
  if (!limited.ok) return tooMany(limited);

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    await dbConnect();

    const form = await req.formData().catch(() => null);
    if (!form) return badRequest("Expected multipart/form-data");

    const file = form.get("file");
    if (!(file instanceof File)) return badRequest("Missing 'file' field");
    if (file.size === 0) return badRequest("Empty file");
    if (file.size > MAX_FILE_BYTES) {
      return badRequest(
        `File too large — max ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB.`
      );
    }

    const ws = await getOrCreateDefaultWorkspace(session.user.id);
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await putBytes({
      filename: file.name,
      mime: file.type || "application/octet-stream",
      bytes,
    });

    const channelIdRaw = form.get("channelId");
    const messageIdRaw = form.get("messageId");
    const taskIdRaw = form.get("taskId");
    const projectIdRaw = form.get("projectId");

    const doc = await UploadedFile.create({
      workspace: ws._id,
      uploadedBy: session.user.id,
      name: file.name.slice(0, 240),
      mime: file.type || "application/octet-stream",
      size: file.size,
      storage: stored.storage,
      data: stored.data ?? null,
      externalUrl: stored.externalUrl ?? null,
      channel: typeof channelIdRaw === "string" ? channelIdRaw : null,
      message: typeof messageIdRaw === "string" ? messageIdRaw : null,
      task: typeof taskIdRaw === "string" ? taskIdRaw : null,
      project: typeof projectIdRaw === "string" ? projectIdRaw : null,
    });

    return NextResponse.json(
      {
        id: String(doc._id),
        name: doc.name,
        mime: doc.mime,
        size: doc.size,
        // Always prefer the stream route — even for blob-backed files —
        // because that's the one with auth checks (so private files
        // can't be hot-linked anonymously).
        url: `/api/files/${doc._id}`,
        storage: doc.storage,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}
