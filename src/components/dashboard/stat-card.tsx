"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta: number;
  icon: LucideIcon;
  accent?: "violet" | "cyan" | "fuchsia" | "emerald";
  formatter?: (n: number) => string;
}

// Light theme: keep the background almost neutral white — accent comes
// only from the icon chip. This gives the "Linear / Vercel" official feel
// instead of the candy-pastel look that strong tinted gradients produce
// on a white background. Dark mode still gets the saturated washes
// via `:where(.dark) &` overrides below.
const accents = {
  violet: {
    bg: "from-indigo-500/[0.06]",
    icon: "bg-indigo-50 text-indigo-600 border-indigo-100",
    glow: "violet" as const,
  },
  cyan: {
    bg: "from-sky-500/[0.06]",
    icon: "bg-sky-50 text-sky-600 border-sky-100",
    glow: "cyan" as const,
  },
  fuchsia: {
    bg: "from-indigo-600/[0.06]",
    icon: "bg-indigo-50 text-indigo-700 border-indigo-100",
    glow: "fuchsia" as const,
  },
  emerald: {
    bg: "from-emerald-500/[0.06]",
    icon: "bg-emerald-50 text-emerald-600 border-emerald-100",
    glow: "none" as const,
  },
};

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  delta,
  icon: Icon,
  accent = "violet",
  formatter = (n) => Math.round(n).toLocaleString(),
}: StatCardProps) {
  const a = accents[accent];
  const positive = delta >= 0;

  return (
    <GlassCard
      glow={a.glow}
      className={cn(
        "overflow-hidden bg-gradient-to-br to-transparent",
        a.bg
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-semibold tracking-tight">
                {prefix}
                <Counter value={value} formatter={formatter} />
                {suffix}
              </span>
            </div>
          </div>
          <div
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl border",
              a.icon
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              positive
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-rose-500/10 text-rose-300"
            )}
          >
            {positive ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )}
            {Math.abs(delta)}%
          </div>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
      </div>
    </GlassCard>
  );
}

function Counter({
  value,
  formatter,
}: {
  value: number;
  formatter: (n: number) => string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18, mass: 0.4 });
  const [display, setDisplay] = React.useState("0");

  React.useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  React.useEffect(() => {
    return spring.on("change", (v) => setDisplay(formatter(v)));
  }, [spring, formatter]);

  return <span ref={ref}>{display}</span>;
}
