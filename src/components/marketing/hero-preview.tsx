"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Users,
  Activity,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Bar,
  BarChart,
} from "recharts";

const areaData = Array.from({ length: 24 }, (_, i) => ({
  t: i,
  v: 50 + Math.sin(i / 2.4) * 18 + (i * 1.2),
}));

const barData = Array.from({ length: 14 }, (_, i) => ({
  t: i,
  v: 24 + Math.sin(i / 1.5) * 12 + (i % 4) * 4,
}));

const tasks = [
  { label: "Ship payments redesign", done: true },
  { label: "Review Q3 OKRs with team", done: true },
  { label: "AI: draft Loom recap", done: false, ai: true },
  { label: "Sync with Engineering", done: false },
];

export function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-6xl">
      {/* Glow underneath */}
      <div className="absolute inset-x-10 -bottom-10 -z-10 h-40 rounded-full bg-violet-600/40 blur-[100px]" />
      <div className="absolute inset-x-1/3 -bottom-10 -z-10 h-40 rounded-full bg-cyan-500/40 blur-[100px]" />

      <div className="border-gradient rounded-[28px] p-1.5">
        <div className="glass-strong overflow-hidden rounded-[22px]">
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              novaflow.app/dashboard
            </div>
            <div className="text-xs text-muted-foreground">v 2.0.1</div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-12 gap-4 p-4 sm:p-6">
            {/* Side nav */}
            <div className="col-span-12 hidden lg:col-span-2 lg:block">
              <div className="space-y-1.5">
                {[
                  "Dashboard",
                  "Workspace",
                  "Projects",
                  "Analytics",
                  "Assistant",
                ].map((l, i) => (
                  <div
                    key={l}
                    className={
                      "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs " +
                      (i === 0
                        ? "nav-active text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.04]")
                    }
                  >
                    <span className="size-1.5 rounded-full bg-white/40" />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Main area */}
            <div className="col-span-12 space-y-4 lg:col-span-7">
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "ARR",
                    value: "$2.84M",
                    trend: "+18.2%",
                    icon: TrendingUp,
                    color: "from-violet-500/30",
                  },
                  {
                    label: "Active users",
                    value: "12,481",
                    trend: "+6.4%",
                    icon: Users,
                    color: "from-cyan-500/30",
                  },
                  {
                    label: "Activity",
                    value: "98.7%",
                    trend: "+0.4%",
                    icon: Activity,
                    color: "from-fuchsia-500/30",
                  },
                ].map(({ label, value, trend, icon: Icon, color }) => (
                  <div
                    key={label}
                    className={
                      "relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br p-3 " +
                      color +
                      " to-transparent"
                    }
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                      {label}
                      <Icon className="size-3" />
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {value}
                    </div>
                    <div className="text-[10px] text-emerald-300">{trend}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-foreground/80">
                    Revenue · Last 24 weeks
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    AI forecast
                  </div>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData}>
                      <defs>
                        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#A78BFA"
                        strokeWidth={2}
                        fill="url(#hg)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="-mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-1 rounded-full bg-white/[0.06]" />
                  ))}
                </div>
              </div>

              {/* Mini bar */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground/80">
                    Cycle time
                  </span>
                  <span className="text-emerald-300">−1.2d</span>
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <Bar
                        dataKey="v"
                        radius={[4, 4, 0, 0]}
                        fill="#22D3EE"
                        fillOpacity={0.7}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* AI panel */}
            <div className="col-span-12 space-y-3 lg:col-span-3">
              <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-violet-500/10 to-transparent p-4">
                <div className="aurora absolute -inset-6 -z-10 opacity-50" />
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/90">
                  <Sparkles className="size-3.5 text-violet-300" />
                  Nova Assistant
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Your sprint is{" "}
                  <span className="text-foreground">on track</span>. 3 tasks
                  unblocked since this morning.
                </p>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "78%" }}
                  transition={{ delay: 1.2, duration: 1.2, ease: "easeOut" }}
                  className="mt-3 h-1 rounded-full bg-nova-gradient"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Sprint health</span>
                  <span>78%</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="mb-3 text-xs font-medium text-foreground/80">
                  Today
                </div>
                <ul className="space-y-2">
                  {tasks.map((t, i) => (
                    <motion.li
                      key={t.label}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 + i * 0.1 }}
                      className="flex items-start gap-2 text-xs"
                    >
                      {t.done ? (
                        <CheckCircle2 className="mt-0.5 size-3.5 text-emerald-400" />
                      ) : (
                        <Circle className="mt-0.5 size-3.5 text-muted-foreground" />
                      )}
                      <span
                        className={
                          t.done
                            ? "text-muted-foreground line-through"
                            : "text-foreground/85"
                        }
                      >
                        {t.label}
                      </span>
                      {t.ai && (
                        <span className="ml-auto rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[9px] text-violet-200">
                          AI
                        </span>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
