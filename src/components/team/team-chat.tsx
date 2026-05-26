"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Hash,
  Lock,
  Plus,
  Send,
  Loader2,
  Smile,
  Users,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MentionInput, MentionedText } from "@/components/team/mention-input";
import { PresenceDot } from "@/components/team/presence";
import {
  FileAttachmentButton,
  AttachmentPill,
  AttachmentList,
  type AttachmentDraft,
} from "@/components/team/file-attachment";
import {
  Skeleton,
  SkeletonChat,
  SkeletonListRow,
} from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface ChannelDTO {
  id: string;
  name: string;
  type: "channel" | "dm";
  icon: string;
  topic: string;
  isPrivate: boolean;
  lastMessageAt: string;
  messageCount: number;
}

interface MessageDTO {
  id: string;
  body: string;
  mentions: string[];
  attachments: AttachmentDraft[];
  createdAt: string;
  author: { id: string; name: string; handle: string; image: string | null };
}

interface Member {
  id: string;
  name: string;
  handle: string;
  email: string;
  image: string;
  title: string | null;
  presence: "online" | "away" | "offline";
}

/**
 * Three-column team chat:
 *   [Channels nav]  [Active channel timeline + composer]  [Members + presence]
 *
 * The middle column polls /api/channels/[id]/messages with a `since` cursor
 * every 4 s for an "online" feel without a websocket — new messages slide
 * in from the bottom while old ones stay put.
 */
export function TeamChat({ initialChannelId }: { initialChannelId?: string }) {
  const [activeId, setActiveId] = React.useState<string | null>(initialChannelId ?? null);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: chData } = useSWR<{ channels: ChannelDTO[] }>("/api/channels", {
    refreshInterval: 20_000,
  });
  const { data: membersData } = useSWR<{ members: Member[] }>("/api/members");
  const channels = chData?.channels ?? [];
  const members = membersData?.members ?? [];

  React.useEffect(() => {
    if (!activeId && channels.length > 0) {
      // Prefer regular channels over DMs as the first auto-pick.
      const first =
        channels.find((c) => c.type === "channel") ?? channels[0];
      setActiveId(first.id);
    }
  }, [channels, activeId]);

  /** Find-or-create a 1:1 DM with the given member, then switch to it. */
  const startDM = React.useCallback(
    async (memberId: string) => {
      try {
        const res = await fetch("/api/channels/dm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: memberId }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error("Couldn't open DM", { description: data.error });
          return;
        }
        await mutate("/api/channels");
        setActiveId(data.id);
      } catch (err) {
        toast.fromError(err, "Couldn't open DM");
      }
    },
    []
  );

  const active = channels.find((c) => c.id === activeId) || null;

  return (
    <div className="grid h-[calc(100vh-13rem)] grid-cols-[260px_1fr] gap-4 xl:grid-cols-[240px_1fr_260px]">
      <ChannelsSidebar
        channels={channels}
        members={members}
        currentUserId={currentUserId}
        activeId={activeId}
        onSelect={setActiveId}
        onStartDM={startDM}
      />
      <ChannelArea channel={active} />
      <MembersSidebar
        currentUserId={currentUserId}
        onStartDM={startDM}
      />
    </div>
  );
}

/** Resolve a DM's deterministic "dm-<a>-<b>" name to the OTHER member's display info. */
function resolveDMPeer(
  dmName: string,
  currentUserId: string | undefined,
  members: Member[]
): Member | null {
  if (!currentUserId) return null;
  const ids = dmName.replace(/^dm-/, "").split("-");
  const otherId = ids.find((id) => id !== currentUserId);
  if (!otherId) return null;
  return members.find((m) => m.id === otherId) ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Channels sidebar
// ─────────────────────────────────────────────────────────────────────

function ChannelsSidebar({
  channels,
  members,
  currentUserId,
  activeId,
  onSelect,
  onStartDM,
}: {
  channels: ChannelDTO[];
  members: Member[];
  currentUserId: string | undefined;
  activeId: string | null;
  onSelect: (id: string) => void;
  onStartDM: (memberId: string) => void;
}) {
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const regularChannels = channels.filter((c) => c.type === "channel");
  const dmChannels = channels.filter((c) => c.type === "dm");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), topic: topic.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create channel");
      }
      setName("");
      setTopic("");
      setCreating(false);
      const created = await res.json();
      await mutate("/api/channels");
      onSelect(created.id);
      toast.success(`Channel #${created.name} created`, {
        description: "Invite teammates by mentioning them.",
      });
    } catch (err) {
      toast.fromError(err, "Couldn't create channel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <aside className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5">
        <div className="flex items-center justify-between px-2 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Channels
          </p>
          <button
            onClick={() => setCreating(true)}
            className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            aria-label="New channel"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          {regularChannels.length === 0 ? (
            <button
              onClick={() => setCreating(true)}
              className="mx-1 mb-2 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg border border-dashed border-foreground/[0.12] px-2.5 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-violet-400/40 hover:bg-violet-500/[0.04] hover:text-foreground"
            >
              <Plus className="size-3.5 shrink-0 text-violet-500 dark:text-violet-300" />
              <span className="flex-1">Create a channel</span>
            </button>
          ) : (
            regularChannels.map((c) => {
              const Icon = c.isPrivate ? Lock : Hash;
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                    isActive
                      ? "bg-white/[0.05] text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="ch-active"
                      className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-violet-400"
                    />
                  )}
                </button>
              );
            })
          )}

          {dmChannels.length > 0 && (
            <div className="mt-4">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Direct messages
              </p>
              {dmChannels.map((c) => {
                const peer = resolveDMPeer(c.name, currentUserId, members);
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "group relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                      isActive
                        ? "bg-white/[0.05] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                    )}
                  >
                    {peer ? (
                      <div className="relative shrink-0">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={peer.image} alt={peer.name} />
                          <AvatarFallback className="text-[10px]">
                            {peer.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <PresenceDot
                          state={peer.presence}
                          size="xs"
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      </div>
                    ) : (
                      <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate text-sm">
                      {peer?.name ?? c.topic ?? "Direct message"}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="ch-active"
                        className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-violet-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* DM picker is ALWAYS visible — it's how members reach each other. */}
          {currentUserId && (
            <div className="mt-4">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {dmChannels.length === 0 ? "Message a teammate" : "Start a new DM"}
              </p>
              {members.filter(
                (m) =>
                  m.id !== currentUserId &&
                  !dmChannels.some((c) => c.name.includes(m.id))
              ).length === 0 ? (
                <p className="px-2 py-2 text-[11px] text-muted-foreground">
                  {members.length <= 1
                    ? "No teammates in this workspace yet."
                    : "You're already chatting with everyone."}
                </p>
              ) : (
                members
                  .filter(
                    (m) =>
                      m.id !== currentUserId &&
                      !dmChannels.some((c) => c.name.includes(m.id))
                  )
                  .slice(0, 8)
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onStartDM(m.id)}
                      title={`Message ${m.name}`}
                      className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-muted-foreground transition-colors hover:bg-violet-500/[0.06] hover:text-foreground"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={m.image} alt={m.name} />
                          <AvatarFallback className="text-[10px]">
                            {m.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <PresenceDot
                          state={m.presence}
                          size="xs"
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      </div>
                      <span className="flex-1 truncate text-sm">{m.name}</span>
                      <MessageSquare className="size-3 text-muted-foreground/60 transition-colors group-hover:text-violet-500 dark:group-hover:text-violet-300" />
                    </button>
                  ))
              )}
            </div>
          )}
        </div>
      </aside>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create channel</DialogTitle>
            <DialogDescription>
              Channels are spaces for focused conversations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="design-reviews"
                autoFocus
                className="mt-1"
                disabled={busy}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Topic (optional)
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Where we critique mocks"
                className="mt-1"
                disabled={busy}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || busy}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Active channel timeline + composer
// ─────────────────────────────────────────────────────────────────────

function ChannelArea({ channel }: { channel: ChannelDTO | null }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const key = channel ? `/api/channels/${channel.id}/messages` : null;
  const { data, isLoading } = useSWR<{ messages: MessageDTO[] }>(key, {
    refreshInterval: 4_000,
  });
  const [draft, setDraft] = React.useState("");
  const [attachments, setAttachments] = React.useState<AttachmentDraft[]>([]);
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { data: membersData } = useSWR<{ members: Member[] }>("/api/members");
  const members = membersData?.members ?? [];

  const messages = data?.messages ?? [];

  // Auto-scroll to bottom on new message (only if user is near the bottom).
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < 200) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, sending]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [channel?.id]);

  async function send() {
    if (!channel) return;
    const trimmed = draft.trim();
    if (!trimmed && attachments.length === 0) return;
    setSending(true);

    const optimistic: MessageDTO = {
      id: `temp-${Date.now()}`,
      body: trimmed,
      mentions: [],
      attachments,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUserId || "",
        name: session?.user?.name || "You",
        handle: "you",
        image: session?.user?.image || null,
      },
    };
    mutate(
      key!,
      (curr: { messages?: MessageDTO[] } | undefined) =>
        curr
          ? { ...curr, messages: [...(curr.messages || []), optimistic] }
          : { messages: [optimistic] },
      false
    );

    setDraft("");
    setAttachments([]);
    try {
      const res = await fetch(`/api/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, attachments }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
    } catch (err) {
      toast.fromError(err, "Message failed to send");
      setDraft(trimmed);
      setAttachments(optimistic.attachments);
    } finally {
      setSending(false);
    }
    void mutate(key!);
    void mutate("/api/channels");
    void mutate("/api/notifications");
  }

  if (!channel) {
    return (
      <section className="grid place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-nova-gradient/15 text-violet-600 dark:text-violet-200">
            <MessageSquare className="size-5" />
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold">
            Start a conversation
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pick a teammate from the left sidebar to send them a direct
            message, or hit <span className="font-medium text-foreground">+</span>{" "}
            at the top to create a shared channel.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-[radial-gradient(ellipse_at_top,rgba(94, 106, 210,0.14),transparent)]" />

      {/* Channel header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-white/[0.04] text-violet-300">
            {channel.isPrivate ? (
              <Lock className="size-4" />
            ) : (
              <Hash className="size-4" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold">#{channel.name}</h2>
            <p className="text-xs text-muted-foreground">
              {channel.topic || "No topic yet — set one to keep things focused."}
            </p>
          </div>
        </div>
        <LiveDot />
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {isLoading && messages.length === 0 ? (
          <SkeletonChat rows={5} />
        ) : messages.length === 0 ? (
          <EmptyChannel name={channel.name} />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const sameAuthor =
                prev && prev.author.id === m.author.id &&
                new Date(m.createdAt).getTime() -
                  new Date(prev.createdAt).getTime() <
                  4 * 60_000;
              return (
                <ChatMessage
                  key={m.id}
                  message={m}
                  collapsed={sameAuthor}
                  currentUserId={currentUserId}
                  members={members}
                />
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-white/[0.06] p-3">
        <MentionInput
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          placeholder={`Message #${channel.name}…`}
          rows={2}
        />
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <AnimatePresence>
              {attachments.map((a, i) => (
                <AttachmentPill
                  key={a.name + i}
                  att={a}
                  onRemove={() =>
                    setAttachments(attachments.filter((_, j) => j !== i))
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileAttachmentButton
              attachments={attachments}
              onChange={setAttachments}
              channelId={channel?.id}
            />
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              aria-label="Insert emoji"
              disabled
            >
              <Smile className="size-3.5" />
            </button>
          </div>
          <Button
            size="sm"
            onClick={send}
            disabled={sending || (!draft.trim() && attachments.length === 0)}
          >
            {sending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Send
          </Button>
        </div>
        <p className="mt-1.5 text-center font-mono text-[9px] text-muted-foreground/70">
          Enter to send · Shift+Enter for newline · @ to mention
        </p>
      </div>
    </section>
  );
}

function ChatMessage({
  message,
  collapsed,
  currentUserId,
  members,
}: {
  message: MessageDTO;
  collapsed: boolean;
  currentUserId?: string | null;
  members: Member[];
}) {
  const isMentioned =
    currentUserId && message.mentions?.includes(currentUserId);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "flex gap-3",
        collapsed && "-mt-3",
        isMentioned &&
          "-mx-2 rounded-lg border-l-2 border-amber-400/60 bg-amber-500/[0.03] px-2 py-1"
      )}
    >
      {!collapsed ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.author.image || undefined} alt={message.author.name} />
          <AvatarFallback>{message.author.name[0]}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        {!collapsed && (
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-semibold">{message.author.name}</p>
            <span className="text-[10px] text-muted-foreground">
              @{message.author.handle}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              · {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        <div className="mt-0.5 text-sm">
          <MentionedText
            text={message.body}
            currentUserId={currentUserId}
            members={members}
          />
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <AttachmentList items={message.attachments} />
        )}
      </div>
    </motion.div>
  );
}

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-200">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      Live
    </span>
  );
}

function EmptyChannel({ name }: { name: string }) {
  return (
    <div className="grid place-items-center px-4 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-nova-gradient/20 text-violet-200">
        <Hash className="size-5" />
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold">
        Welcome to #{name}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        This is the start of the channel. Drop a message — your teammates
        will see it instantly.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Members sidebar (right)
// ─────────────────────────────────────────────────────────────────────

function MembersSidebar({
  currentUserId,
  onStartDM,
}: {
  currentUserId: string | undefined;
  onStartDM: (memberId: string) => void;
}) {
  const { data, isLoading } = useSWR<{ members: Member[] }>("/api/members", {
    refreshInterval: 20_000,
  });
  const members = data?.members ?? [];

  const online = members.filter((m) => m.presence === "online");
  const away = members.filter((m) => m.presence === "away");
  const offline = members.filter((m) => m.presence === "offline");

  return (
    <aside className="hidden flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 xl:flex">
      <div className="flex items-center justify-between px-2 pb-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="size-3" />
          {isLoading ? (
            <Skeleton className="h-2.5 w-16" />
          ) : (
            <>Team · {members.length}</>
          )}
        </p>
        {!isLoading && (
          <span className="text-[10px] text-emerald-300">
            {online.length} online
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonListRow key={i} />
            ))}
          </div>
        ) : (
          <>
            <MemberGroup
              title="Online"
              tone="emerald"
              members={online}
              currentUserId={currentUserId}
              onStartDM={onStartDM}
            />
            <MemberGroup
              title="Away"
              tone="amber"
              members={away}
              currentUserId={currentUserId}
              onStartDM={onStartDM}
            />
            <MemberGroup
              title="Offline"
              tone="zinc"
              members={offline}
              currentUserId={currentUserId}
              onStartDM={onStartDM}
            />
          </>
        )}
      </div>
    </aside>
  );
}

function MemberGroup({
  title,
  tone,
  members,
  currentUserId,
  onStartDM,
}: {
  title: string;
  tone: "emerald" | "amber" | "zinc";
  members: Member[];
  currentUserId: string | undefined;
  onStartDM: (memberId: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  if (members.length === 0) return null;
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground"
      >
        <ChevronRight
          className={cn(
            "size-3 transition-transform",
            open && "rotate-90"
          )}
        />
        {title} · {members.length}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {members.map((m) => {
              const isSelf = m.id === currentUserId;
              return (
                <div
                  key={m.id}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.image} alt={m.name} />
                      <AvatarFallback>{m.name[0]}</AvatarFallback>
                    </Avatar>
                    <PresenceDot
                      state={m.presence}
                      size="xs"
                      className="absolute -bottom-0.5 -right-0.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-xs",
                        tone === "zinc" ? "text-muted-foreground" : "text-foreground/95"
                      )}
                    >
                      {m.name}
                      {isSelf && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                  </div>
                  {!isSelf && currentUserId && (
                    <button
                      onClick={() => onStartDM(m.id)}
                      title={`Message ${m.name}`}
                      aria-label={`Message ${m.name}`}
                      className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground/60 transition-colors hover:bg-violet-500/10 hover:text-violet-500 dark:hover:text-violet-300"
                    >
                      <MessageSquare className="size-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
