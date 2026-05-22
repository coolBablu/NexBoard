"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const data = [
  { month: "Jan", revenue: 24, forecast: null },
  { month: "Feb", revenue: 32, forecast: null },
  { month: "Mar", revenue: 28, forecast: null },
  { month: "Apr", revenue: 42, forecast: null },
  { month: "May", revenue: 56, forecast: null },
  { month: "Jun", revenue: 64, forecast: null },
  { month: "Jul", revenue: 72, forecast: null },
  { month: "Aug", revenue: 81, forecast: null },
  { month: "Sep", revenue: 94, forecast: 94 },
  { month: "Oct", revenue: null, forecast: 108 },
  { month: "Nov", revenue: null, forecast: 124 },
  { month: "Dec", revenue: null, forecast: 142 },
];

export function RevenueChart() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Revenue · 12 months</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Actuals through Sep · AI forecast Oct–Dec
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <span className="size-1.5 rounded-full bg-violet-400" />
            Actual
          </Badge>
          <Badge variant="outline">
            <span className="size-1.5 rounded-full bg-cyan-400" />
            Forecast
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}k`}
            />
            <Tooltip
              cursor={{ stroke: "rgba(139,92,246,0.4)", strokeWidth: 1 }}
              contentStyle={{
                background: "rgba(15,14,20,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                backdropFilter: "blur(12px)",
                fontSize: 12,
              }}
              formatter={(v: number) => [`$${v}k`, ""]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#A78BFA"
              strokeWidth={2.2}
              fill="url(#rev)"
              dot={false}
              isAnimationActive
              animationDuration={1100}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#22D3EE"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#fc)"
              dot={false}
              isAnimationActive
              animationDuration={1300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
