"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles } from "lucide-react";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import { cn } from "@/lib/utils";

const ProductivityChartBody = dynamic(
  () => import("./productivity-chart-body"),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
);

const RANGES = ["7D", "30D", "90D", "1Y"] as const;
type Range = (typeof RANGES)[number];

function buildSeries(range: Range) {
  const points = range === "7D" ? 14 : range === "30D" ? 30 : range === "90D" ? 60 : 90;
  return Array.from({ length: points }, (_, i) => ({
    t: i,
    label:
      range === "7D"
        ? `D${Math.floor(i / 2) + 1}`
        : range === "30D"
          ? `${i + 1}`
          : range === "90D"
            ? `W${Math.floor(i / 2) + 1}`
            : `M${Math.floor(i / 8) + 1}`,
    shipped:
      18 +
      Math.sin(i / 2.2) * 9 +
      i * 0.5 +
      (range === "1Y" ? Math.cos(i / 5) * 5 : 0),
    focus: 14 + Math.cos(i / 2.6) * 7 + i * 0.35,
    ai: 6 + Math.sin(i / 3.2) * 3 + i * 0.18,
  }));
}

export function ProductivityChart() {
  const [range, setRange] = React.useState<Range>("30D");
  const data = React.useMemo(() => buildSeries(range), [range]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <TrendingUp className="size-3" />
            Team productivity
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-foreground">
              642
            </span>
            <span className="text-xs text-muted-foreground">
              units shipped · {range}
            </span>
            <span className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300">
              +18.2%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Legend />
          <RangeTabs range={range} setRange={setRange} />
        </div>
      </div>

      {/* chart */}
      <div className="relative h-[280px] p-2 sm:p-4">
        <ProductivityChartBody data={data} />
      </div>

      {/* AI insight strip */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 border-t border-white/[0.06] bg-gradient-to-r from-violet-500/5 to-cyan-500/5 px-4 py-2.5 text-xs sm:px-5"
      >
        <div className="grid h-6 w-6 place-items-center rounded-md bg-violet-500/15 text-violet-300">
          <Sparkles className="size-3" />
        </div>
        <span className="text-muted-foreground">
          Nova:{" "}
          <span className="text-foreground">
            Focus hours are{" "}
            <span className="font-medium text-cyan-300">+22%</span> this
            week — your team is in flow.
          </span>
        </span>
      </motion.div>
    </div>
  );
}

function Legend() {
  const items = [
    { c: "#A78BFA", l: "Shipped" },
    { c: "#22D3EE", l: "Focus" },
    { c: "#D946EF", l: "AI assist" },
  ];
  return (
    <div className="hidden items-center gap-3 sm:flex">
      {items.map((i) => (
        <div key={i.l} className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-3 rounded-full"
            style={{ background: i.c }}
          />
          <span className="text-[10px] font-medium text-muted-foreground">
            {i.l}
          </span>
        </div>
      ))}
    </div>
  );
}

function RangeTabs({
  range,
  setRange,
}: {
  range: Range;
  setRange: (r: Range) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={cn(
            "relative rounded-md px-2 py-1 font-mono text-[10px] font-medium transition-colors",
            r === range
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r === range && (
            <motion.span
              layoutId="range-pill"
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="absolute inset-0 rounded-md bg-white/[0.06]"
            />
          )}
          <span className="relative">{r}</span>
        </button>
      ))}
    </div>
  );
}

