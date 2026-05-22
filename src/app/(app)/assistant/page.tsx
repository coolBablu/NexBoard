"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  FileText,
  TrendingUp,
  Lightbulb,
  Wand2,
  ArrowUp,
  Paperclip,
  Mic,
  Globe,
  Bot,
  User as UserIcon,
  Loader2,
  CheckCircle2,
  ListChecks,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "@/components/assistant/markdown-message";
import { streamChat } from "@/components/assistant/stream-client";
import { Skeleton, SkeletonChat } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";

interface ConversationDTO {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  lastMessageAt: string;
}

interface MessageDTO {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

const suggestions = [
  { icon: Wand2, title: "Summarize my week", desc: "Across docs, PRs and messages" },
  { icon: TrendingUp, title: "Why is cycle time up?", desc: "Analyze last 30 days" },
  { icon: Lightbulb, title: "Draft a launch post", desc: "Voice: confident, friendly" },
  { icon: FileText, title: "Write a sprint recap", desc: "From this week's tickets" },
];

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface StreamingDraft {
  content: string;
  startedAt: number;
}

export default function AssistantPage() {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [streamingDraft, setStreamingDraft] =
    React.useState<StreamingDraft | null>(null);

  const { data: convData, isLoading: convLoading } = useSWR<{
    conversations: ConversationDTO[];
  }>("/api/conversations");

  const conversations = convData?.conversations || [];

  React.useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const { data: msgData, isLoading: msgLoading } = useSWR<{
    conversation: ConversationDTO;
    messages: MessageDTO[];
  }>(activeId ? `/api/conversations/${activeId}` : null);

  const messages = msgData?.messages || [];
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingDraft]);

  async function newConversation() {
    try {
      const res = await fetch("/api/conversations", { method: "POST" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const c = await res.json();
      setActiveId(c.id);
      mutate("/api/conversations");
      toast.success("New chat started");
    } catch (err) {
      toast.fromError(err, "Could not start a new chat");
    }
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;

    let convId = activeId;
    if (!convId) {
      const res = await fetch("/api/conversations", { method: "POST" });
      if (!res.ok) return;
      const c = await res.json();
      convId = c.id;
      setActiveId(convId);
      mutate("/api/conversations");
    }

    setInput("");
    setSending(true);
    setStreamingDraft({ content: "", startedAt: Date.now() });

    const optimisticUser: MessageDTO = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    mutate(
      `/api/conversations/${convId}`,
      (curr: { messages?: MessageDTO[] } | undefined) =>
        curr ? { ...curr, messages: [...(curr.messages || []), optimisticUser] } : curr,
      false
    );

    try {
      await streamChat(
        `/api/conversations/${convId}/messages`,
        { content },
        {
          onUserMessage: (real) => {
            mutate(
              `/api/conversations/${convId}`,
              (curr: { messages?: MessageDTO[] } | undefined) => {
                if (!curr) return curr;
                return {
                  ...curr,
                  messages: (curr.messages || []).map((m) =>
                    m.id === optimisticUser.id ? real : m
                  ),
                };
              },
              false
            );
          },
          onDelta: (_d, accumulated) => {
            setStreamingDraft((prev) =>
              prev ? { ...prev, content: accumulated } : null
            );
          },
          onDone: () => {
            mutate(`/api/conversations/${convId}`);
            mutate("/api/conversations");
          },
          onError: (err) => {
            toast.fromError(err, "Stream interrupted");
            mutate(`/api/conversations/${convId}`);
          },
        }
      );
    } catch (err) {
      toast.fromError(err, "Could not send message");
    } finally {
      setSending(false);
      setStreamingDraft(null);
    }
  }

  return (
    <AppShell title="AI Assistant" description="Nova — your team's intelligence layer.">
      <div className="grid h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="hidden flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 lg:flex">
          <Button onClick={newConversation} className="mb-3" size="default">
            <Plus className="size-4" />
            New chat
          </Button>
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </p>
          <ScrollArea className="flex-1">
            <div className="space-y-0.5 pr-2">
              {convLoading && (
                <div className="space-y-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton variant="circle" className="h-3 w-3" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <Skeleton className="ml-5 mt-1.5 h-2.5 w-2/3" />
                    </div>
                  ))}
                </div>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "group block w-full rounded-xl p-2.5 text-left transition-colors",
                    activeId === c.id
                      ? "nav-active text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-3.5 shrink-0" />
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {timeAgo(c.lastMessageAt)}
                    </span>
                  </div>
                  {c.preview && (
                    <p className="ml-5 mt-0.5 truncate text-xs text-muted-foreground/80">
                      {c.preview}
                    </p>
                  )}
                </button>
              ))}
              {!convLoading && conversations.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  No chats yet. Start a new one.
                </p>
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent)]" />

          <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-nova-gradient shadow-glow">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Nova Assistant</h2>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Online · Nova-3.0
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Globe className="size-3" />
                Workspace-aware
              </Badge>
              <Button variant="ghost" size="sm">
                Share
              </Button>
            </div>
          </header>

          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="space-y-6 px-5 py-6 sm:px-8">
              {!activeId && !convLoading && (
                <EmptyState onPick={(t) => sendMessage(t)} />
              )}

              {msgLoading && messages.length === 0 && (
                <SkeletonChat rows={3} />
              )}

              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <ChatBubble key={m.id} message={m} />
                ))}
                {streamingDraft && (
                  <StreamingBubble content={streamingDraft.content} />
                )}
                {sending && !streamingDraft?.content && <ThinkingBubble />}
              </AnimatePresence>

              {activeId && messages.length === 0 && !msgLoading && !sending && (
                <EmptyState onPick={(t) => sendMessage(t)} />
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-white/[0.06] p-3 sm:p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="relative"
            >
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 backdrop-blur-xl transition-colors focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/15">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={2}
                  placeholder="Ask Nova anything about your workspace…"
                  className="block w-full resize-none bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2 px-2 pb-1">
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" aria-label="Attach">
                      <Paperclip className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Voice">
                      <Mic className="size-4" />
                    </Button>
                    <Badge variant="outline" className="ml-1">
                      <Sparkles className="size-3 text-violet-300" />
                      Nova-3.0
                    </Badge>
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || sending}
                    aria-label="Send"
                  >
                    {sending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Nova may make mistakes. Verify important info. ⌘+Enter to send.
              </p>
            </form>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="pt-2">
      <div className="mb-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-nova-gradient shadow-glow">
          <Sparkles className="size-5 text-white" />
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">
          What can Nova do for you?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask anything about your workspace, or try a suggestion below.
        </p>
      </div>
      <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Suggested
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {suggestions.map((s) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.title}
              whileHover={{ y: -2 }}
              onClick={() => onPick(`${s.title} — ${s.desc}`)}
              className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-left transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-violet-300">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <ArrowUp className="ml-auto size-4 rotate-45 text-muted-foreground transition-transform group-hover:-translate-y-0.5" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: MessageDTO }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          isUser
            ? "bg-white/[0.06] text-foreground"
            : "bg-nova-gradient text-white shadow-glow"
        )}
      >
        {isUser ? <UserIcon className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className={cn("max-w-[78%] min-w-0", isUser && "text-right")}>
        <div className="mb-1 text-xs text-muted-foreground">
          {isUser ? "You" : "Nova Assistant"} · {formatTime(message.createdAt)}
        </div>
        <div
          className={cn(
            "inline-block rounded-2xl border px-4 py-3 text-sm text-left",
            isUser
              ? "border-white/[0.08] bg-white/[0.03]"
              : "border-violet-500/20 bg-violet-500/[0.06]"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </div>
        {!isUser && <SaveAsTasksAction content={message.content} />}
      </div>
    </motion.div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-nova-gradient text-white shadow-glow">
        <Bot className="size-4" />
      </div>
      <div className="max-w-[78%] min-w-0">
        <div className="mb-1 text-xs text-muted-foreground">
          Nova Assistant · writing…
        </div>
        <div className="inline-block rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm text-left">
          {content ? (
            <MarkdownMessage content={content} streaming />
          ) : (
            <ThinkingDots />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ThinkingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-nova-gradient text-white shadow-glow">
        <Bot className="size-4" />
      </div>
      <div>
        <div className="mb-1 text-xs text-muted-foreground">
          Nova Assistant · thinking
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
          <ThinkingDots />
        </div>
      </div>
    </motion.div>
  );
}

function ThinkingDots() {
  return (
    <div className="inline-flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-violet-300"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  );
}

function SaveAsTasksAction({ content }: { content: string }) {
  const [state, setState] = React.useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "done"; count: number; project: string }
    | { kind: "error"; msg: string }
    | { kind: "empty" }
  >({ kind: "idle" });

  // Only show the affordance for replies that contain a checklist or
  // numbered list — otherwise it's noisy.
  const hasActionable =
    /^\s*[-*]\s*\[[ xX]\]/m.test(content) ||
    /^\s*\d+[.)]\s+/m.test(content) ||
    /^\s*[-*•·]\s+/m.test(content);
  if (!hasActionable) return null;

  async function save() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/ai/extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Failed";
        setState({ kind: "error", msg });
        toast.error("Couldn't create tasks", { description: msg });
        return;
      }
      if (!data.created?.length) {
        setState({ kind: "empty" });
        return;
      }
      setState({
        kind: "done",
        count: data.created.length,
        project: data.project?.name ?? "project",
      });
      toast.success(
        `Created ${data.created.length} task${data.created.length === 1 ? "" : "s"}`,
        {
          description: `Added to ${data.project?.name ?? "your project"}.`,
          action: {
            label: "View",
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.assign("/workspace");
              }
            },
          },
        }
      );
      mutate("/api/tasks");
      mutate("/api/activities");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setState({ kind: "error", msg });
      toast.error("Network error", { description: msg });
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      {state.kind === "done" ? (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300"
        >
          <CheckCircle2 className="size-3" />
          Saved {state.count} task{state.count === 1 ? "" : "s"} to {state.project}
        </motion.span>
      ) : state.kind === "empty" ? (
        <span className="text-[11px] text-muted-foreground">
          No actionable items found.
        </span>
      ) : (
        <button
          type="button"
          onClick={save}
          disabled={state.kind === "loading"}
          className="group inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:opacity-60"
        >
          {state.kind === "loading" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ListChecks className="size-3 text-violet-300" />
          )}
          {state.kind === "loading" ? "Creating tasks…" : "Save as tasks"}
        </button>
      )}
      {state.kind === "error" && (
        <span className="text-[11px] text-rose-300">{state.msg}</span>
      )}
    </div>
  );
}
