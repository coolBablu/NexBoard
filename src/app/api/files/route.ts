import { NextResponse } from "next/server";

import { dbConnect } from "@/lib/mongodb";
import { UploadedFile } from "@/models/UploadedFile";
import { User } from "@/models/User";
import { requireSession, serverError } from "@/lib/api";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/files
 *   ?q=<search>     name search (case-insensitive)
 *   ?type=image|doc|video|audio|all
 *   ?limit=50
 *
 * Lists every file in the user's workspace for the /files surface.
 * Returns presentation metadata only — bytes are streamed by
 * /api/files/[id].
 */
export async function GET(req: Request) {
  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    await dbConnect();
    const ws = await getOrCreateDefaultWorkspace(session.user.id);

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const type = url.searchParams.get("type") || "all";
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 100)));

    const filter: Record<string, unknown> = { workspace: ws._id };
    if (q) filter.name = { $regex: q, $options: "i" };
    if (type !== "all") {
      const prefixMap: Record<string, string | RegExp> = {
        image: /^image\//,
        video: /^video\//,
        audio: /^audio\//,
        doc: /(pdf|word|document|sheet|presentation|text|csv|json|xml|zip)/i,
      };
      const p = prefixMap[type];
      if (p) filter.mime = p;
    }

    const files = await UploadedFile.find(filter, {
      data: 0, // never ship raw bytes in the listing
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fan-out uploader info in one query.
    const uploaderIds = Array.from(new Set(files.map((f) => String(f.uploadedBy))));
    const uploaders = await User.find(
      { _id: { $in: uploaderIds } },
      { name: 1, email: 1, image: 1 }
    ).lean();
    const uploaderMap = new Map(uploaders.map((u) => [String(u._id), u]));

    const total = await UploadedFile.countDocuments({ workspace: ws._id });

    return NextResponse.json({
      total,
      files: files.map((f) => {
        const u = uploaderMap.get(String(f.uploadedBy));
        return {
          id: String(f._id),
          name: f.name,
          mime: f.mime,
          size: f.size,
          url: `/api/files/${f._id}`,
          downloadUrl: `/api/files/${f._id}?download=1`,
          createdAt: f.createdAt,
          uploader: u
            ? {
                id: String(u._id),
                name: u.name,
                email: u.email,
                image:
                  u.image ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    u.email
                  )}`,
              }
            : null,
        };
      }),
    });
  } catch (err) {
    return serverError(err);
  }
}
