"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  AtSign,
  UserPlus,
  MessageSquare,
  CalendarClock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkeletonListRow } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface NotificationDTO {
  id: string;
  kind:
    | "mention"
    | "assigned"
    | "comment"
    | "project_invite"
    | "due_soon"
    | "ai_insight"
    | "anomaly"
    | "system"
    | "dm"
    | "message";
  priority: "low" | "normal" | "high";
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
  actor: { id: string; name: string; image: string | null } | null;
}

interface NotificationsResponse {
  unreadCount: number;
  notifications: NotificationDTO[];
}

const KIND_META: Record<
  NotificationDTO["kind"],
  { icon: React.ElementType; tone: string }
> = {
  mention: { icon: AtSign, tone: "text-violet-300 bg-violet-500/15" },
  assigned: { icon: UserPlus, tone: "text-cyan-300 bg-cyan-500/15" },
  comment: { icon: MessageSquare, tone: "text-fuchsia-300 bg-fuchsia-500/15" },
  project_invite: { icon: UserPlus, tone: "text-emerald-300 bg-emerald-500/15" },
  due_soon: { icon: CalendarClock, tone: "text-amber-300 bg-amber-500/15" },
  ai_insight: { icon: Sparkles, tone: "text-violet-300 bg-violet-500/15" },
  anomaly: { icon: AlertTriangle, tone: "text-rose-300 bg-rose-500/15" },
  system: { icon: CheckCircle2, tone: "text-zinc-300 bg-zinc-500/15" },
  dm: { icon: MessageSquare, tone: "text-violet-300 bg-violet-500/15" },
  message: { icon: MessageSquare, tone: "text-cyan-300 bg-cyan-500/15" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const { data, isLoading } = useSWR<NotificationsResponse>(
    "/api/notifications",
    { refreshInterval: 15_000, revalidateOnFocus: true }
  );

  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  // Track what we've already toasted so a single new DM doesn't pop a
  // toast on every 15s refresh. First mount seeds the set silently.
  const seenIdsRef = React.useRef<Set<string> | null>(null);
  React.useEffect(() => {
    if (!data) return;
    if (seenIdsRef.current === null) {
      seenIdsRef.current = new Set(items.map((n) => n.id));
      return;
    }
    const seen = seenIdsRef.current;
    for (const n of items) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      // Already-read notifications would only appear here if a backfill
      // happened — skip them so we don't toast on history changes.
      if (n.readAt) continue;
      // Only the high-signal kinds get a toast pop; channel-message
      // notifications bump the badge silently.
      if (n.kind === "dm" || n.kind === "mention" || n.kind === "assigned") {
        toast.info(n.title, {
          description: n.body?.slice(0, 140),
          action: n.url
            ? { label: "Open", onClick: () => (window.location.href = n.url!) }
            : undefined,
        });
      }
    }
  }, [data, items]);

  async function markRead(id: string) {
    mutate(
      "/api/notifications",
      (curr: NotificationsResponse | undefined) => {
        if (!curr) return curr;
        return {
          ...curr,
          unreadCount: Math.max(0, curr.unreadCount - 1),
          notifications: curr.notifications.map((n) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
          ),
        };
      },
      false
    );
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
  }

  async function markAllRead() {
    if (!unread) return;
    const previousUnread = unread;
    mutate(
      "/api/notifications",
      (curr: NotificationsResponse | undefined) => {
        if (!curr) return curr;
        const now = new Date().toISOString();
        return {
          ...curr,
          unreadCount: 0,
          notifications: curr.notifications.map((n) => ({ ...n, readAt: n.readAt ?? now })),
        };
      },
      false
    );
    try {
      const res = await fetch("/api/notifications", { method: "POST" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      toast.success("Inbox cleared", {
        description: `Marked ${previousUnread} notification${previousUnread === 1 ? "" : "s"} as read.`,
      });
    } catch (err) {
      toast.fromError(err, "Could not mark all as read");
    }
    mutate("/api/notifications");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
        >
          <Bell className="size-4" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(244, 63, 94, 0.18)]"
              >
                {unread > 99 ? "99+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[380px] overflow-hidden border-white/[0.06] bg-background/85 p-0 backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Inbox</h3>
            <p className="text-[11px] text-muted-foreground">
              {unread === 0 ? "All caught up" : `${unread} unread`}
            </p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={!unread}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:opacity-50"
          >
            <Check className="size-3" /> Mark all read
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 px-2 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyInbox />
          ) : (
            <AnimatePresence initial={false}>
              {items.map((n) => {
                const meta = KIND_META[n.kind] || KIND_META.system;
                const Icon = meta.icon;
                const unreadCard = !n.readAt;
                return (
                  <motion.a
                    key={n.id}
                    href={n.url || "#"}
                    layout
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    onClick={() => {
                      if (unreadCard) void markRead(n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "group flex gap-3 border-b border-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.03]",
                      unreadCard && "bg-violet-500/[0.05]"
                    )}
                  >
                    {n.actor?.image ? (
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={n.actor.image} alt={n.actor.name} />
                          <AvatarFallback>
                            {n.actor.name?.[0] ?? "·"}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full ring-2 ring-background",
                            meta.tone
                          )}
                        >
                          <Icon className="size-2.5" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg",
                          meta.tone
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-medium text-foreground/95">
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground/80">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                    </div>
                    {unreadCard && (
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(129, 140, 248,0.7)]" />
                    )}
                  </motion.a>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-4 py-2.5 text-center">
          <a
            href="/dashboard"
            className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Open full inbox →
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EmptyInbox() {
  return (
    <div className="grid place-items-center px-6 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-nova-gradient/20 text-violet-200">
        <Inbox className="size-5" />
      </div>
      <p className="mt-3 text-sm font-medium">You&apos;re all caught up</p>
      <p className="mt-1 text-xs text-muted-foreground">
        New notifications will appear here.
      </p>
    </div>
  );
}
