/**
 * LLM streaming wrapper with a graceful demo-mode fallback.
 *
 * Provider auto-selection (first match wins):
 *   · `OPENROUTER_API_KEY` set → OpenRouter (OpenAI-compatible gateway,
 *     hundreds of models incl. several free tiers).
 *   · `OPENAI_API_KEY` set     → OpenAI direct.
 *   · neither set              → hand-crafted streamed mock so the entire
 *     UI pipeline (streaming, markdown, highlight, AIHistory log) is
 *     exercised end-to-end without any external service.
 *
 * Both real providers go through the `openai` SDK (it accepts any
 * `baseURL`), so the streaming/usage code stays identical.
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
  /** Optional override; otherwise reads OPENROUTER_MODEL / OPENAI_MODEL. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Aborts the upstream call when the client disconnects. */
  signal?: AbortSignal;
}

export interface StreamChunk {
  delta: string;
}

export type LLMProvider = "openrouter" | "openai" | "demo";

export interface StreamResult {
  text: string;
  tokensInput: number;
  tokensOutput: number;
  provider: LLMProvider;
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

function resolveProvider(): Exclude<LLMProvider, "demo"> | null {
  if (process.env.OPENROUTER_API_KEY?.trim()) return "openrouter";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return null;
}

function resolveDefaultModel(provider: Exclude<LLMProvider, "demo">): string {
  if (provider === "openrouter") {
    return (
      process.env.OPENROUTER_MODEL?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
      "meta-llama/llama-3.3-70b-instruct:free"
    );
  }
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/** True when at least one real provider key is configured. */
export function hasLLMKey(): boolean {
  return resolveProvider() !== null;
}

/** Back-compat alias — old call sites can keep using this name. */
export const hasOpenAIKey = hasLLMKey;

let _client: OpenAI | null = null;
let _clientProvider: Exclude<LLMProvider, "demo"> | null = null;

async function getClient(
  provider: Exclude<LLMProvider, "demo">
): Promise<OpenAI> {
  if (_client && _clientProvider === provider) return _client;

  const mod = await import("openai");

  if (provider === "openrouter") {
    // OpenRouter is OpenAI-compatible; just swap baseURL + auth.
    // The Referer + Title headers are OpenRouter's recommended way to
    // surface your app in their attribution / analytics dashboards.
    _client = new mod.default({
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "https://nexboard-beige.vercel.app",
        "X-Title": "NexBoard",
      },
    });
  } else {
    _client = new mod.default({ apiKey: process.env.OPENAI_API_KEY! });
  }

  _clientProvider = provider;
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

  const provider = resolveProvider();
  if (!provider) {
    return yield* demoStream(options, started);
  }

  const client = await getClient(provider);
  const model = options.model || resolveDefaultModel(provider);

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
      provider,
      model,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[ai/${provider}] stream failed, falling back to demo:`, err);
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

/** USD per 1M tokens — used for the cost ledger in AIHistory. Unknown
 *  models fall through to $0 so nothing crashes if a new model id is
 *  introduced before this table catches up. */
const PRICE_TABLE: Record<string, { input: number; output: number }> = {
  // OpenAI direct
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1": { input: 3, output: 12 },

  // OpenRouter — free tiers
  "meta-llama/llama-3.3-70b-instruct:free": { input: 0, output: 0 },
  "meta-llama/llama-3.1-8b-instruct:free": { input: 0, output: 0 },
  "mistralai/mistral-7b-instruct:free": { input: 0, output: 0 },
  "google/gemma-2-9b-it:free": { input: 0, output: 0 },
  "x-ai/grok-4-fast:free": { input: 0, output: 0 },

  // OpenRouter — common paid (May 2026 list prices)
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
  "anthropic/claude-3.5-haiku": { input: 0.8, output: 4 },
  "google/gemini-2.0-flash": { input: 0.1, output: 0.4 },

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
