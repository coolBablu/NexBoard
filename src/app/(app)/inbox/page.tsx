"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  AtSign,
  UserPlus,
  MessageSquare,
  CalendarClock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Inbox as InboxIcon,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonListRow } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
    | "system";
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
  { icon: React.ElementType; tone: string; label: string }
> = {
  mention: {
    icon: AtSign,
    tone: "text-violet-300 bg-violet-500/15",
    label: "Mention",
  },
  assigned: {
    icon: UserPlus,
    tone: "text-cyan-300 bg-cyan-500/15",
    label: "Assigned",
  },
  comment: {
    icon: MessageSquare,
    tone: "text-fuchsia-300 bg-fuchsia-500/15",
    label: "Comment",
  },
  project_invite: {
    icon: UserPlus,
    tone: "text-emerald-300 bg-emerald-500/15",
    label: "Invite",
  },
  due_soon: {
    icon: CalendarClock,
    tone: "text-amber-300 bg-amber-500/15",
    label: "Due soon",
  },
  ai_insight: {
    icon: Sparkles,
    tone: "text-violet-300 bg-violet-500/15",
    label: "AI insight",
  },
  anomaly: {
    icon: AlertTriangle,
    tone: "text-rose-300 bg-rose-500/15",
    label: "Anomaly",
  },
  system: {
    icon: CheckCircle2,
    tone: "text-zinc-300 bg-zinc-500/15",
    label: "System",
  },
};

type FilterTab = "all" | "unread" | "mentions" | "ai";

export default function InboxPage() {
  const [tab, setTab] = React.useState<FilterTab>("all");
  const [query, setQuery] = React.useState("");
  const { data, isLoading } = useSWR<NotificationsResponse>(
    "/api/notifications",
    { refreshInterval: 20_000 }
  );

  const all = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  const filteredByTab = React.useMemo(() => {
    switch (tab) {
      case "unread":
        return all.filter((n) => !n.readAt);
      case "mentions":
        return all.filter((n) => n.kind === "mention");
      case "ai":
        return all.filter((n) => n.kind === "ai_insight" || n.kind === "anomaly");
      default:
        return all;
    }
  }, [all, tab]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return filteredByTab;
    const q = query.toLowerCase();
    return filteredByTab.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.actor?.name.toLowerCase().includes(q)
    );
  }, [filteredByTab, query]);

  // Group by relative-day bucket.
  const grouped = React.useMemo(() => groupByBucket(filtered), [filtered]);

  async function markAllRead() {
    if (!unread) return;
    const previous = unread;
    mutate(
      "/api/notifications",
      (curr: NotificationsResponse | undefined) => {
        if (!curr) return curr;
        const now = new Date().toISOString();
        return {
          ...curr,
          unreadCount: 0,
          notifications: curr.notifications.map((n) => ({
            ...n,
            readAt: n.readAt ?? now,
          })),
        };
      },
      false
    );
    try {
      const res = await fetch("/api/notifications", { method: "POST" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      toast.success("Inbox cleared", {
        description: `Marked ${previous} notification${previous === 1 ? "" : "s"} as read.`,
      });
    } catch (err) {
      toast.fromError(err, "Couldn't mark all as read");
    }
    mutate("/api/notifications");
  }

  async function markOneRead(id: string) {
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

  return (
    <AppShell
      title="Inbox"
      description="Mentions, assignments, comments, AI insights."
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">
            Notifications
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your{" "}
            <span className="text-gradient-nova">
              {unread > 0 ? `${unread} unread` : "clean"}
            </span>{" "}
            inbox.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search inbox"
              className="h-10 w-56 pl-8"
            />
          </div>
          <Button
            variant="secondary"
            size="default"
            onClick={markAllRead}
            disabled={!unread}
          >
            <Check className="size-3.5" />
            Mark all read
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as FilterTab)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="all">
            All
            {all.length > 0 && (
              <span className="ml-1.5 rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {all.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unread > 0 && (
              <span className="ml-1.5 rounded-md bg-rose-500/15 px-1.5 py-0.5 font-mono text-[10px] text-rose-200">
                {unread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {isLoading ? (
            <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyInbox query={query} tab={tab} onClear={() => setQuery("")} />
          ) : (
            <div className="space-y-8">
              {grouped.map(({ bucket, items }) => (
                <section key={bucket}>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {bucket}
                    <span className="ml-2 font-mono text-muted-foreground/60">
                      · {items.length}
                    </span>
                  </h3>
                  <ul className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <AnimatePresence initial={false}>
                      {items.map((n) => (
                        <NotificationRow
                          key={n.id}
                          notification={n}
                          onClick={() => {
                            if (!n.readAt) void markOneRead(n.id);
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function NotificationRow({
  notification: n,
  onClick,
}: {
  notification: NotificationDTO;
  onClick: () => void;
}) {
  const meta = KIND_META[n.kind] ?? KIND_META.system;
  const Icon = meta.icon;
  const isUnread = !n.readAt;
  const href = n.url || "#";
  const isInternal = href.startsWith("/");

  const body = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group flex items-start gap-3 border-b border-white/[0.04] px-5 py-4 transition-colors hover:bg-white/[0.03]",
        isUnread && "bg-violet-500/[0.04]"
      )}
    >
      {n.actor?.image ? (
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={n.actor.image} alt={n.actor.name} />
            <AvatarFallback>{n.actor.name?.[0] ?? "·"}</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full ring-2 ring-background",
              meta.tone
            )}
          >
            <Icon className="size-3" />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            meta.tone
          )}
        >
          <Icon className="size-4.5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug text-foreground/95">
            {n.title}
          </p>
          <span
            suppressHydrationWarning
            className="shrink-0 font-mono text-[10px] text-muted-foreground/70"
          >
            <RelativeTime iso={n.createdAt} />
          </span>
        </div>
        {n.body && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {n.body}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.02] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground",
              n.priority === "high" && "border-rose-500/30 text-rose-200"
            )}
          >
            {meta.label}
          </span>
          {n.actor && (
            <span className="text-[10px] text-muted-foreground">
              via {n.actor.name}
            </span>
          )}
        </div>
      </div>
      {isUnread && (
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(129, 140, 248,0.7)]" />
      )}
    </motion.div>
  );

  return (
    <li>
      {isInternal ? (
        <Link href={href} onClick={onClick} className="block">
          {body}
        </Link>
      ) : (
        <a href={href} onClick={onClick} className="block">
          {body}
        </a>
      )}
    </li>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  // Defer to client-only — server's "now" ≠ client's "now" causes a #418.
  const [label, setLabel] = React.useState("");
  React.useEffect(() => {
    const fmt = () => {
      const diff = Date.now() - new Date(iso).getTime();
      const m = Math.floor(diff / 60_000);
      if (m < 1) return "now";
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      if (d < 7) return `${d}d ago`;
      return new Date(iso).toLocaleDateString();
    };
    setLabel(fmt());
    const t = setInterval(() => setLabel(fmt()), 60_000);
    return () => clearInterval(t);
  }, [iso]);
  return <>{label}</>;
}

function EmptyInbox({
  query,
  tab,
  onClear,
}: {
  query: string;
  tab: FilterTab;
  onClear: () => void;
}) {
  if (query) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] py-16 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold">
          No results for &ldquo;{query}&rdquo;
        </h3>
        <Button variant="ghost" className="mt-3" onClick={onClear}>
          Clear search
        </Button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] py-16 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-nova-gradient/20 text-violet-200">
        <InboxIcon className="size-6" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">
        You&apos;re all caught up
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {tab === "unread"
          ? "No unread notifications. Switch to All to see your history."
          : tab === "mentions"
            ? "No one has mentioned you yet. Try @ in any chat or comment."
            : tab === "ai"
              ? "Nova hasn't surfaced any insights yet — give it some data."
              : "New notifications will appear here as your team gets to work."}
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <Button asChild variant="secondary">
          <Link href="/team">
            <Filter className="size-3.5" />
            Open Team chat
          </Link>
        </Button>
        <Button asChild>
          <Link href="/assistant">
            <Sparkles className="size-3.5" />
            Ask Nova
          </Link>
        </Button>
      </div>
    </div>
  );
}

function groupByBucket(items: NotificationDTO[]) {
  const buckets: Record<string, NotificationDTO[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Earlier: [],
  };
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const n of items) {
    const age = now - new Date(n.createdAt).getTime();
    if (age < dayMs) buckets.Today.push(n);
    else if (age < 2 * dayMs) buckets.Yesterday.push(n);
    else if (age < 7 * dayMs) buckets["This week"].push(n);
    else buckets.Earlier.push(n);
  }

  return Object.entries(buckets)
    .filter(([, v]) => v.length > 0)
    .map(([bucket, items]) => ({ bucket, items }));
}
