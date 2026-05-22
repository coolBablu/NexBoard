"use client";

import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const data = [
  {
    name: "Sprint",
    value: 78,
    fill: "url(#g1)",
  },
];

const goals = [
  { label: "Sprint health", value: 78, tone: "from-violet-500 to-fuchsia-500" },
  { label: "Customer NPS", value: 64, tone: "from-cyan-400 to-blue-500" },
  { label: "Release readiness", value: 92, tone: "from-emerald-400 to-cyan-500" },
];

export function TeamProgress() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Team progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto mb-6 h-44 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="78%"
              outerRadius="100%"
              barSize={14}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#D946EF" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                tick={false}
              />
              <RadialBar
                background={{ fill: "rgba(255,255,255,0.06)" }}
                dataKey="value"
                cornerRadius={20}
                isAnimationActive
                animationDuration={1400}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-semibold">78%</span>
            <span className="text-xs text-muted-foreground">Sprint health</span>
          </div>
        </div>

        <div className="space-y-4">
          {goals.map((g) => (
            <div key={g.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{g.label}</span>
                <span className="font-medium text-foreground/90">
                  {g.value}%
                </span>
              </div>
              <Progress value={g.value} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
