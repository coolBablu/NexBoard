"use client";

import * as React from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  CircleArrowUp,
  FolderPlus,
  FolderCog,
  MessageSquare,
  Sparkles,
  UserPlus,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ActivityDTO {
  id: string;
  type:
    | "task_created"
    | "task_completed"
    | "task_moved"
    | "project_created"
    | "project_updated"
    | "comment_added"
    | "ai_summary"
    | "member_joined"
    | "anomaly_flagged";
  text: string;
  createdAt: string;
  refType: string | null;
  refId: string | null;
  actor: { id: string; name: string; email: string; image: string | null } | null;
}

const META: Record<ActivityDTO["type"], { icon: React.ElementType; tone: string }> = {
  task_created: { icon: CircleArrowUp, tone: "text-cyan-300 bg-cyan-500/10" },
  task_completed: { icon: CheckCircle2, tone: "text-emerald-300 bg-emerald-500/10" },
  task_moved: { icon: ActivityIcon, tone: "text-amber-300 bg-amber-500/10" },
  project_created: { icon: FolderPlus, tone: "text-violet-300 bg-violet-500/10" },
  project_updated: { icon: FolderCog, tone: "text-violet-300 bg-violet-500/10" },
  comment_added: { icon: MessageSquare, tone: "text-fuchsia-300 bg-fuchsia-500/10" },
  ai_summary: { icon: Sparkles, tone: "text-violet-300 bg-violet-500/10" },
  member_joined: { icon: UserPlus, tone: "text-emerald-300 bg-emerald-500/10" },
  anomaly_flagged: { icon: AlertTriangle, tone: "text-rose-300 bg-rose-500/10" },
};

/**
 * Vertical animated activity timeline.
 *
 *   · Pulls /api/activities every 15 s.
 *   · New rows slide in from the top with a subtle scale-up.
 *   · Groups by day with sticky-style dividers.
 *   · Click an item with a `refId` to deep-link (TODO: wire to drawer).
 */
export function ActivityTimeline() {
  const { data, isLoading } = useSWR<{ activities: ActivityDTO[] }>(
    "/api/activities",
    { refreshInterval: 15_000 }
  );

  const activities = data?.activities ?? [];

  // Group by day (Today / Yesterday / dd MMM).
  const groups = React.useMemo(() => {
    const map = new Map<string, ActivityDTO[]>();
    for (const a of activities) {
      const day = bucketDay(a.createdAt);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(a);
    }
    return Array.from(map.entries());
  }, [activities]);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <div>
          <h3 className="font-display text-base font-semibold">Activity</h3>
          <p className="text-xs text-muted-foreground">
            Everything that&apos;s happening in your workspace.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-violet-200">
          <span className="size-1 rounded-full bg-violet-400" />
          Live
        </span>
      </div>

      <div className="px-2 pb-3 pt-2">
        {isLoading && activities.length === 0 ? (
          <div className="space-y-2 px-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-1">
                <Skeleton variant="circle" className="h-7 w-7 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="grid place-items-center px-3 py-12 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <Inbox className="size-5 text-muted-foreground" />
            </div>
            <h4 className="mt-3 font-display text-base font-semibold">
              Nothing here yet
            </h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Start a task, send a message, or invite a teammate — every action
              flows into this timeline.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical rail */}
            <div className="absolute left-[27px] top-1 bottom-1 w-px bg-gradient-to-b from-violet-500/40 via-white/10 to-transparent" />
            <AnimatePresence initial={false}>
              {groups.map(([day, items]) => (
                <div key={day}>
                  <div className="sticky top-0 z-10 -ml-1 mt-1 mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-background/85 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                    {day}
                  </div>
                  {items.map((a) => (
                    <ActivityRow key={a.id} activity={a} />
                  ))}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

function ActivityRow({ activity }: { activity: ActivityDTO }) {
  const meta = META[activity.type] ?? META.task_created;
  const Icon = meta.icon;
  const actor = activity.actor;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="group relative ml-1 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.025]"
    >
      <div
        className={cn(
          "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-background/95",
          meta.tone
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-sm">
            {actor ? (
              <>
                <span className="font-semibold">{actor.name}</span>{" "}
                <span className="text-muted-foreground">{activity.text}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{activity.text}</span>
            )}
          </p>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground/80">
          {formatTime(activity.createdAt)}
        </p>
      </div>
      {actor?.image && (
        <Avatar className="hidden h-6 w-6 group-hover:block sm:block">
          <AvatarImage src={actor.image} alt={actor.name} />
          <AvatarFallback>{actor.name[0]}</AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}

function bucketDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.floor(
    (startOf(today).getTime() - startOf(d).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleString([], { hour: "2-digit", minute: "2-digit" });
}
