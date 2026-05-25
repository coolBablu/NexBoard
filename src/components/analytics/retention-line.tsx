"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  cohortA: Math.round(100 - i * 5.2 - Math.sin(i / 2) * 4),
  cohortB: Math.round(100 - i * 4.4 + Math.cos(i / 2) * 3),
  cohortC: Math.round(100 - i * 3.6),
}));

export function RetentionLine() {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,14,20,0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              backdropFilter: "blur(12px)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="cohortA"
            stroke="#818CF8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={1300}
          />
          <Line
            type="monotone"
            dataKey="cohortB"
            stroke="#38BDF8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={1500}
          />
          <Line
            type="monotone"
            dataKey="cohortC"
            stroke="#A5B4FC"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={1700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
