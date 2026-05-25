"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Sparkles,
  Plus,
  Circle,
  Coffee,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type EventTone = "violet" | "cyan" | "fuchsia" | "emerald" | "amber";
type EventType = "meeting" | "review" | "focus" | "ai" | "break";

interface CalEvent {
  id: string;
  dayOffset: number; // days from today (0 = today)
  hour: number;
  minute: number;
  duration: number; // minutes
  title: string;
  attendees?: number;
  tone: EventTone;
  type: EventType;
}

const TONE_DOT: Record<EventTone, string> = {
  violet: "bg-violet-400",
  cyan: "bg-cyan-400",
  fuchsia: "bg-fuchsia-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
};

const TONE_BG: Record<EventTone, string> = {
  violet: "bg-violet-500/15 border-violet-500/30 text-violet-100",
  cyan: "bg-cyan-500/15 border-cyan-500/30 text-cyan-100",
  fuchsia: "bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-100",
  emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-100",
  amber: "bg-amber-500/15 border-amber-500/30 text-amber-100",
};

const TYPE_ICON: Record<EventType, React.ElementType> = {
  meeting: Video,
  review: CalendarIcon,
  focus: Circle,
  ai: Sparkles,
  break: Coffee,
};

// Hand-curated demo schedule, relative to "today". Anchor stays stable
// across renders because we resolve "today" once on mount.
const DEMO_EVENTS: CalEvent[] = [
  { id: "e1", dayOffset: 0, hour: 9, minute: 0, duration: 30, title: "Standup", tone: "cyan", type: "meeting", attendees: 6 },
  { id: "e2", dayOffset: 0, hour: 11, minute: 0, duration: 60, title: "Sprint review", tone: "violet", type: "meeting", attendees: 12 },
  { id: "e3", dayOffset: 0, hour: 13, minute: 0, duration: 90, title: "Deep work · payments retry logic", tone: "emerald", type: "focus" },
  { id: "e4", dayOffset: 0, hour: 14, minute: 30, duration: 30, title: "Maya 1:1", tone: "cyan", type: "meeting", attendees: 2 },
  { id: "e5", dayOffset: 0, hour: 17, minute: 0, duration: 15, title: "Nova: weekly digest", tone: "fuchsia", type: "ai" },
  { id: "e6", dayOffset: 1, hour: 10, minute: 0, duration: 45, title: "Payments v2 launch review", tone: "amber", type: "review", attendees: 8 },
  { id: "e7", dayOffset: 1, hour: 13, minute: 0, duration: 120, title: "Roadmap draft · Q3 themes", tone: "emerald", type: "focus" },
  { id: "e8", dayOffset: 2, hour: 9, minute: 30, duration: 60, title: "Eng all-hands", tone: "violet", type: "meeting", attendees: 22 },
  { id: "e9", dayOffset: 2, hour: 15, minute: 0, duration: 30, title: "Design sync", tone: "fuchsia", type: "meeting", attendees: 4 },
  { id: "e10", dayOffset: 3, hour: 11, minute: 0, duration: 45, title: "Customer call · Acme", tone: "amber", type: "meeting", attendees: 3 },
  { id: "e11", dayOffset: 4, hour: 14, minute: 0, duration: 60, title: "Architecture review", tone: "violet", type: "review", attendees: 5 },
];

export default function CalendarPage() {
  // Defer Date() to after mount so server (UTC) and client (local TZ)
  // hydration stay in sync. Stable placeholder date before mount.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const today = React.useMemo(
    () => (mounted ? new Date() : new Date(2026, 4, 25)),
    [mounted]
  );

  const [cursor, setCursor] = React.useState<Date>(today);
  React.useEffect(() => {
    if (mounted) setCursor(new Date());
  }, [mounted]);

  const [selectedOffset, setSelectedOffset] = React.useState(0);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthDays = useMonthGrid(monthStart);
  const monthLabel = cursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Map a calendar-cell day to a dayOffset from today, when in same month.
  const sameMonth =
    cursor.getMonth() === today.getMonth() &&
    cursor.getFullYear() === today.getFullYear();
  const todayDay = today.getDate();

  const selectedDate = React.useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + selectedOffset);
    return d;
  }, [today, selectedOffset]);

  const selectedDayEvents = React.useMemo(
    () => DEMO_EVENTS.filter((e) => e.dayOffset === selectedOffset),
    [selectedOffset]
  );

  return (
    <AppShell
      title="Calendar"
      description="Meetings, focus blocks, and AI digests on one timeline."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">
            Schedule
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            <span suppressHydrationWarning>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedDayEvents.length === 0
              ? "Nothing scheduled — perfect day for deep work."
              : `${selectedDayEvents.length} item${selectedDayEvents.length === 1 ? "" : "s"} · ${totalFocusMinutes(selectedDayEvents)} min of focused work`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <Plus className="size-3.5" />
            New event
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* ─── Month calendar ────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 suppressHydrationWarning className="font-display text-lg font-semibold">
                {monthLabel}
              </h2>
              <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                {DEMO_EVENTS.length} events
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                aria-label="Previous month"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
                className="grid h-8 w-8 place-items-center rounded-md border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={() => {
                  setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedOffset(0);
                }}
                className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                Today
              </button>
              <button
                aria-label="Next month"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
                className="grid h-8 w-8 place-items-center rounded-md border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* day-of-week */}
          <div className="grid grid-cols-7 gap-1 px-5 pt-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70"
              >
                {d}
              </div>
            ))}
          </div>

          {/* day grid */}
          {!mounted ? (
            <div className="px-5 py-4">
              <Skeleton className="h-[360px] w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 px-5 py-3">
              {monthDays.map(({ day, inMonth }, i) => {
                const isToday = inMonth && sameMonth && day === todayDay;
                const offsetFromToday =
                  inMonth && sameMonth ? day - todayDay : null;
                const dayEvents =
                  offsetFromToday !== null
                    ? DEMO_EVENTS.filter((e) => e.dayOffset === offsetFromToday)
                    : [];
                const isSelected =
                  inMonth &&
                  sameMonth &&
                  offsetFromToday === selectedOffset;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (offsetFromToday !== null) setSelectedOffset(offsetFromToday);
                    }}
                    disabled={offsetFromToday === null}
                    className={cn(
                      "group relative aspect-square rounded-lg p-1.5 text-left transition-all",
                      inMonth
                        ? "text-foreground/85 hover:bg-white/[0.04]"
                        : "text-muted-foreground/30",
                      isToday && !isSelected &&
                        "border border-violet-500/40 bg-gradient-to-br from-violet-500/15 to-cyan-500/10 text-foreground",
                      isSelected &&
                        "border border-violet-400/60 bg-nova-gradient/15 text-foreground shadow-[0_0_24px_-8px_rgba(94, 106, 210, 0.18)]"
                    )}
                  >
                    <div className="font-mono text-xs font-medium leading-none">
                      {day}
                      {isToday && (
                        <span className="ml-1 text-[8px] uppercase tracking-wider text-violet-300">
                          today
                        </span>
                      )}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="absolute inset-x-1.5 bottom-1.5 flex items-end gap-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className={cn(
                              "h-1 flex-1 rounded-full",
                              TONE_DOT[e.tone]
                            )}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="ml-0.5 font-mono text-[8px] text-muted-foreground">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* legend */}
          <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] px-5 py-3 text-[10px] text-muted-foreground">
            {(["violet", "cyan", "fuchsia", "emerald", "amber"] as EventTone[]).map(
              (t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", TONE_DOT[t])} />
                  {t === "violet"
                    ? "Meeting"
                    : t === "cyan"
                      ? "1:1"
                      : t === "fuchsia"
                        ? "AI"
                        : t === "emerald"
                          ? "Focus"
                          : "Review"}
                </span>
              )
            )}
          </div>
        </section>

        {/* ─── Day agenda ────────────────────────────────────────────── */}
        <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Agenda
              </p>
              <p
                suppressHydrationWarning
                className="mt-0.5 font-display text-base font-semibold"
              >
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-muted-foreground">
              {selectedDayEvents.length === 0
                ? "free"
                : `${totalFocusMinutes(selectedDayEvents)}m`}
            </div>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-10 text-center">
              <div className="mx-auto grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Coffee className="size-4" />
              </div>
              <p className="mt-3 text-sm font-medium">No meetings today</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Block some focus time before something else does.
              </p>
              <Button size="sm" variant="secondary" className="mt-4">
                <Plus className="size-3" />
                Block focus
              </Button>
            </div>
          ) : (
            <ol className="relative ml-2 space-y-3 border-l border-white/[0.06] pl-5">
              {[...selectedDayEvents]
                .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
                .map((e, i) => {
                  const Icon = TYPE_ICON[e.type];
                  return (
                    <motion.li
                      key={e.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative"
                    >
                      <span
                        className={cn(
                          "absolute -left-[26px] top-2 grid size-4 place-items-center rounded-full ring-4 ring-background",
                          TONE_DOT[e.tone]
                        )}
                      />
                      <div
                        className={cn(
                          "rounded-xl border px-3 py-2.5 transition-colors",
                          TONE_BG[e.tone]
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {e.title}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] opacity-80">
                              <Clock className="size-2.5" />
                              {formatTime(e.hour, e.minute)} · {e.duration}m
                              {e.attendees && (
                                <>
                                  <span className="opacity-50">·</span>
                                  {e.attendees} ppl
                                </>
                              )}
                            </p>
                          </div>
                          <div className="grid size-7 shrink-0 place-items-center rounded-md bg-white/[0.06]">
                            <Icon className="size-3" />
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
            </ol>
          )}

          <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="size-3.5 text-violet-300" />
              Nova suggestion
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your focus blocks are clustered in the afternoon. Consider moving
              the design sync to async so you can ship the payments retry logic
              tomorrow.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function useMonthGrid(cursor: Date) {
  return React.useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells: { day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: prevDays - firstWeekday + 1 + i, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, inMonth: true });
    }
    let trailing = 1;
    while (cells.length < 42) {
      cells.push({ day: trailing++, inMonth: false });
    }
    return cells;
  }, [cursor]);
}

function formatTime(h: number, m: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

function totalFocusMinutes(events: CalEvent[]): number {
  return events.reduce((sum, e) => sum + e.duration, 0);
}
