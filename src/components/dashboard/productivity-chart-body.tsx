"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Datum {
  t: number;
  label: string;
  shipped: number;
  focus: number;
  ai: number;
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

export default function ProductivityChartBody({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="prShipped" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5E6AD2" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#5E6AD2" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="prFocus" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="prAi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
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
          stroke="#4F46E5"
          strokeWidth={1.5}
          fill="url(#prAi)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="focus"
          stroke="#0EA5E9"
          strokeWidth={1.5}
          fill="url(#prFocus)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="shipped"
          stroke="#818CF8"
          strokeWidth={2}
          fill="url(#prShipped)"
          stackId="1"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
