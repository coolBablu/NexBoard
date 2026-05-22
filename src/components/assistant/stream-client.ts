/**
 * Tiny client-side helper that POSTs to a chat endpoint and parses the
 * NDJSON response stream, invoking callbacks as each line arrives.
 *
 * Shape of events emitted by `/api/conversations/[id]/messages` (streaming):
 *   { userMessage: {...} }                  ← once, immediately
 *   { delta: "next token" }                 ← many times
 *   { done: true, assistantMessage: {...}, meta: {...} }   ← once
 *   { error: "...", done: true }            ← on failure
 */

export interface StreamCallbacks {
  onUserMessage?: (m: {
    id: string;
    role: "user";
    content: string;
    createdAt: string;
  }) => void;
  onDelta?: (delta: string, accumulated: string) => void;
  onDone?: (payload: {
    assistantMessage: {
      id: string;
      role: "assistant";
      content: string;
      createdAt: string;
    };
    meta?: { provider: string; model: string; latencyMs: number };
  }) => void;
  onError?: (err: string) => void;
}

export async function streamChat(
  url: string,
  body: Record<string, unknown>,
  cb: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });
  if (!res.ok || !res.body) {
    cb.onError?.(`HTTP ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;

      try {
        const evt = JSON.parse(line);
        if (typeof evt.delta === "string") {
          accumulated += evt.delta;
          cb.onDelta?.(evt.delta, accumulated);
        } else if (evt.userMessage) {
          cb.onUserMessage?.(evt.userMessage);
        } else if (evt.done) {
          if (evt.assistantMessage) {
            cb.onDone?.({
              assistantMessage: evt.assistantMessage,
              meta: evt.meta,
            });
          }
          if (evt.error) cb.onError?.(evt.error);
        }
      } catch {
        // Skip malformed line — should never happen with well-formed NDJSON.
      }
    }
  }

  // Flush any trailing buffered line on stream close.
  if (buffer.trim()) {
    try {
      const evt = JSON.parse(buffer);
      if (evt.done && evt.assistantMessage) {
        cb.onDone?.({
          assistantMessage: evt.assistantMessage,
          meta: evt.meta,
        });
      }
    } catch {
      // ignore
    }
  }
}
