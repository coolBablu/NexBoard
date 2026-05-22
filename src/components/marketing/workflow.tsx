"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, Sparkles, Wand2 } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    n: "01",
    title: "Capture",
    desc: "Drop in a doc, paste a transcript, or import a Linear project. Nova organizes it automatically.",
    icon: MessageSquare,
  },
  {
    n: "02",
    title: "Co-create",
    desc: "Brainstorm with your team in real-time. AI suggests next steps, drafts updates, and resolves blockers.",
    icon: Sparkles,
  },
  {
    n: "03",
    title: "Decide",
    desc: "Convert discussion into decisions and tasks. Owners, dates, and dependencies wired in seconds.",
    icon: Wand2,
  },
  {
    n: "04",
    title: "Ship",
    desc: "Track velocity in real-time dashboards. Auto-generated changelogs keep stakeholders in the loop.",
    icon: CheckCircle2,
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="relative py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mx-auto">
              <span className="size-1.5 rounded-full bg-cyan-400" />
              Built for momentum
            </Badge>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              From idea to shipped, in{" "}
              <span className="text-gradient-nova">four moves</span>.
            </h2>
            <p className="mt-5 text-balance text-muted-foreground">
              Replace 6 tools, dozens of meetings, and the chaos of context
              switching with one calm, intelligent surface.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-16">
          {/* Connector line */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent lg:block"
          />

          <ol className="space-y-12 lg:space-y-24">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const right = i % 2 === 1;
              return (
                <li
                  key={s.n}
                  className="relative grid items-center gap-6 lg:grid-cols-2 lg:gap-12"
                >
                  <Reveal
                    delay={0}
                    className={
                      "order-2 " + (right ? "lg:order-2" : "lg:order-1")
                    }
                  >
                    <div className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
                      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-nova-gradient shadow-glow">
                          <Icon className="size-5 text-white" />
                        </div>
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Step {s.n}
                          </div>
                          <h3 className="mt-1 font-display text-2xl font-semibold">
                            {s.title}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-4 text-muted-foreground">{s.desc}</p>
                    </div>
                  </Reveal>

                  <Reveal
                    delay={0.1}
                    className={
                      "order-1 " + (right ? "lg:order-1" : "lg:order-2")
                    }
                  >
                    <WorkflowVisual index={i} />
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function WorkflowVisual({ index }: { index: number }) {
  const palettes = [
    "from-violet-500/40 to-fuchsia-500/30",
    "from-cyan-500/40 to-blue-500/30",
    "from-fuchsia-500/40 to-rose-500/30",
    "from-emerald-400/40 to-cyan-500/30",
  ];

  return (
    <div className="relative">
      <div
        className={
          "absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br opacity-50 blur-3xl " +
          palettes[index]
        }
      />
      <div className="glass-strong rounded-3xl p-4">
        <div className="rounded-2xl border border-white/[0.06] bg-background/40 p-5">
          {/* faux UI cells */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>NovaFlow · Workflow {index + 1}</span>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
              Live
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 5 }).map((_, j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: j * 0.08 }}
                className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5"
              >
                <div
                  className={
                    "size-7 shrink-0 rounded-lg bg-gradient-to-br " +
                    palettes[index]
                  }
                />
                <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-nova-gradient"
                    style={{ width: `${30 + j * 14}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {30 + j * 14}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
