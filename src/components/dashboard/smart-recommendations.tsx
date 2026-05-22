"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Wand2,
  Zap,
  Users,
  ArrowRight,
  Plus,
  Layers,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  icon: React.ElementType;
  category: "automation" | "team" | "schedule" | "workflow";
  title: string;
  desc: string;
  effort: "1 min" | "2 min" | "5 min" | "15 min";
  impact: "high" | "med" | "low";
  cta: string;
}

const recs: Recommendation[] = [
  {
    id: "r1",
    icon: Wand2,
    category: "automation",
    title: "Auto-summarize PR descriptions",
    desc: "Nova writes 1-paragraph TL;DRs for every PR in #engineering.",
    effort: "2 min",
    impact: "high",
    cta: "Set up",
  },
  {
    id: "r2",
    icon: Users,
    category: "team",
    title: "Add Maya to Payments v2 reviewers",
    desc: "She owns the design and is unblocked from Friday.",
    effort: "1 min",
    impact: "med",
    cta: "Add",
  },
  {
    id: "r3",
    icon: Calendar,
    category: "schedule",
    title: "Reclaim Thursday afternoons for focus",
    desc: "Nova will reschedule 3 recurring syncs that have low attendance.",
    effort: "5 min",
    impact: "high",
    cta: "Review",
  },
  {
    id: "r4",
    icon: Layers,
    category: "workflow",
    title: "Group 12 stale tasks into one milestone",
    desc: "Tasks untouched > 21d. Auto-archive or roll into Q4 backlog.",
    effort: "5 min",
    impact: "med",
    cta: "Plan",
  },
];

const categoryStyles = {
  automation: { tone: "text-violet-300", bg: "bg-violet-500/12" },
  team: { tone: "text-cyan-300", bg: "bg-cyan-500/12" },
  schedule: { tone: "text-fuchsia-300", bg: "bg-fuchsia-500/12" },
  workflow: { tone: "text-amber-300", bg: "bg-amber-500/12" },
} as const;

const impactStyles = {
  high: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  med: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  low: "bg-muted text-muted-foreground border-white/10",
} as const;

export function SmartRecommendations() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Zap className="size-3 text-amber-300" />
            Smart recommendations
          </div>
          <h3 className="mt-1 text-sm font-semibold">
            Tiny wins to ship faster
          </h3>
        </div>
        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground">
          <RefreshCw className="size-3" />
        </button>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {recs.map((r, i) => {
          const c = categoryStyles[r.category];
          const Icon = r.icon;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group/rec relative flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-5"
            >
              <div
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                  c.bg,
                  c.tone
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium leading-tight text-foreground/95">
                    {r.title}
                  </h4>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
                      impactStyles[r.impact]
                    )}
                  >
                    {r.impact}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {r.desc}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    ⏱ {r.effort}
                  </span>
                  <button className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 transition-all group-hover/rec:text-foreground">
                    {r.cta}
                    <ArrowRight className="size-2.5 transition-transform group-hover/rec:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground">
          <Plus className="size-3" />
          Ask Nova for more
        </button>
      </div>
    </div>
  );
}
