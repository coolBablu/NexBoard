"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  GitMerge,
  ArrowUpRight,
} from "lucide-react";

interface Insight {
  id: string;
  icon: React.ElementType;
  tone: "violet" | "amber" | "emerald" | "cyan";
  tag: string;
  title: string;
  body: React.ReactNode;
  cta: string;
  confidence: number;
}

const insights: Insight[] = [
  {
    id: "i1",
    icon: AlertTriangle,
    tone: "amber",
    tag: "Risk",
    title: "Payments v2 lacks retry tests",
    body: (
      <>
        Webhook retry tests are missing for the new{" "}
        <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[10px]">
          payment_failed
        </code>{" "}
        event. Recommended owner: Daniel.
      </>
    ),
    cta: "Open task",
    confidence: 92,
  },
  {
    id: "i2",
    icon: TrendingUp,
    tone: "emerald",
    tag: "Opportunity",
    title: "Trial-to-paid conversion +4.2% projected",
    body: (
      <>
        Removing the verification step from the paywall is forecast to lift
        trial conversion by <strong>4.2%</strong> with ~83% confidence.
      </>
    ),
    cta: "View experiment",
    confidence: 83,
  },
  {
    id: "i3",
    icon: GitMerge,
    tone: "violet",
    tag: "Decision",
    title: "Gate Stripe Tax behind a flag (48h)",
    body: (
      <>
        Three peer products rolled out Tax behind a flag for the first 48
        hours. Nova recommends doing the same — risk: low, reversibility: easy.
      </>
    ),
    cta: "Open RFC",
    confidence: 76,
  },
];

const toneMap = {
  violet: {
    bg: "from-violet-500/12 to-violet-500/0",
    chip: "border-violet-500/30 bg-violet-500/12 text-violet-200",
    iconBg: "bg-violet-500/15 text-violet-200 border-violet-400/25",
    glow: "rgba(94, 106, 210, 0.09)",
  },
  amber: {
    bg: "from-amber-500/12 to-amber-500/0",
    chip: "border-amber-500/30 bg-amber-500/12 text-amber-200",
    iconBg: "bg-amber-500/15 text-amber-200 border-amber-400/25",
    glow: "rgba(251,191,36,0.3)",
  },
  emerald: {
    bg: "from-emerald-500/12 to-emerald-500/0",
    chip: "border-emerald-500/30 bg-emerald-500/12 text-emerald-200",
    iconBg: "bg-emerald-500/15 text-emerald-200 border-emerald-400/25",
    glow: "rgba(52,211,153,0.3)",
  },
  cyan: {
    bg: "from-cyan-500/12 to-cyan-500/0",
    chip: "border-cyan-500/30 bg-cyan-500/12 text-cyan-200",
    iconBg: "bg-cyan-500/15 text-cyan-200 border-cyan-400/25",
    glow: "rgba(14, 165, 233,0.3)",
  },
} as const;

export function AIInsightsPanel() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
      {/* aurora wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
      >
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      {/* header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-nova-gradient shadow-glow">
            <Sparkles className="size-4 text-white" />
            <span className="absolute -inset-1 -z-10 rounded-xl bg-nova-gradient opacity-50 blur-md" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              Nova Insights
              <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet-200">
                Live
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Synthesized from 18 docs, 47 tasks, 6 dashboards
            </div>
          </div>
        </div>
        <button className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
          Refresh
        </button>
      </div>

      <div className="flex-1 space-y-3 p-4 sm:p-5">
        {insights.map((ins, i) => {
          const t = toneMap[ins.tone];
          const Icon = ins.icon;
          return (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={`group/ins relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br ${t.bg} p-3.5`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${t.iconBg}`}
                  style={{
                    boxShadow: `0 8px 24px -10px ${t.glow}`,
                  }}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${t.chip}`}
                    >
                      {ins.tag}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      conf {ins.confidence}%
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-foreground/95">
                    {ins.title}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {ins.body}
                  </div>
                  <button className="mt-2.5 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-foreground/90 transition-colors hover:bg-white/[0.08]">
                    {ins.cta}
                    <ArrowUpRight className="size-2.5" />
                  </button>
                </div>
              </div>

              {/* confidence bar */}
              <div className="mt-3 h-px overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${ins.confidence}%` }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.2 + i * 0.08,
                    duration: 1,
                    ease: "easeOut",
                  }}
                  className="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
