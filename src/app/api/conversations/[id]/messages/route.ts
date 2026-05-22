import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import crypto from "crypto";

import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { requireSession, badRequest, serverError, notFound } from "@/lib/api";
import { streamChat, estimateCostUsd, hasOpenAIKey } from "@/lib/ai/openai";
import { logAIRun } from "@/lib/ai/log";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sendSchema = z.object({
  content: z.string().min(1).max(8000),
  /** When false, returns a regular JSON payload (used by the floating
   *  assistant for quick one-shots). Defaults to true (streamed NDJSON). */
  stream: z.boolean().optional().default(true),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/conversations/[id]/messages
 *
 * Persists the user message, then either:
 *   · streams the assistant reply as NDJSON
 *     (`{ "delta": "..." }\n... { "done": true, "userMessage": {}, "assistantMessage": {} }`)
 *   · or returns a single JSON payload when `stream: false`.
 *
 * Every call is appended to the `AIHistory` collection so usage / cost
 * dashboards stay accurate.
 */
export async function POST(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) return badRequest("Invalid conversation id");

  // Throttle expensive LLM calls — 20 messages / minute per IP.
  const limited = rateLimit(req, { name: "ai-chat", window: "1m", limit: 20 });
  if (!limited.ok) return tooMany(limited, "AI rate limit reached — try again in a minute.");

  const guard = await requireSession();
  if ("error" in guard) return guard.error;
  const { session } = guard;

  let parsed: z.infer<typeof sendSchema>;
  try {
    parsed = sendSchema.parse(await req.json());
  } catch {
    return badRequest("Invalid request body");
  }

  const conv = await Conversation.findOne({ _id: id, user: session.user.id });
  if (!conv) return notFound("Conversation not found");

  // Persist the user message first so it survives even if the AI call fails.
  const userMsg = await Message.create({
    conversation: conv._id,
    user: session.user.id,
    role: "user",
    content: parsed.content,
  });

  // Build the rolling chat history sent to the model.
  const history = await Message.find({ conversation: conv._id })
    .sort({ createdAt: 1 })
    .limit(40)
    .lean();
  const aiMessages = history.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  const requestId = crypto.randomUUID();
  const workspaceId = await resolveWorkspace(session.user.id);

  // ────────────────────────────────────────────────────────────────
  // Non-streaming path
  // ────────────────────────────────────────────────────────────────
  if (!parsed.stream) {
    try {
      let text = "";
      const gen = streamChat({ messages: aiMessages, signal: req.signal });
      let final = await gen.next();
      while (!final.done) {
        text += final.value.delta;
        final = await gen.next();
      }
      const result = final.value;

      const aiMsg = await Message.create({
        conversation: conv._id,
        user: session.user.id,
        role: "assistant",
        content: result.text,
        meta: {
          model: result.model,
          provider: result.provider,
          tokens: { input: result.tokensInput, output: result.tokensOutput },
          latencyMs: result.latencyMs,
          requestId,
        },
      });

      await updateConversation(conv, parsed.content);

      void logAIRun({
        user: session.user.id,
        workspace: workspaceId,
        conversation: conv._id,
        kind: "chat",
        provider: result.provider,
        model: result.model,
        promptPreview: parsed.content,
        responsePreview: result.text,
        tokens: { input: result.tokensInput, output: result.tokensOutput },
        costUsd: estimateCostUsd(result.model, result.tokensInput, result.tokensOutput),
        latencyMs: result.latencyMs,
        status: "success",
        requestId,
      });

      return NextResponse.json(
        {
          userMessage: {
            id: String(userMsg._id),
            role: userMsg.role,
            content: userMsg.content,
            createdAt: userMsg.createdAt,
          },
          assistantMessage: {
            id: String(aiMsg._id),
            role: aiMsg.role,
            content: aiMsg.content,
            createdAt: aiMsg.createdAt,
          },
          meta: {
            provider: result.provider,
            model: result.model,
            latencyMs: result.latencyMs,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      void logAIRun({
        user: session.user.id,
        workspace: workspaceId,
        conversation: conv._id,
        kind: "chat",
        provider: hasOpenAIKey() ? "openai" : "demo",
        model: "unknown",
        promptPreview: parsed.content,
        status: "error",
        error: String(err),
        requestId,
      });
      return serverError(err);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Streaming path (NDJSON)
  // ────────────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const userId = session.user.id;

  const rs = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      // Send the user-message receipt immediately so the client can swap its
      // optimistic temp-id for the real one.
      send({
        userMessage: {
          id: String(userMsg._id),
          role: userMsg.role,
          content: userMsg.content,
          createdAt: userMsg.createdAt,
        },
      });

      let fullText = "";
      let model = "unknown";
      let provider: "openai" | "demo" = hasOpenAIKey() ? "openai" : "demo";
      let inputTokens = 0;
      let outputTokens = 0;
      let latencyMs = 0;
      const started = Date.now();

      try {
        const gen = streamChat({
          messages: aiMessages,
          signal: req.signal,
        });

        while (true) {
          const next = await gen.next();
          if (next.done) {
            fullText = next.value.text;
            model = next.value.model;
            provider = next.value.provider;
            inputTokens = next.value.tokensInput;
            outputTokens = next.value.tokensOutput;
            latencyMs = next.value.latencyMs;
            break;
          }
          send({ delta: next.value.delta });
        }

        const aiMsg = await Message.create({
          conversation: conv._id,
          user: userId,
          role: "assistant",
          content: fullText,
          meta: {
            model,
            provider,
            tokens: { input: inputTokens, output: outputTokens },
            latencyMs,
            requestId,
          },
        });

        await updateConversation(conv, parsed.content);

        send({
          done: true,
          assistantMessage: {
            id: String(aiMsg._id),
            role: aiMsg.role,
            content: aiMsg.content,
            createdAt: aiMsg.createdAt,
          },
          meta: { provider, model, latencyMs, requestId },
        });

        void logAIRun({
          user: userId,
          workspace: workspaceId,
          conversation: conv._id,
          kind: "chat",
          provider,
          model,
          promptPreview: parsed.content,
          responsePreview: fullText,
          tokens: { input: inputTokens, output: outputTokens },
          costUsd: estimateCostUsd(model, inputTokens, outputTokens),
          latencyMs,
          status: "success",
          requestId,
        });
      } catch (err) {
        send({ error: String(err), done: true });
        void logAIRun({
          user: userId,
          workspace: workspaceId,
          conversation: conv._id,
          kind: "chat",
          provider,
          model,
          promptPreview: parsed.content,
          responsePreview: fullText,
          latencyMs: Date.now() - started,
          status: "error",
          error: String(err),
          requestId,
        });
      } finally {
        controller.close();
      }
    },

    cancel() {
      // Client disconnected mid-stream — nothing to clean up since the
      // generator already honours `req.signal`.
    },
  });

  return new Response(rs, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function updateConversation(
  conv: { _id: unknown; messageCount: number; title: string },
  userContent: string
) {
  const isFirstUserMessage =
    conv.messageCount === 0 || conv.title === "New chat";
  const $set: Record<string, unknown> = {
    lastMessageAt: new Date(),
    preview: userContent.slice(0, 120),
  };
  if (isFirstUserMessage) {
    $set.title = userContent.slice(0, 60);
  }
  await Conversation.updateOne(
    { _id: conv._id },
    { $set, $inc: { messageCount: 2 } }
  );
}

async function resolveWorkspace(userId: string): Promise<string | null> {
  const u = await User.findById(userId, { defaultWorkspace: 1 }).lean();
  return u?.defaultWorkspace ? String(u.defaultWorkspace) : null;
}
