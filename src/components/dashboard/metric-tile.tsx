"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { SparkSkeleton } from "@/components/charts/chart-skeleton";
import { cn } from "@/lib/utils";

// Defer Recharts (and its ~85 kB gzipped baseline) until after the tile
// is on screen. Falls back to a soft gradient placeholder so the layout
// is stable on first paint.
const MetricSpark = dynamic(() => import("./metric-spark"), {
  ssr: false,
  loading: () => <SparkSkeleton />,
});

interface MetricTileProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta: number;
  icon: LucideIcon;
  accent?: "violet" | "cyan" | "fuchsia" | "emerald" | "amber";
  formatter?: (n: number) => string;
  spark?: number[];
  unit?: string;
}

const accentMap = {
  violet: { stroke: "#A78BFA", glow: "139, 92, 246" },
  cyan: { stroke: "#22D3EE", glow: "34, 211, 238" },
  fuchsia: { stroke: "#E879F9", glow: "217, 70, 239" },
  emerald: { stroke: "#34D399", glow: "52, 211, 153" },
  amber: { stroke: "#FBBF24", glow: "251, 191, 36" },
} as const;

/**
 * Vercel-meets-Linear analytics tile:
 *  · Mono number with animated counter
 *  · Sparkline area chart that fills on view
 *  · Delta badge with directional arrow
 *  · Mouse-tracked accent glow
 */
export function MetricTile({
  label,
  value,
  prefix,
  suffix,
  delta,
  icon: Icon,
  accent = "violet",
  formatter = (n) => Math.round(n).toLocaleString(),
  spark,
  unit,
}: MetricTileProps) {
  const a = accentMap[accent];
  const positive = delta >= 0;
  const data = React.useMemo(
    () => (spark ?? defaultSpark()).map((v, t) => ({ t, v })),
    [spark]
  );
  const id = React.useId().replace(/:/g, "");

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative isolate flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 12px 40px -16px rgba(0,0,0,0.6)",
      }}
    >
      {/* Soft top-left glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, rgba(${a.glow}, 0.35), transparent 70%)` }}
      />

      <div className="flex items-start justify-between p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Icon className="size-3" />
            {label}
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-semibold tracking-tight text-foreground">
              {prefix}
              <Counter value={value} formatter={formatter} />
              {suffix}
            </span>
            {unit && (
              <span className="text-xs text-muted-foreground">{unit}</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium",
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
              {Math.abs(delta).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="relative mt-auto h-14">
        <MetricSpark data={data} stroke={a.stroke} gradientId={`mg-${id}`} />
        {/* Hairline bottom accent on hover */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px scale-x-0 origin-left transition-transform duration-700 group-hover:scale-x-100"
          style={{
            background: `linear-gradient(90deg, transparent, ${a.stroke}, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}

function defaultSpark() {
  return Array.from({ length: 20 }, (_, i) => 30 + Math.sin(i / 2) * 15 + i);
}

function Counter({
  value,
  formatter,
}: {
  value: number;
  formatter: (n: number) => string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18, mass: 0.4 });
  const [display, setDisplay] = React.useState(formatter(0));

  React.useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);
  React.useEffect(() => spring.on("change", (v) => setDisplay(formatter(v))), [
    spring,
    formatter,
  ]);

  return <span ref={ref}>{display}</span>;
}
