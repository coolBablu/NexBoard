"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Workflow as WorkflowIcon,
  Shield,
  Zap,
  GitBranch,
  Search,
  Command,
  ArrowUpRight,
  Paperclip,
  Send,
} from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { MouseGlow } from "@/components/effects/mouse-glow";
import { cn } from "@/lib/utils";

/**
 * True bento grid — 6 cards on a 12-column lattice with varying spans,
 * each with a unique mini-preview animation that loops subtly.
 */
export function FeaturesBento() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/80">
              Capabilities
            </p>
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything modern teams need.{" "}
              <span className="text-gradient-nova">Nothing they don't.</span>
            </h2>
            <p className="mt-5 text-balance text-muted-foreground">
              A focused set of primitives — composed beautifully, accelerated by
              AI, and engineered for the way teams actually work.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid auto-rows-[minmax(0,1fr)] grid-cols-12 gap-4 lg:gap-5">
          {/* Card 1 — Nova AI (large hero, 8 cols, 2 rows) */}
          <BentoCard
            className="col-span-12 row-span-2 lg:col-span-8"
            glow="139, 92, 246"
            icon={Sparkles}
            iconColor="text-violet-300"
            eyebrow="Nova AI"
            title="An AI that thinks with your team."
            desc="Summarize threads, draft updates, generate tasks, and unblock decisions — with full awareness of your workspace context."
          >
            <NovaChatPreview />
          </BentoCard>

          {/* Card 2 — Realtime canvas (4 cols, 2 rows) */}
          <BentoCard
            className="col-span-12 row-span-2 lg:col-span-4"
            glow="34, 211, 238"
            icon={WorkflowIcon}
            iconColor="text-cyan-300"
            eyebrow="Realtime canvas"
            title="One surface, every workflow."
            desc="Docs, projects, tasks and roadmaps in a single, beautifully fast workspace. Multiplayer cursors included."
          >
            <KanbanPreview />
          </BentoCard>

          {/* Card 3 — Speed */}
          <BentoCard
            className="col-span-12 row-span-1 md:col-span-6 lg:col-span-4"
            glow="251, 191, 36"
            icon={Zap}
            iconColor="text-amber-300"
            eyebrow="Built for speed"
            title="Sub-50ms interactions."
            desc="Local-first sync, predictive prefetch, instant search across every doc and task."
          >
            <LatencyPreview />
          </BentoCard>

          {/* Card 4 — Integrations */}
          <BentoCard
            className="col-span-12 row-span-1 md:col-span-6 lg:col-span-4"
            glow="217, 70, 239"
            icon={GitBranch}
            iconColor="text-fuchsia-300"
            eyebrow="80+ integrations"
            title="Two-way sync, everywhere."
            desc="GitHub, Linear, Figma, Slack, Notion, Stripe — bring your stack along, not replace it."
          >
            <IntegrationsPreview />
          </BentoCard>

          {/* Card 5 — Command palette */}
          <BentoCard
            className="col-span-12 row-span-1 md:col-span-6 lg:col-span-2"
            glow="139, 92, 246"
            icon={Command}
            iconColor="text-violet-300"
            eyebrow="Keyboard-first"
            title="⌘ K — fly anywhere."
            desc="Every action a keystroke away."
          />

          {/* Card 6 — Security */}
          <BentoCard
            className="col-span-12 row-span-1 md:col-span-6 lg:col-span-2"
            glow="59, 130, 246"
            icon={Shield}
            iconColor="text-blue-300"
            eyebrow="Enterprise"
            title="SOC 2, SSO, CMK."
            desc="Audit logs, residency, CMK."
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── primitives ─────────────────────────── */

interface BentoCardProps {
  className?: string;
  glow: string;
  icon: React.ElementType;
  iconColor?: string;
  eyebrow: string;
  title: string;
  desc: string;
  children?: React.ReactNode;
}

function BentoCard({
  className,
  glow,
  icon: Icon,
  iconColor,
  eyebrow,
  title,
  desc,
  children,
}: BentoCardProps) {
  return (
    <Reveal className={cn("h-full", className)}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
        style={{
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 12px 40px -12px rgba(15, 23, 42, 0.08)",
        }}
      >
        {/* Per-card mouse-follow glow */}
        <MouseGlow color={glow} size={420} opacity={0.16} />

        {/* Hairline gradient border on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, rgba(${glow}, 0.35), transparent 60%)`,
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />

        <div
          className={cn(
            "relative flex flex-col gap-3 p-6 sm:p-7",
            // Slightly tighter bottom padding when a preview follows so
            // the header section and the preview feel like one unit
            // instead of two stacked panels with a gap between them.
            children && "pb-4 sm:pb-5"
          )}
        >
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.03]",
                iconColor
              )}
            >
              <Icon className="size-5" />
            </div>
            <ArrowUpRight className="size-4 translate-x-1 -translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h3 className="text-balance font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>

        {children && (
          // flex-1 lets the preview stretch to fill the card; without
          // mt-auto the preview rides up directly under the description.
          <div className="relative flex flex-1 flex-col px-6 pb-6 sm:px-7 sm:pb-7">
            {children}
          </div>
        )}
      </motion.div>
    </Reveal>
  );
}

/* ─────────────────────────── per-card previews ─────────────────────────── */

function NovaChatPreview() {
  // A longer, more realistic conversation so the preview actually fills
  // its 2-row bento slot instead of leaving a huge white void below.
  const messages: { role: "user" | "assistant"; text: string }[] = [
    { role: "user", text: "Summarize this week's shipping risks." },
    {
      role: "assistant",
      text: "3 risks. Payments v2 webhooks lack retry tests. Stripe Tax flag undecided. Loom integration blocked on OAuth.",
    },
    { role: "user", text: "Draft a status update for the team." },
    {
      role: "assistant",
      text: "Drafted in #eng-updates. Tagged Daniel for the webhook tests and asked for a Tax decision by Friday.",
    },
  ];
  return (
    <div className="relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-foreground/[0.06] bg-background/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(94, 106, 210,0.18),transparent_60%)]" />

      {/* Header strip — anchors the chat so it doesn't look floating. */}
      <div className="relative flex items-center justify-between border-b border-foreground/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded-md bg-nova-gradient text-white">
            <Sparkles className="size-3" />
          </div>
          <div className="text-[11px] font-medium text-foreground/80">
            Nova
            <span className="ml-1.5 text-muted-foreground/80">
              · context: Sprint 24
            </span>
          </div>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/70">
          ⌘K
        </span>
      </div>

      {/* Scroll-shaped messages region — flex-1 so it expands to fill. */}
      <div className="relative flex-1 space-y-2.5 overflow-hidden p-4">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.16, duration: 0.5 }}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                m.role === "user"
                  ? "border border-foreground/[0.06] bg-foreground/[0.04] text-foreground/90"
                  : "border border-violet-500/20 bg-violet-500/10 text-foreground/90"
              )}
            >
              {m.role === "assistant" && (
                <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-violet-500/90 dark:text-violet-300/80">
                  <Sparkles className="size-2.5" /> Nova
                </div>
              )}
              <div>{m.text}</div>
            </div>
          </motion.div>
        ))}
        {/* Typing dots — keeps the conversation feeling live. */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2 }}
          className="flex justify-start"
        >
          <div className="flex items-center gap-1 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-3 py-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-violet-500 dark:bg-violet-300"
                animate={{ opacity: [0.3, 1, 0.3] }}
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
      </div>

      {/* Composer — gives the chat a real bottom edge so the card no
          longer trails off into empty space. */}
      <div className="relative border-t border-foreground/[0.06] p-3">
        <div className="flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-background/60 px-2.5 py-1.5">
          <Sparkles className="size-3.5 text-violet-500 dark:text-violet-300" />
          <span className="flex-1 truncate text-[11px] text-muted-foreground/80">
            Ask Nova about Sprint 24, drafts, or files…
          </span>
          <Paperclip className="size-3.5 text-muted-foreground/70" />
          <button
            type="button"
            className="grid size-6 place-items-center rounded-md bg-nova-gradient text-white shadow-sm"
            aria-label="Send"
          >
            <Send className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanPreview() {
  // Per-column card counts vary so the board reads as a real workflow
  // (work in progress > review > done is the common shape).
  const cols: {
    name: string;
    tone: string;
    accent: string;
    cards: { tag: string; width: string }[];
  }[] = [
    {
      name: "Doing",
      tone: "from-cyan-500/15",
      accent: "bg-cyan-500/80",
      cards: [
        { tag: "Auth flow", width: "w-3/5" },
        { tag: "Billing v2", width: "w-2/3" },
        { tag: "Onboarding", width: "w-1/2" },
      ],
    },
    {
      name: "Review",
      tone: "from-violet-500/15",
      accent: "bg-violet-500/80",
      cards: [
        { tag: "Pricing copy", width: "w-3/5" },
        { tag: "Webhooks", width: "w-1/2" },
      ],
    },
    {
      name: "Done",
      tone: "from-emerald-500/15",
      accent: "bg-emerald-500/80",
      cards: [
        { tag: "Dark mode", width: "w-2/3" },
        { tag: "Analytics", width: "w-1/2" },
        { tag: "Sentry sync", width: "w-3/5" },
        { tag: "Bento grid", width: "w-2/5" },
      ],
    },
  ];

  return (
    <div className="grid h-full min-h-[260px] grid-cols-3 gap-2">
      {cols.map((c, ci) => (
        <div
          key={c.name}
          className={cn(
            "flex flex-col rounded-xl border border-foreground/[0.06] bg-gradient-to-b to-transparent p-2",
            c.tone
          )}
        >
          <div className="mb-2 flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", c.accent)} />
              <span className="text-[10px] font-medium text-foreground/70">
                {c.name}
              </span>
            </div>
            <span className="font-mono text-[9px] text-muted-foreground/70">
              {c.cards.length}
            </span>
          </div>
          <div className="flex-1 space-y-1.5">
            {c.cards.map((card, ti) => (
              <motion.div
                key={card.tag}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ci * 0.08 + ti * 0.08 }}
                className="rounded-lg border border-foreground/[0.06] bg-background/60 p-2 shadow-sm"
              >
                <div
                  className={cn("h-1 rounded-full bg-foreground/15", card.width)}
                />
                <div className="mt-1.5 h-1 w-2/5 rounded-full bg-foreground/[0.08]" />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="size-3 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500" />
                    <div className="size-3 -ml-1 rounded-full bg-gradient-to-br from-fuchsia-500 to-amber-300" />
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground/60">
                    {card.tag}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LatencyPreview() {
  const bars = Array.from({ length: 20 }, (_, i) => 8 + ((i * 7) % 28));
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-background/40 p-4">
      <div className="flex items-end justify-between gap-1 h-16">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.02, duration: 0.45, ease: "easeOut" }}
            style={{ height: h * 1.6 }}
            className="w-1 origin-bottom rounded-full bg-gradient-to-t from-amber-500/80 to-amber-300"
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>p50: 12ms</span>
        <span className="text-amber-300">p99: 48ms</span>
      </div>
    </div>
  );
}

function IntegrationsPreview() {
  const logos = [
    "GH",
    "FG",
    "LN",
    "SL",
    "NT",
    "ST",
    "VC",
    "FM",
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {logos.map((l, i) => (
        <motion.div
          key={l}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 220 }}
          className="flex aspect-square items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-[10px] font-semibold text-foreground/60 font-mono"
        >
          {l}
        </motion.div>
      ))}
    </div>
  );
}

// Re-export for backward-compat alias
export { Search };
