"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  Plus,
  Sparkles,
  Filter,
  AlertCircle,
  Clock,
  Inbox,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Status = "todo" | "in_progress" | "done";
type Priority = "urgent" | "high" | "med" | "low";

interface Task {
  id: string;
  identifier: string;
  title: string;
  project: { name: string; color: string };
  status: Status;
  priority: Priority;
  due: string;
  assignee: { name: string; seed: string };
  ai?: boolean;
  attachments?: number;
  comments?: number;
}

const seed: Task[] = [
  {
    id: "t1",
    identifier: "PAY-482",
    title: "Ship payments redesign · phase 2",
    project: { name: "Payments v2", color: "bg-violet-500" },
    status: "in_progress",
    priority: "urgent",
    due: "Today",
    assignee: { name: "Maya", seed: "Maya" },
    attachments: 5,
    comments: 7,
  },
  {
    id: "t2",
    identifier: "OPS-204",
    title: "Review Q3 OKRs with leadership",
    project: { name: "Strategy", color: "bg-cyan-500" },
    status: "done",
    priority: "high",
    due: "Today",
    assignee: { name: "Sara", seed: "Sara" },
    comments: 4,
  },
  {
    id: "t3",
    identifier: "COM-091",
    title: "Draft Loom recap of sprint review",
    project: { name: "Comms", color: "bg-fuchsia-500" },
    status: "todo",
    priority: "med",
    due: "Today",
    assignee: { name: "Nova AI", seed: "Nova" },
    ai: true,
  },
  {
    id: "t4",
    identifier: "PLA-318",
    title: "Pair on rate-limit retry strategy",
    project: { name: "Platform", color: "bg-amber-500" },
    status: "in_progress",
    priority: "high",
    due: "Tomorrow",
    assignee: { name: "Daniel", seed: "Daniel" },
    comments: 2,
  },
  {
    id: "t5",
    identifier: "GRO-117",
    title: "Update onboarding analytics doc",
    project: { name: "Growth", color: "bg-emerald-500" },
    status: "todo",
    priority: "low",
    due: "Thu",
    assignee: { name: "Lucas", seed: "Lucas" },
    attachments: 1,
  },
  {
    id: "t6",
    identifier: "TRU-051",
    title: "SSO + SCIM provisioning · audit log spec",
    project: { name: "Trust", color: "bg-blue-500" },
    status: "todo",
    priority: "high",
    due: "Fri",
    assignee: { name: "Aisha", seed: "Aisha" },
  },
];

const statusIcons = {
  todo: { Icon: Circle, color: "text-muted-foreground" },
  in_progress: { Icon: CircleDot, color: "text-cyan-400" },
  done: { Icon: CheckCircle2, color: "text-emerald-400" },
} as const;

const priorityStyles = {
  urgent: { dot: "bg-rose-400", label: "Urgent", text: "text-rose-300" },
  high: { dot: "bg-amber-400", label: "High", text: "text-amber-300" },
  med: { dot: "bg-cyan-400", label: "Med", text: "text-cyan-300" },
  low: { dot: "bg-muted-foreground/60", label: "Low", text: "text-muted-foreground" },
} as const;

export function RecentTasks() {
  const [tasks, setTasks] = React.useState(seed);
  const [filter, setFilter] = React.useState<"all" | "mine" | "today">("today");

  function cycleStatus(id: string) {
    setTasks((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        const next: Status =
          t.status === "todo"
            ? "in_progress"
            : t.status === "in_progress"
              ? "done"
              : "todo";
        return { ...t, status: next };
      })
    );
  }

  const filtered = tasks.filter((t) => {
    if (filter === "today") return t.due === "Today" || t.due === "Tomorrow";
    return true;
  });
  const open = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Inbox className="size-3" />
            Recent tasks
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-sm font-semibold">My queue</h3>
            <span className="font-mono text-xs text-muted-foreground">
              {open} open
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FilterTabs filter={filter} setFilter={setFilter} />
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground">
            <Filter className="size-3" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-nova-gradient px-2.5 text-xs font-medium text-white shadow-glow">
            <Plus className="size-3" />
            New
          </button>
        </div>
      </div>

      {/* rows */}
      <ul className="divide-y divide-white/[0.04]">
        <AnimatePresence initial={false}>
          {filtered.map((t, i) => {
            const status = statusIcons[t.status];
            const StatusIcon = status.Icon;
            const pri = priorityStyles[t.priority];

            return (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "group/row relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.025] sm:px-5",
                  t.status === "done" && "opacity-60"
                )}
              >
                {/* priority dot */}
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", pri.dot)}
                  title={pri.label}
                />

                {/* identifier */}
                <span className="hidden w-[60px] shrink-0 font-mono text-[10px] text-muted-foreground sm:inline">
                  {t.identifier}
                </span>

                {/* status toggle */}
                <button
                  onClick={() => cycleStatus(t.id)}
                  className="grid h-5 w-5 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                  title={t.status}
                >
                  <StatusIcon className={cn("size-4", status.color)} />
                </button>

                {/* title + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm font-medium text-foreground/95",
                        t.status === "done" &&
                          "line-through text-muted-foreground"
                      )}
                    >
                      {t.title}
                    </span>
                    {t.ai && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-1 py-0.5 text-[9px] font-medium text-violet-200">
                        <Sparkles className="size-2.5" />
                        AI
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span
                      className={cn(
                        "inline-block size-1.5 rounded-full",
                        t.project.color
                      )}
                    />
                    <span>{t.project.name}</span>
                  </div>
                </div>

                {/* attachments / comments */}
                <div className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex">
                  {t.attachments != null && (
                    <span className="inline-flex items-center gap-0.5">
                      <span className="font-mono">{t.attachments}</span> 📎
                    </span>
                  )}
                  {t.comments != null && (
                    <span className="inline-flex items-center gap-0.5">
                      <span className="font-mono">{t.comments}</span> 💬
                    </span>
                  )}
                </div>

                {/* due */}
                <span
                  className={cn(
                    "hidden items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] sm:inline-flex",
                    t.due === "Today"
                      ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
                      : t.due === "Tomorrow"
                        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/[0.04] text-muted-foreground"
                  )}
                >
                  {t.due === "Today" || t.due === "Tomorrow" ? (
                    <Clock className="size-2.5" />
                  ) : null}
                  {t.due}
                </span>

                {/* assignee */}
                <Avatar className="h-6 w-6 ring-1 ring-white/10">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.assignee.seed}`}
                    alt={t.assignee.name}
                  />
                  <AvatarFallback>{t.assignee.seed[0]}</AvatarFallback>
                </Avatar>

                {/* keyboard shortcut hint on hover */}
                <kbd className="hidden font-mono text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 lg:inline">
                  ↵
                </kbd>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {/* footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <AlertCircle className="size-3" />
          Press
          <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 font-mono">
            C
          </kbd>
          to create
          <span className="text-foreground/30">·</span>
          <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 font-mono">
            ⌘ K
          </kbd>
          for everything
        </div>
        <button className="text-[10px] font-medium text-muted-foreground hover:text-foreground">
          View all →
        </button>
      </div>
    </div>
  );
}

function FilterTabs({
  filter,
  setFilter,
}: {
  filter: "all" | "mine" | "today";
  setFilter: (f: "all" | "mine" | "today") => void;
}) {
  const tabs = [
    { id: "today", label: "Today" },
    { id: "mine", label: "Mine" },
    { id: "all", label: "All" },
  ] as const;
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setFilter(t.id)}
          className={cn(
            "relative rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
            t.id === filter
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.id === filter && (
            <motion.span
              layoutId="tasks-filter-pill"
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="absolute inset-0 rounded-md bg-white/[0.06]"
            />
          )}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
