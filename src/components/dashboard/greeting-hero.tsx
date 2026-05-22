"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Activity,
  Zap,
  GitBranch,
  Command,
} from "lucide-react";

/**
 * Greeting hero — Vercel-meets-Linear top strip with a personalized
 * salutation, deploy-status pill, and a row of mono quick-stats.
 */
export function GreetingHero({ onOpenPalette }: { onOpenPalette?: () => void }) {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const greeting = useGreeting();

  return (
    <section className="relative">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems · Production
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting}, <span className="text-gradient-nova">{firstName}</span>.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's moved while you were away — and what needs you next.
          </p>
        </div>

        {/* Action chip + palette trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenPalette}
            className="group inline-flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground transition-all hover:border-white/15 hover:bg-white/[0.05] hover:text-foreground"
          >
            <Command className="size-3.5" />
            <span>Search or jump to…</span>
            <kbd className="ml-2 inline-flex h-5 items-center gap-0.5 rounded border border-white/10 bg-white/[0.04] px-1 font-mono text-[10px] text-muted-foreground/80">
              ⌘ K
            </kbd>
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground hover:border-white/15 hover:text-foreground">
            <Zap className="size-3.5 text-amber-300" />
            Focus mode
            <kbd className="ml-1 hidden font-mono text-[10px] text-muted-foreground/80 sm:inline">
              F
            </kbd>
          </button>
        </div>
      </div>

      {/* Quick mono stat strip */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 backdrop-blur sm:grid-cols-4">
        <QuickStat
          icon={Activity}
          label="Sprint health"
          value="78"
          unit="%"
          tone="emerald"
        />
        <QuickStat
          icon={GitBranch}
          label="PRs in review"
          value="12"
          tone="violet"
        />
        <QuickStat
          icon={Sparkles}
          label="Nova runs · today"
          value="184"
          tone="cyan"
        />
        <QuickStat
          icon={Zap}
          label="Cycle time"
          value="2.4"
          unit="d"
          tone="fuchsia"
        />
      </div>
    </section>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  tone: "emerald" | "violet" | "cyan" | "fuchsia";
}) {
  const toneClass = {
    emerald: "text-emerald-300",
    violet: "text-violet-300",
    cyan: "text-cyan-300",
    fuchsia: "text-fuchsia-300",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 rounded-xl px-3 py-2"
    >
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04] ${toneClass}`}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="font-mono text-base font-semibold text-foreground">
          {value}
          {unit && (
            <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function useGreeting() {
  const [g, setG] = React.useState("Good morning");
  React.useEffect(() => {
    const h = new Date().getHours();
    setG(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);
  return g;
}
