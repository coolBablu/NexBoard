"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [
  { name: "Organic", value: 38, color: "#5E6AD2" },
  { name: "Referral", value: 24, color: "#0EA5E9" },
  { name: "Social", value: 18, color: "#4F46E5" },
  { name: "Direct", value: 12, color: "#34D399" },
  { name: "Paid", value: 8, color: "#F59E0B" },
];

export function SourceDonut() {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "rgba(15,14,20,0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v}%`, ""]}
            />
            <Pie
              data={data}
              dataKey="value"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
              isAnimationActive
              animationDuration={1100}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold">{total}%</span>
          <span className="text-xs text-muted-foreground">Total mix</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-3">
            <span
              className="size-2.5 rounded-full"
              style={{ background: d.color }}
            />
            <span className="text-sm text-foreground/85">{d.name}</span>
            <span className="ml-auto text-sm font-medium">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
