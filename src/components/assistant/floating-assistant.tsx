"use client";

import * as React from "react";
import Link from "next/link";
import { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  ArrowUpRight,
  Wand2,
  TrendingUp,
  Lightbulb,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./markdown-message";
import { streamChat } from "./stream-client";

interface FloatingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { icon: Wand2, label: "Summarize my week" },
  { icon: TrendingUp, label: "What needs my attention today?" },
  { icon: Lightbulb, label: "Draft a status update" },
  { icon: FileText, label: "Plan tomorrow's standup" },
];

/**
 * Bottom-right floating AI panel — available on every authenticated page.
 *
 *   · Click the gradient orb to open.
 *   · Or press `⌘ J` / `Ctrl + J` from anywhere.
 *   · Shares the streaming backend with the main /assistant page, but
 *     keeps a single local conversation that's spawned on first use.
 */
export function FloatingAssistant() {
  const [open, setOpen] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(
    null
  );
  const [messages, setMessages] = React.useState<FloatingMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [streamingDraft, setStreamingDraft] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Global ⌘J / Ctrl+J shortcut.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Auto-scroll on new content.
  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingDraft, streaming]);

  async function ensureConversation(): Promise<string | null> {
    if (conversationId) return conversationId;
    const res = await fetch("/api/conversations", { method: "POST" });
    if (!res.ok) return null;
    const c = await res.json();
    setConversationId(c.id);
    mutate("/api/conversations");
    return c.id as string;
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    const convId = await ensureConversation();
    if (!convId) return;

    setInput("");
    setStreaming(true);
    setStreamingDraft("");

    const optimisticUser: FloatingMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((m) => [...m, optimisticUser]);

    try {
      await streamChat(
        `/api/conversations/${convId}/messages`,
        { content },
        {
          onUserMessage: (real) => {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === optimisticUser.id
                  ? { id: real.id, role: "user", content: real.content }
                  : msg
              )
            );
          },
          onDelta: (_d, accumulated) => setStreamingDraft(accumulated),
          onDone: (payload) => {
            setMessages((m) => [
              ...m,
              {
                id: payload.assistantMessage.id,
                role: "assistant",
                content: payload.assistantMessage.content,
              },
            ]);
            setStreamingDraft("");
            mutate(`/api/conversations/${convId}`);
          },
          onError: () => {
            setStreamingDraft("");
          },
        }
      );
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 280, damping: 22 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-2xl bg-nova-gradient text-white shadow-[0_18px_40px_-12px_rgba(94, 106, 210, 0.18)] sm:bottom-6 sm:right-6",
          open && "pointer-events-none opacity-0"
        )}
        aria-label="Open Nova assistant"
      >
        <span className="absolute inset-0 -z-10 rounded-2xl bg-nova-gradient opacity-50 blur-lg" />
        <Sparkles className="size-5" />
        <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full border border-white/20 bg-background/90 font-mono text-[9px] text-violet-300">
          ⌘J
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="float"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-5 right-5 z-40 flex h-[min(680px,calc(100vh-2.5rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/85 shadow-[0_30px_80px_-20px_rgba(15, 23, 42, 0.08)] backdrop-blur-2xl sm:bottom-6 sm:right-6"
            role="dialog"
            aria-label="Nova assistant"
          >
            {/* aurora wash */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-70"
            >
              <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl" />
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
            </div>

            {/* header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-nova-gradient shadow-glow">
                  <Sparkles className="size-3.5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    Nova
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
                      <span className="relative flex h-1 w-1">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-400" />
                      </span>
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Streaming · workspace-aware
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href="/assistant"
                  className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground sm:inline-flex"
                  title="Open full assistant"
                >
                  Full view
                  <ArrowUpRight className="size-2.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 && !streaming && (
                <FloatingEmptyState onPick={(p) => send(p)} />
              )}

              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <FloatingBubble key={m.id} message={m} />
                ))}
                {streaming && (
                  <FloatingBubble
                    message={{
                      id: "live",
                      role: "assistant",
                      content: streamingDraft,
                    }}
                    streaming
                  />
                )}
              </AnimatePresence>
            </div>

            {/* input */}
            <div className="border-t border-white/[0.06] p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <div className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1.5 transition-colors focus-within:border-violet-500/40 focus-within:ring-4 focus-within:ring-violet-500/15">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Ask Nova anything…"
                    className="block max-h-32 min-h-[34px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || streaming}
                    aria-label="Send"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-nova-gradient text-white shadow-glow transition-opacity disabled:opacity-50"
                  >
                    {streaming ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-center font-mono text-[9px] text-muted-foreground/70">
                  ⌘ J to toggle · ESC to close
                </p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FloatingEmptyState({ onPick }: { onPick: (p: string) => void }) {
  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-nova-gradient shadow-glow">
        <Sparkles className="size-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold">How can I help?</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Workspace context is loaded.
        </p>
      </div>
      <div className="space-y-1.5 text-left">
        {QUICK_PROMPTS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onPick(p.label)}
              className="group flex w-full items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-foreground"
            >
              <Icon className="size-3.5 text-violet-300" />
              <span className="flex-1">{p.label}</span>
              <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FloatingBubble({
  message,
  streaming,
}: {
  message: FloatingMessage;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-2", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-md",
          isUser
            ? "bg-white/[0.06] text-foreground"
            : "bg-nova-gradient text-white"
        )}
      >
        {isUser ? <UserIcon className="size-3" /> : <Bot className="size-3" />}
      </div>
      <div
        className={cn(
          "max-w-[82%] min-w-0 rounded-xl border px-3 py-2 text-xs",
          isUser
            ? "border-white/[0.08] bg-white/[0.03]"
            : "border-violet-500/20 bg-violet-500/[0.06]"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        ) : message.content ? (
          <MarkdownMessage content={message.content} streaming={streaming} />
        ) : (
          <div className="inline-flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-violet-300"
                animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
