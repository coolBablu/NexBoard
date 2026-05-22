/**
 * OpenAI streaming wrapper with a graceful demo-mode fallback.
 *
 * When `OPENAI_API_KEY` is set:
 *   · Real `openai` client; streams Chat Completions chunks.
 * When the key is absent (demo / dev):
 *   · Hand-crafted streaming reply that mirrors the OpenAI shape so the
 *     entire UI pipeline (streaming, markdown, syntax highlighting,
 *     AIHistory logging) is exercised end-to-end without any external
 *     service. The reply is contextual: summary, draft, ideas, code, etc.
 */

import "server-only";

import type OpenAI from "openai";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessageInput {
  role: ChatRole;
  content: string;
}

export interface StreamChatOptions {
  messages: ChatMessageInput[];
  /** Optional override; otherwise reads OPENAI_MODEL or defaults to a cheap one. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Aborts the upstream call when the client disconnects. */
  signal?: AbortSignal;
}

export interface StreamChunk {
  delta: string;
}

export interface StreamResult {
  text: string;
  tokensInput: number;
  tokensOutput: number;
  /** Returns "openai" or "demo" depending on whether the real API was used. */
  provider: "openai" | "demo";
  model: string;
  latencyMs: number;
}

const SYSTEM_PROMPT = `You are Nova, the AI assistant inside NovaFlow — a workspace collaboration platform.

Style:
 · Concise, friendly, opinionated. Lead with the answer, then justify briefly.
 · Use rich Markdown: bullet lists, **bold** for key terms, \`inline code\` for identifiers,
   triple-backtick fences for multi-line code (always include a language tag), and
   GitHub task lists ([ ] / [x]) when proposing checklists.
 · When you suggest concrete actions, format them as a checklist so the user
   can convert them into tasks.

You can reference the user's workspace (projects, tasks, conversations) when
relevant. Never invent data; if you don't have it, ask.`;

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY?.trim();
}

let _client: OpenAI | null = null;
async function getClient(): Promise<OpenAI> {
  if (_client) return _client;
  const mod = await import("openai");
  _client = new mod.default({ apiKey: process.env.OPENAI_API_KEY! });
  return _client;
}

/**
 * Streams the assistant reply as an async generator of `StreamChunk`.
 * The final yielded value is `null` and the generator returns a `StreamResult`
 * via the `result` argument of the caller's `for await…of` loop (see usage
 * in the route handler).
 */
export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<StreamChunk, StreamResult, void> {
  const started = Date.now();
  const messages: ChatMessageInput[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...options.messages,
  ];

  if (!hasOpenAIKey()) {
    return yield* demoStream(options, started);
  }

  const client = await getClient();
  const model =
    options.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  let fullText = "";
  try {
    const stream = await client.chat.completions.create(
      {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 800,
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal: options.signal }
    );

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content ?? "";
      if (delta) {
        fullText += delta;
        yield { delta };
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0;
        outputTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    return {
      text: fullText,
      tokensInput: inputTokens || estimateTokens(joinMessages(messages)),
      tokensOutput: outputTokens || estimateTokens(fullText),
      provider: "openai",
      model,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ai/openai] stream failed, falling back to demo:", err);
    return yield* demoStream(options, started);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Demo mode: a contextual, streamed mock reply with realistic latency.
// ─────────────────────────────────────────────────────────────────────

async function* demoStream(
  options: StreamChatOptions,
  started: number
): AsyncGenerator<StreamChunk, StreamResult, void> {
  const last = options.messages[options.messages.length - 1]?.content ?? "";
  const text = composeDemoReply(last);

  // Tokenise on word boundaries so the UX feels like real streaming.
  const tokens = text.match(/\S+\s*|\s+/g) ?? [text];
  let accumulated = "";

  for (const t of tokens) {
    if (options.signal?.aborted) break;
    accumulated += t;
    yield { delta: t };
    // 12–28ms jitter per token to mimic OpenAI cadence
    await sleep(12 + Math.random() * 16);
  }

  return {
    text: accumulated,
    tokensInput: estimateTokens(joinMessages(options.messages)),
    tokensOutput: estimateTokens(accumulated),
    provider: "demo",
    model: "nova-demo-1",
    latencyMs: Date.now() - started,
  };
}

function composeDemoReply(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("summar") ||
    lower.includes("week") ||
    lower.includes("recap")
  ) {
    return `Here's a synthesized **weekly summary** across your workspace:

### Highlights
- **Velocity:** +24% week-over-week (driven by Maya's payments redesign)
- **Cycle time:** down to **2.4d** (was 2.7d)
- **AI assist:** 184 Nova runs today — mostly summaries and drafts

### Open risks
- [ ] Webhook retry tests missing in \`Payments v2\` — owner: **Daniel**
- [ ] \`Stripe Tax\` should be feature-flagged for the first 48h
- [ ] 12 stale tasks (>21d untouched) need triage

### Suggested next actions
- [ ] Pair on rate-limit retry strategy (1h, with Daniel)
- [ ] Move Q3 OKR review to async Loom
- [ ] Archive stale backlog by Friday

Want me to turn these into tasks in your **Platform** project?`;
  }

  if (
    lower.includes("draft") ||
    lower.includes("write") ||
    lower.includes("launch post")
  ) {
    return `Here's a first pass — short, confident, ready to edit:

> **Subject:** Payments v2 is live
>
> We've shipped the redesigned checkout: cleaner UX, **38% fewer steps**,
> and webhook retries that actually retry. Rolling out behind a flag for
> the next 48 hours, then default-on.
>
> Thanks to Maya for the design, Daniel for the platform work, and Sara
> for the Q3 alignment.

### Variants
- **Shorter (Slack):** "Payments v2 is live. 38% fewer steps, flagged for 48h."
- **Formal (email):** I can rewrite in a more corporate tone — say the word.

Want me to draft the changelog entry as well?`;
  }

  if (
    lower.includes("code") ||
    lower.includes("snippet") ||
    lower.includes("function") ||
    lower.includes("typescript")
  ) {
    return `Sure — here's a small idiomatic helper you can drop in:

\`\`\`typescript
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]),
});

export type User = z.infer<typeof userSchema>;

export async function getUser(id: string): Promise<User | null> {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) return null;
  return userSchema.parse(await res.json());
}
\`\`\`

A few notes:
- \`z.infer\` keeps the type and runtime validator **in sync**
- Wrap the fetch in a server-only helper if it needs auth headers
- For lists, use \`z.array(userSchema)\` and return \`User[]\``;
  }

  if (
    lower.includes("task") ||
    lower.includes("todo") ||
    lower.includes("checklist") ||
    lower.includes("plan")
  ) {
    return `Got it — here's a checklist for **${prompt.slice(0, 60)}**:

- [ ] Define the user story (who, what, why) — 15 min
- [ ] List acceptance criteria — 15 min
- [ ] Identify the 2 highest-risk unknowns — 20 min
- [ ] Spike each risk with a 30-min timeboxed PoC
- [ ] Write the rollout plan (flag, %, owner, rollback) — 30 min
- [ ] Schedule the kickoff with reviewers

You can hit **Save as tasks** below to push these straight into your active project.`;
  }

  return `Got it. Based on your workspace, here's what I'd do for **${prompt.slice(0, 80)}**:

1. Pull the most recent context from your active project.
2. Identify the **2–3 highest-leverage** next actions.
3. Wire owners + deadlines so it's actionable.

Want me to go ahead and execute this? If yes, I'll:

- [ ] Open the project page
- [ ] Draft the brief
- [ ] Create tasks with owners + due dates`;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function joinMessages(messages: ChatMessageInput[]) {
  return messages.map((m) => m.content).join("\n");
}

/** Rough heuristic — 1 token ≈ 4 chars of English. Good enough for demo cost. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** OpenAI list price (USD per 1M tokens) — kept here so cost is one number to swap. */
const PRICE_TABLE: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1": { input: 3, output: 12 },
  "nova-demo-1": { input: 0, output: 0 },
};

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const p = PRICE_TABLE[model] ?? { input: 0, output: 0 };
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
