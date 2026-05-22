"use client";

import {
  Sparkles,
  Workflow,
  Shield,
  Zap,
  GitBranch,
  LineChart,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "@/components/effects/reveal";

const features = [
  {
    icon: Sparkles,
    title: "Nova AI, in every surface",
    desc: "Summarize meetings, write specs, generate tasks, and unblock decisions — without leaving your flow.",
    accent: "from-violet-500/25",
    glow: "violet" as const,
  },
  {
    icon: Workflow,
    title: "One canvas, every workflow",
    desc: "Docs, projects, tasks and roadmaps in a single, beautifully fast workspace. No tab hopping.",
    accent: "from-cyan-500/25",
    glow: "cyan" as const,
  },
  {
    icon: Zap,
    title: "Built for speed",
    desc: "Sub-50ms interactions, multiplayer cursors, instant search. It feels like Linear meets Figma.",
    accent: "from-amber-400/20",
    glow: "none" as const,
  },
  {
    icon: GitBranch,
    title: "Deep integrations",
    desc: "Two-way sync with GitHub, Linear, Figma, Slack, Notion and 80+ tools your team already uses.",
    accent: "from-fuchsia-500/20",
    glow: "fuchsia" as const,
  },
  {
    icon: LineChart,
    title: "Analytics you'll trust",
    desc: "Real-time dashboards with AI-generated insights. Forecasts, anomalies, and OKR tracking built-in.",
    accent: "from-emerald-400/20",
    glow: "none" as const,
  },
  {
    icon: Shield,
    title: "Enterprise-grade",
    desc: "SOC 2 Type II, SAML SSO, SCIM, audit logs, regional data residency, and customer-managed keys.",
    accent: "from-blue-500/20",
    glow: "none" as const,
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/80">
              Capabilities
            </p>
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              An <span className="text-gradient-nova">intelligent workspace</span>{" "}
              that just works.
            </h2>
            <p className="mt-5 text-balance text-muted-foreground">
              NovaFlow brings every modern team primitive into a single,
              beautifully designed surface — powered by an AI that learns
              your team's context.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 0.05}>
                <GlassCard
                  glow={f.glow}
                  className={
                    "h-full bg-gradient-to-br " + f.accent + " to-transparent"
                  }
                >
                  <div className="flex h-full flex-col p-6">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-foreground">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
