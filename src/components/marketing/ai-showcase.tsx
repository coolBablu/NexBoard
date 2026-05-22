"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  GitBranch,
  MessageSquare,
  CheckCircle2,
  Bot,
  Zap,
  Send,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { MouseGlow } from "@/components/effects/mouse-glow";
import { Badge } from "@/components/ui/badge";

/**
 * AI automation showcase — split layout:
 *  · Left: copy + animated automation pipeline (5 nodes with traveling pulse)
 *  · Right: a live-feeling chat that types out a Nova response step-by-step
 */
export function AIShowcase() {
  return (
    <section
      id="automation"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      {/* Background aurora */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -left-32 top-1/3 h-[480px] w-[480px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute -right-20 top-10 h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[120px]" />
      </div>

      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mx-auto gap-2 border-white/10 bg-white/[0.03]"
            >
              <Sparkles className="size-3 text-violet-300" />
              <span className="text-xs">Nova AI · Powered by GPT-4o</span>
            </Badge>
            <h2 className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Automation that{" "}
              <span className="text-gradient-nova">writes itself</span>.
            </h2>
            <p className="mt-5 text-balance text-muted-foreground">
              Wire any input — a Slack thread, a Linear issue, a Loom recap —
              to any output. Nova plans the steps, runs them in parallel, and
              learns from every run.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]">
          <Reveal>
            <Pipeline />
          </Reveal>
          <Reveal delay={0.1}>
            <LiveChat />
          </Reveal>
        </div>

        {/* Feature mini-grid */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Bot,
              title: "Multi-step planning",
              desc: "Nova breaks a goal into ordered subtasks and runs them.",
            },
            {
              icon: GitBranch,
              title: "Tool use built-in",
              desc: "GitHub, Linear, Figma, Slack — Nova calls the right tools.",
            },
            {
              icon: Zap,
              title: "Streaming, always",
              desc: "Tokens stream as they arrive. No 30-second blank screens.",
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur">
                  <MouseGlow color="139, 92, 246" size={300} opacity={0.14} />
                  <div className="relative flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{f.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.desc}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Pipeline ─────────────────────────── */

function Pipeline() {
  const nodes = [
    {
      icon: MessageSquare,
      title: "Trigger",
      sub: "Slack message in #incidents",
      color: "from-cyan-500/20 text-cyan-300",
    },
    {
      icon: Sparkles,
      title: "Nova plans",
      sub: "Identifies 3 steps · low risk",
      color: "from-violet-500/20 text-violet-300",
    },
    {
      icon: FileText,
      title: "Drafts postmortem",
      sub: "Pulls logs, charts, owners",
      color: "from-fuchsia-500/20 text-fuchsia-300",
    },
    {
      icon: GitBranch,
      title: "Opens PR",
      sub: "Branch + checks + reviewers",
      color: "from-amber-500/20 text-amber-300",
    },
    {
      icon: CheckCircle2,
      title: "Notifies team",
      sub: "Slack, Linear, email — done",
      color: "from-emerald-500/20 text-emerald-300",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8">
      <MouseGlow color="139, 92, 246" size={520} opacity={0.14} />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Workflow · incident_response
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            From signal to resolution
          </h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live
        </div>
      </div>

      <div className="relative mt-8 space-y-3">
        {/* Connector spine */}
        <div
          aria-hidden
          className="absolute left-[26px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent"
        />
        {/* Traveling pulse */}
        <motion.div
          aria-hidden
          className="absolute left-[26px] h-12 w-px bg-gradient-to-b from-violet-400 via-fuchsia-400 to-cyan-400"
          initial={{ top: 0, opacity: 0 }}
          animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: "blur(2px)" }}
        />

        {nodes.map((n, i) => {
          const Icon = n.icon;
          return (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.55 }}
              className="relative flex items-center gap-4"
            >
              <div
                className={`relative z-10 inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br to-transparent backdrop-blur ${n.color}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <div className="text-sm font-medium text-foreground/90">
                  {n.title}
                </div>
                <div className="text-xs text-muted-foreground">{n.sub}</div>
              </div>
              <div className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                {((i + 1) * 240).toLocaleString()}ms
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── Live chat ─────────────────────────── */

function LiveChat() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-background/40 p-6 backdrop-blur-xl sm:p-8">
      <MouseGlow color="34, 211, 238" size={420} opacity={0.14} />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-nova-gradient text-white shadow-glow">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Nova Assistant</div>
            <div className="text-[10px] text-muted-foreground">
              context · Sprint 24 · 8 docs
            </div>
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </div>
      </div>

      <div className="relative mt-6 space-y-3">
        <UserBubble text="Why is Payments v2 at risk this week?" />
        <NovaTypingBubble />
        <NovaBubble />
        <UserBubble text="Draft a Slack update for engineering." />
      </div>

      {/* Composer */}
      <div className="relative mt-6 flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2">
        <Sparkles className="size-4 text-violet-300" />
        <span className="flex-1 truncate text-sm text-foreground/40">
          Ask Nova anything…
        </span>
        <button className="grid h-8 w-8 place-items-center rounded-lg bg-nova-gradient text-white shadow-glow transition-transform hover:scale-105">
          <Send className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex justify-end"
    >
      <div className="max-w-[80%] rounded-2xl rounded-br-md border border-white/[0.06] bg-white/[0.05] px-3.5 py-2 text-sm text-foreground/90">
        {text}
      </div>
    </motion.div>
  );
}

function NovaTypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4 }}
      className="flex"
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-violet-500/25 bg-violet-500/10 px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-violet-300"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function NovaBubble() {
  const lines = [
    "Payments v2 is **78%** complete, on pace to land 2 days ahead.",
    "Two items need attention before launch:",
    "• Webhook retry tests missing for `payment_failed` (owner: Daniel)",
    "• Stripe Tax flag decision pending — recommend gating 48h",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="flex"
    >
      <div className="max-w-[88%] space-y-1.5 rounded-2xl rounded-bl-md border border-violet-500/25 bg-violet-500/10 px-3.5 py-3 text-xs leading-relaxed text-foreground/90">
        <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-violet-300/80">
          <Sparkles className="size-2.5" /> Nova
        </div>
        {lines.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.4 + i * 0.18, duration: 0.4 }}
            dangerouslySetInnerHTML={{
              __html: l.replace(
                /\*\*(.+?)\*\*/g,
                '<span class="font-semibold text-foreground">$1</span>'
              ).replace(
                /`(.+?)`/g,
                '<code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[10px]">$1</code>'
              ),
            }}
          />
        ))}
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 2.2 }}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-foreground/80 hover:bg-white/[0.08]"
        >
          Open Payments v2 <ArrowRight className="size-2.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
