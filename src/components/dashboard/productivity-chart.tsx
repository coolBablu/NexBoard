"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="prShipped" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prAi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D946EF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#D946EF" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeOpacity={0.4}
              strokeDasharray="3 6"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={Math.ceil(data.length / 8)}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={28}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<ChartTooltip />} />

            <Area
              type="monotone"
              dataKey="ai"
              stroke="#D946EF"
              strokeWidth={1.5}
              fill="url(#prAi)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="focus"
              stroke="#22D3EE"
              strokeWidth={1.5}
              fill="url(#prFocus)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="shipped"
              stroke="#A78BFA"
              strokeWidth={2}
              fill="url(#prShipped)"
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
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

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const labels: Record<string, string> = {
    shipped: "Shipped",
    focus: "Focus h",
    ai: "AI assist",
  };
  return (
    <div className="rounded-lg border border-white/10 bg-background/95 px-2.5 py-2 backdrop-blur-xl shadow-lg">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-3 text-[11px]"
        >
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full"
              style={{ background: p.color }}
            />
            {labels[p.dataKey] ?? p.dataKey}
          </span>
          <span className="font-mono text-foreground">
            {Math.round(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
