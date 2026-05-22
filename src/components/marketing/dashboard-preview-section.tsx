"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  TrendingUp,
  Users,
  Activity,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Bar,
  BarChart,
  Line,
  LineChart,
} from "recharts";
import { Reveal } from "@/components/effects/reveal";
import { Badge } from "@/components/ui/badge";

/**
 * Scroll-driven animated dashboard preview.
 * Pins behind a sticky window while the user scrolls past — chart
 * morphs, KPIs roll in, AI panel reveals last.
 */
export function DashboardPreviewSection() {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.35, 1], [18, 0, -8]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.92, 1, 0.96]);
  const glow = useTransform(scrollYProgress, [0, 0.5], [0.3, 0.7]);

  return (
    <section
      id="dashboard"
      ref={wrapRef}
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mx-auto gap-2 border-white/10 bg-white/[0.03]"
            >
              <Activity className="size-3 text-cyan-300" />
              <span className="text-xs">Dashboard · AI insights live</span>
            </Badge>
            <h2 className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Numbers that{" "}
              <span className="text-gradient-nova">tell a story</span>.
            </h2>
            <p className="mt-5 text-balance text-muted-foreground">
              Real-time KPIs, anomaly detection, AI forecasts — composed in a
              dashboard you'll actually want to open every morning.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-20 [perspective:1800px]">
          {/* Bottom glow that grows on scroll */}
          <motion.div
            aria-hidden
            style={{ opacity: reduce ? 0.5 : glow }}
            className="pointer-events-none absolute inset-x-10 -bottom-20 -z-10 h-72"
          >
            <div className="absolute inset-x-0 top-0 h-full rounded-full bg-violet-600/40 blur-[120px]" />
            <div className="absolute inset-x-1/3 top-0 h-full rounded-full bg-cyan-500/30 blur-[120px]" />
            <div className="absolute inset-x-2/3 top-0 h-full rounded-full bg-fuchsia-500/30 blur-[120px]" />
          </motion.div>

          {/* Floating side cards */}
          <FloatingSideCards />

          <motion.div
            style={
              reduce
                ? undefined
                : { rotateX, scale, transformStyle: "preserve-3d" }
            }
            className="mx-auto max-w-6xl"
          >
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
                    novaflow.app / dashboard
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    v 2.0.1
                  </div>
                </div>

                <DashboardBody />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Dashboard body ─────────────────────────── */

const area = Array.from({ length: 32 }, (_, i) => ({
  t: i,
  v: 40 + Math.sin(i / 2.6) * 14 + i * 1.1,
  f: 38 + Math.sin(i / 2.6 + 0.6) * 12 + i * 0.85,
}));
const bars = Array.from({ length: 14 }, (_, i) => ({
  t: i,
  v: 16 + ((i * 11) % 22) + Math.sin(i) * 4,
}));
const sparks = Array.from({ length: 18 }, (_, i) => ({
  t: i,
  v: 8 + Math.sin(i / 1.8) * 5 + (i % 3) * 1.5,
}));

const kpis = [
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
];

const tasks = [
  { label: "Ship payments redesign", done: true },
  { label: "Review Q3 OKRs with team", done: true },
  { label: "AI: draft Loom recap", done: false, ai: true },
  { label: "Sync with Engineering", done: false },
];

function DashboardBody() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 sm:p-6">
      {/* Sidebar */}
      <div className="col-span-12 hidden lg:col-span-2 lg:block">
        <div className="space-y-1">
          {[
            "Dashboard",
            "Workspace",
            "Projects",
            "Analytics",
            "Assistant",
            "Settings",
          ].map((l, i) => (
            <motion.div
              key={l}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs " +
                (i === 0
                  ? "nav-active text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.04]")
              }
            >
              <span className="size-1.5 rounded-full bg-white/40" />
              {l}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="col-span-12 space-y-4 lg:col-span-7">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {kpis.map(({ label, value, trend, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.7 }}
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
              <div className="mt-1 font-display text-lg font-semibold text-foreground">
                {value}
              </div>
              <div className="text-[10px] text-emerald-300">{trend}</div>

              {/* sparkline */}
              <div className="absolute inset-x-0 bottom-0 h-6 opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparks}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke="#A78BFA"
                      strokeWidth={1.2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Big chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-foreground/80">
                Revenue · Last 32 weeks
              </div>
              <div className="text-[10px] text-muted-foreground">
                Forecast · Nova confidence 94%
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[10px] text-violet-200">
              <Sparkles className="size-2.5" />
              AI forecast
            </div>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={area}>
                <defs>
                  <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dgf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="f"
                  stroke="#22D3EE"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  fill="url(#dgf)"
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#A78BFA"
                  strokeWidth={2}
                  fill="url(#dg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cycle time */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
        >
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground/80">Cycle time</span>
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <ArrowUpRight className="size-3 rotate-180" />
              −1.2d
            </span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <Bar
                  dataKey="v"
                  radius={[4, 4, 0, 0]}
                  fill="#22D3EE"
                  fillOpacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* AI panel */}
      <div className="col-span-12 space-y-3 lg:col-span-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-violet-500/10 to-transparent p-4"
        >
          <div className="aurora absolute -inset-6 -z-10 opacity-50" />
          <div className="flex items-center gap-2 text-xs font-medium text-foreground/90">
            <Sparkles className="size-3.5 text-violet-300" />
            Nova Insight
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Sprint is{" "}
            <span className="text-foreground">on track</span>. 3 tasks
            unblocked since this morning.
          </p>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "78%" }}
            viewport={{ once: true }}
            transition={{ delay: 0.9, duration: 1.2, ease: "easeOut" }}
            className="mt-3 h-1 rounded-full bg-nova-gradient"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Sprint health</span>
            <span>78%</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.75, duration: 0.7 }}
          className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
        >
          <div className="mb-3 text-xs font-medium text-foreground/80">
            Today
          </div>
          <ul className="space-y-2">
            {tasks.map((t, i) => (
              <motion.li
                key={t.label}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9 + i * 0.08 }}
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
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Floating side cards ─────────────────────────── */

function FloatingSideCards() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -30, y: -10 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 1 }}
        className="pointer-events-none absolute -left-2 top-10 z-10 hidden w-[220px] lg:block"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="rotate-[-4deg] rounded-2xl border border-white/[0.1] bg-white/[0.04] p-3 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.5)] backdrop-blur-xl"
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Anomaly detected
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            Churn spike +2.1%
          </div>
          <div className="mt-2 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparks}>
                <defs>
                  <linearGradient id="floatA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F472B6" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#F472B6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#F472B6"
                  strokeWidth={1.5}
                  fill="url(#floatA)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30, y: -10 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 1 }}
        className="pointer-events-none absolute -right-4 bottom-16 z-10 hidden w-[220px] lg:block"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="rotate-[3deg] rounded-2xl border border-white/[0.1] bg-white/[0.04] p-3 shadow-[0_20px_60px_-20px_rgba(34,211,238,0.5)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-nova-gradient">
              <Sparkles className="size-3 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Nova suggests
              </div>
              <div className="text-xs font-semibold text-foreground">
                Reduce paywall friction
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            +4.2% trial conversion projected
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
