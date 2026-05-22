import { NextResponse } from "next/server";
import { z } from "zod";

import { dbConnect } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { requireSession, badRequest, serverError } from "@/lib/api";
import { logAIRun } from "@/lib/ai/log";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  /** Free-form text (e.g. an assistant reply). Markdown checklists are
   *  parsed preferentially; otherwise we extract heuristic bullets. */
  content: z.string().min(1).max(20_000),
  /** Optional project id; defaults to the first project in the user's
   *  default workspace. */
  projectId: z.string().optional(),
});

/**
 * POST /api/ai/extract-tasks
 *
 * Parses the supplied text and creates `Task` documents for each
 * actionable item it finds. Returns the created tasks + the project they
 * landed in so the client can update the relevant SWR cache.
 */
export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "ai-extract", window: "1m", limit: 10 });
  if (!limited.ok) return tooMany(limited);

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const items = extractActionItems(parsed.data.content);
    if (items.length === 0) {
      return NextResponse.json({ created: [], message: "No action items found." });
    }

    const user = await User.findById(session.user.id, {
      defaultWorkspace: 1,
    }).lean();
    if (!user?.defaultWorkspace) {
      return badRequest("User has no default workspace");
    }

    let projectId = parsed.data.projectId;
    if (!projectId) {
      const project = await Project.findOne({
        workspace: user.defaultWorkspace,
      })
        .sort({ createdAt: 1 })
        .lean();
      if (!project) return badRequest("No project found in your workspace");
      projectId = String(project._id);
    }

    const project = await Project.findOne({
      _id: projectId,
      workspace: user.defaultWorkspace,
    });
    if (!project) return badRequest("Project not in your workspace");

    const created = await Task.insertMany(
      items.map((title, i) => ({
        project: project._id,
        workspace: user.defaultWorkspace,
        title,
        column: "backlog",
        priority: "med",
        order: Date.now() + i,
        aiAssisted: true,
        createdBy: session.user.id,
      }))
    );

    void logAIRun({
      user: session.user.id,
      workspace: user.defaultWorkspace,
      kind: "plan",
      provider: "demo",
      model: "task-extractor-v1",
      promptPreview: parsed.data.content,
      responsePreview: `Created ${created.length} tasks: ${items.join("; ")}`,
      tokens: { input: Math.ceil(parsed.data.content.length / 4), output: 0 },
      latencyMs: 0,
      status: "success",
    });

    return NextResponse.json(
      {
        created: created.map((t) => ({
          id: String(t._id),
          title: t.title,
        })),
        project: { id: String(project._id), name: project.name },
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Heuristic extractor — markdown checklists win, then bullet lists, then
// numbered lists. Falls back to short imperative sentences. Capped at 25
// items so a pasted essay can't spam the project.
// ─────────────────────────────────────────────────────────────────────

function extractActionItems(text: string): string[] {
  const items: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    const trimmed = s.trim().replace(/^[\s*\-•·]+/, "").replace(/[.;:]+$/, "");
    if (trimmed.length < 4 || trimmed.length > 200) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push(trimmed);
  };

  // 1. Markdown task lists ([ ] / [x])
  const taskRe = /^\s*[-*]\s*\[([ xX])\]\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = taskRe.exec(text)) !== null) push(m[2]);

  // 2. Plain bullets
  if (items.length === 0) {
    const bulletRe = /^\s*[-*•·]\s+(.+)$/gm;
    while ((m = bulletRe.exec(text)) !== null) push(m[1]);
  }

  // 3. Numbered lists
  if (items.length === 0) {
    const numRe = /^\s*\d+[.)]\s+(.+)$/gm;
    while ((m = numRe.exec(text)) !== null) push(m[1]);
  }

  // 4. Short imperative sentences as a last resort
  if (items.length === 0) {
    const sentences = text.split(/[.!?\n]+/).map((s) => s.trim());
    for (const s of sentences) {
      if (
        s.length >= 10 &&
        s.length <= 140 &&
        /^[A-Z]/.test(s) &&
        /^(Add|Fix|Build|Write|Draft|Update|Ship|Plan|Review|Schedule|Create|Investigate|Pair|Set up|Move|Archive|Open|Close|Send|Test|Deploy|Configure|Document)\b/i.test(s)
      ) {
        push(s);
      }
    }
  }

  return items.slice(0, 25);
}
