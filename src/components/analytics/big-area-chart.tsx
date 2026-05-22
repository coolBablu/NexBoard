"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  return {
    day: `D${day}`,
    sessions: Math.round(1200 + Math.sin(i / 2.4) * 320 + i * 18),
    signups: Math.round(180 + Math.cos(i / 2.7) * 60 + i * 5),
    activations: Math.round(110 + Math.sin(i / 3.1) * 45 + i * 3.5),
  };
});

export function BigAreaChart() {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
        >
          <defs>
            <linearGradient id="aSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="aSignups" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="aActiv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D946EF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#D946EF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ stroke: "rgba(139,92,246,0.4)", strokeWidth: 1 }}
            contentStyle={{
              background: "rgba(15,14,20,0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              backdropFilter: "blur(12px)",
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="#A78BFA"
            fill="url(#aSessions)"
            strokeWidth={2}
            isAnimationActive
            animationDuration={1100}
          />
          <Area
            type="monotone"
            dataKey="signups"
            stroke="#67E8F9"
            fill="url(#aSignups)"
            strokeWidth={2}
            isAnimationActive
            animationDuration={1300}
          />
          <Area
            type="monotone"
            dataKey="activations"
            stroke="#F0ABFC"
            fill="url(#aActiv)"
            strokeWidth={2}
            isAnimationActive
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
