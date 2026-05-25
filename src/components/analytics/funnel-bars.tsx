"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { stage: "Visited", value: 24800 },
  { stage: "Sign up", value: 9120 },
  { stage: "Activated", value: 6210 },
  { stage: "Invited team", value: 4480 },
  { stage: "Subscribed", value: 1980 },
  { stage: "Retained 30d", value: 1620 },
];

export function FunnelBars() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity={1} />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="stage"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "rgba(15,14,20,0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              backdropFilter: "blur(12px)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            fill="url(#bGrad)"
            isAnimationActive
            animationDuration={1300}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
