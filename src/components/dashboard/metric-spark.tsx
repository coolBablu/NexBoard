"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MetricSparkProps {
  data: { t: number; v: number }[];
  stroke: string;
  gradientId: string;
}

/**
 * Sparkline-only subtree, isolated so that the tile (which renders a
 * dozen of these on the dashboard) can dynamic-import Recharts on
 * demand instead of bundling it into the initial paint.
 */
export default function MetricSpark({ data, stroke, gradientId }: MetricSparkProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={stroke}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive
          animationDuration={1100}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
