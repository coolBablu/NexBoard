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
} from "lucide-react";
import { cn } from "@/lib/utils";

type EventTone = "violet" | "cyan" | "fuchsia" | "emerald" | "amber";

interface Event {
  day: number;
  title: string;
  time: string;
  tone: EventTone;
  type?: "meeting" | "review" | "focus" | "ai";
}

const TONE_DOT: Record<EventTone, string> = {
  violet: "bg-violet-400",
  cyan: "bg-cyan-400",
  fuchsia: "bg-fuchsia-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
};

const TONE_LEFT: Record<EventTone, string> = {
  violet: "border-l-violet-400",
  cyan: "border-l-cyan-400",
  fuchsia: "border-l-fuchsia-400",
  emerald: "border-l-emerald-400",
  amber: "border-l-amber-400",
};

export function CalendarWidget() {
  const today = new Date();
  const [cursor, setCursor] = React.useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const todayDay = today.getDate();
  const sameMonth =
    cursor.getMonth() === today.getMonth() &&
    cursor.getFullYear() === today.getFullYear();

  // Hand-curated demo events relative to today, anchored in current month.
  const events: Event[] = React.useMemo(() => {
    const d = today.getDate();
    return [
      {
        day: d,
        title: "Sprint review",
        time: "11:00 AM",
        tone: "violet",
        type: "meeting",
      },
      {
        day: d,
        title: "Maya 1:1",
        time: "2:30 PM",
        tone: "cyan",
        type: "meeting",
      },
      {
        day: d,
        title: "Nova: weekly digest",
        time: "5:00 PM",
        tone: "fuchsia",
        type: "ai",
      },
      {
        day: d + 1,
        title: "Payments v2 launch review",
        time: "10:00 AM",
        tone: "amber",
        type: "review",
      },
      {
        day: d + 1,
        title: "Deep work · roadmap draft",
        time: "1:00 PM",
        tone: "emerald",
        type: "focus",
      },
      {
        day: d + 2,
        title: "Eng all-hands",
        time: "9:30 AM",
        tone: "violet",
        type: "meeting",
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.getDate()]);

  const days = useMonthGrid(cursor);
  const eventsByDay = React.useMemo(() => {
    const m: Record<number, Event[]> = {};
    for (const e of events) {
      (m[e.day] = m[e.day] || []).push(e);
    }
    return m;
  }, [events]);

  const upcoming = events.slice(0, 4);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <CalendarIcon className="size-3" />
            Schedule
          </div>
          <h3 className="mt-1 font-display text-base font-semibold">
            {cursor.toLocaleString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous month"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
          >
            Today
          </button>
          <button
            aria-label="Next month"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* day-of-week */}
      <div className="grid grid-cols-7 gap-1 px-4 pt-3 sm:px-5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70"
          >
            {d}
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7 gap-1 px-4 py-2 sm:px-5">
        {days.map(({ day, inMonth }, i) => {
          const isToday = inMonth && sameMonth && day === todayDay;
          const dayEvents = inMonth ? eventsByDay[day] : undefined;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.005 }}
              className={cn(
                "relative aspect-square rounded-lg p-1 text-center transition-colors",
                inMonth
                  ? "text-foreground/80 hover:bg-white/[0.04]"
                  : "text-muted-foreground/30",
                isToday &&
                  "border border-violet-500/40 bg-gradient-to-br from-violet-500/15 to-cyan-500/10 text-foreground shadow-[0_0_24px_-8px_rgba(139,92,246,0.6)]"
              )}
            >
              <div className="text-[11px] font-medium leading-none pt-0.5 font-mono">
                {day}
              </div>
              {dayEvents && (
                <div className="mt-1 flex justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <span
                      key={j}
                      className={cn("size-1 rounded-full", TONE_DOT[e.tone])}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* upcoming */}
      <div className="border-t border-white/[0.06] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span>Upcoming</span>
          <span className="font-mono">{events.length} total</span>
        </div>
        <ul className="space-y-1.5">
          {upcoming.map((e, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border-l-2 bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]",
                TONE_LEFT[e.tone]
              )}
            >
              <EventTypeIcon type={e.type} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-foreground/95">
                  {e.title}
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <Clock className="size-2.5" />
                  {e.time}
                  <span className="text-foreground/30">·</span>
                  <span>{e.day === todayDay ? "Today" : `In ${e.day - todayDay}d`}</span>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
        <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground">
          Open full calendar
        </button>
      </div>
    </div>
  );
}

function EventTypeIcon({ type }: { type?: Event["type"] }) {
  const map = {
    meeting: { Icon: Video, color: "text-violet-300 bg-violet-500/12" },
    review: { Icon: CalendarIcon, color: "text-amber-300 bg-amber-500/12" },
    focus: { Icon: Clock, color: "text-emerald-300 bg-emerald-500/12" },
    ai: { Icon: Sparkles, color: "text-fuchsia-300 bg-fuchsia-500/12" },
  } as const;
  const { Icon, color } = map[type ?? "meeting"];
  return (
    <div
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-md",
        color
      )}
    >
      <Icon className="size-3" />
    </div>
  );
}

function useMonthGrid(cursor: Date) {
  return React.useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay(); // 0..6 (Sun..Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells: { day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: prevDays - firstWeekday + 1 + i, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, inMonth: true });
    }
    // pad to 6 rows × 7 cols = 42
    let trailing = 1;
    while (cells.length < 42) {
      cells.push({ day: trailing++, inMonth: false });
    }
    return cells;
  }, [cursor]);
}
