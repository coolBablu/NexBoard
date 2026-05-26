/**
 * Pluggable file-storage adapter.
 *
 *   · If BLOB_READ_WRITE_TOKEN is set, files go to Vercel Blob.
 *   · Otherwise, files are stored as binary in MongoDB (works in
 *     DEMO_MODE + plain Atlas with no extra setup).
 *
 * The persistence layer lives in UploadedFile model — this module
 * only handles *where the bytes physically live*.
 */

import type { UploadedFileDoc } from "@/models/UploadedFile";

export type StorageBackend = "mongo" | "blob";

export function activeBackend(): StorageBackend {
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "mongo";
}

interface PutResult {
  storage: StorageBackend;
  externalUrl?: string;
  data?: Buffer;
}

/** Write bytes to whichever backend is configured. */
export async function putBytes(opts: {
  filename: string;
  mime: string;
  bytes: Buffer;
}): Promise<PutResult> {
  if (activeBackend() === "blob") {
    const { put } = await import("@vercel/blob");
    const safeName = opts.filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const blob = await put(
      `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`,
      opts.bytes,
      {
        access: "public",
        contentType: opts.mime,
      }
    );
    return { storage: "blob", externalUrl: blob.url };
  }
  return { storage: "mongo", data: opts.bytes };
}

/** Resolve a stored file to a Buffer + content-type for streaming. */
export async function getBytes(file: UploadedFileDoc): Promise<{
  bytes: Buffer;
  mime: string;
} | null> {
  if (file.storage === "blob") {
    if (!file.externalUrl) return null;
    const res = await fetch(file.externalUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { bytes: buf, mime: file.mime };
  }
  // Mongo backend
  if (!file.data) return null;
  return { bytes: Buffer.from(file.data as unknown as Uint8Array), mime: file.mime };
}

/** Best-effort deletion (don't fail the request if the blob is already gone). */
export async function deleteBytes(file: UploadedFileDoc): Promise<void> {
  if (file.storage === "blob" && file.externalUrl) {
    try {
      const { del } = await import("@vercel/blob");
      await del(file.externalUrl);
    } catch {
      // ignore — orphaned blob is OK
    }
  }
  // Mongo backend deletes implicitly when the doc is removed.
}
