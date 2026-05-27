"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Play,
  Command,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Magnetic } from "@/components/effects/magnetic";

/**
 * Cinematic Awwwards-tier hero:
 *  · Mouse-tracked gradient orb behind the headline
 *  · Kinetic, staggered word reveal (blur + y + opacity)
 *  · Floating UI shards (rotating chips) around the headline
 *  · Magnetic primary CTA
 *  · Parallax fade as you scroll past
 *  · Realistic product chrome below with live mini-stats
 */
export function HeroCinematic() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Mouse-tracked spring values for the headline orb
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const ox = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.4 });
  const oy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.4 });

  // Parallax: as the user scrolls past the hero, content drifts up + fades.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.35]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  React.useEffect(() => {
    if (reducedMotion) return;
    function onMouse(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      mx.set(e.clientX - rect.left - rect.width / 2);
      my.set(e.clientY - rect.top - rect.height / 2);
    }
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, [mx, my, reducedMotion]);

  return (
    <section
      ref={containerRef}
      className="relative isolate min-h-[100svh] overflow-hidden bg-white pt-36 pb-24 text-foreground sm:pt-44"
    >
      {/* ─── Background layer 1: soft dot grid (anchored, light) ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 opacity-[0.55] [background-image:radial-gradient(circle_at_center,rgba(15,23,42,0.06)_1px,transparent_1.2px)] [background-size:26px_26px]"
      />

      {/* ─── Background layer 2: vertical fade so the grid dissolves
              into white toward top + bottom edges ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 bg-[linear-gradient(to_bottom,white_0%,transparent_25%,transparent_72%,white_100%)]"
      />

      {/* ─── Background layer 3: stationary triple-orb glow stack ───
              These are the "centered light" — violet core, cyan halo,
              fuchsia accent — painted soft so dark text on top stays
              perfectly legible. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute left-1/2 top-[34%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/30 blur-[140px]" />
        <div className="absolute left-1/2 top-[34%] h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-[160px]" />
        <div className="absolute left-[20%] top-[58%] h-[360px] w-[360px] rounded-full bg-fuchsia-400/15 blur-[120px]" />
        <div className="absolute right-[18%] top-[20%] h-[300px] w-[300px] rounded-full bg-sky-400/15 blur-[100px]" />
      </div>

      {/* ─── Background layer 4: mouse-tracked spotlight on top of
              everything else, so it follows the cursor like a flashlight
              over the headline ─── */}
      <motion.div
        aria-hidden
        style={{ x: ox, y: oy }}
        className="pointer-events-none absolute left-1/2 top-[34%] -z-10 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18),transparent_60%)]" />
      </motion.div>

      {/* ─── Subtle hairline grid pattern with a strong center mask so
              the lines fade outward like a vignette ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-grid opacity-[0.25] [mask-image:radial-gradient(ellipse_50%_45%_at_50%_45%,black,transparent_75%)]"
      />

      {/* Floating chips around headline */}
      <FloatingChips />

      <motion.div
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="container relative"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <RevealUp delay={0}>
            <Link href="#changelog" className="group inline-flex">
              <Badge
                variant="outline"
                className="gap-2 border-foreground/[0.08] bg-white/80 px-3 py-1 shadow-sm backdrop-blur"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                </span>
                <span className="text-xs text-foreground/80">
                  NovaFlow 2.0 — AI in every workflow
                </span>
                <ArrowRight className="size-3 text-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Badge>
            </Link>
          </RevealUp>

          <h1 className="mt-7 text-balance font-display text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
            <KineticLine words={["The", "AI", "workspace"]} startDelay={0.15} />
            <br />
            <KineticLine
              words={["that", "moves", "at"]}
              startDelay={0.5}
              accent
            />{" "}
            <KineticLine words={["the", "speed", "of"]} startDelay={0.85} />{" "}
            <KineticLine words={["thought."]} startDelay={1.2} accent />
          </h1>

          <RevealUp delay={1.45}>
            <p className="mt-7 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Plan, build, and ship with an AI that understands your team.
              One beautifully fast workspace for docs, projects, and
              decisions — cinematically smooth, secure by default.
            </p>
          </RevealUp>

          <RevealUp delay={1.6}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Magnetic strength={0.35}>
                <Button
                  asChild
                  size="lg"
                  className="relative w-full overflow-hidden shadow-glow sm:w-auto"
                >
                  <Link href="/login">
                    <span className="relative z-10 flex items-center gap-2">
                      Start free
                      <ArrowRight className="size-4" />
                    </span>
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] bg-[length:200%_100%] animate-shimmer"
                    />
                  </Link>
                </Button>
              </Magnetic>
              <Magnetic strength={0.2}>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Link href="#dashboard">
                    <Play className="size-3.5" />
                    Watch the 90-sec tour
                  </Link>
                </Button>
              </Magnetic>
            </div>
          </RevealUp>

          <RevealUp delay={1.75}>
            <div className="mt-7 flex items-center gap-4 text-xs text-foreground/70">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3 text-violet-500" />
                Free for teams up to 10
              </span>
              <span className="hidden h-3 w-px bg-foreground/15 sm:inline-block" />
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <CheckCircle2 className="size-3 text-emerald-500" />
                No credit card
              </span>
              <span className="hidden h-3 w-px bg-foreground/15 sm:inline-block" />
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <Command className="size-3 text-cyan-600" />
                Set up in 90 seconds
              </span>
            </div>
          </RevealUp>

          {/* Live stat strip */}
          <RevealUp delay={1.95}>
            <div className="mt-14 grid w-full max-w-3xl grid-cols-3 divide-x divide-foreground/[0.08] rounded-2xl border border-foreground/[0.08] bg-white/80 py-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.18)] backdrop-blur-xl">
              {[
                { v: "12,400+", l: "Teams shipping faster" },
                { v: "3.2M", l: "AI runs / month" },
                { v: "99.99%", l: "Uptime SLA" },
              ].map((s) => (
                <div key={s.l} className="px-4 text-center">
                  <div className="font-display text-2xl font-semibold tracking-tight text-foreground">
                    {s.v}
                  </div>
                  <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </RevealUp>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-foreground/55"
        aria-hidden
      >
        <div className="flex flex-col items-center gap-2">
          <span>Scroll</span>
          <div className="h-8 w-px overflow-hidden bg-foreground/15">
            <motion.div
              className="h-4 w-px bg-gradient-to-b from-violet-500 to-transparent"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function RevealUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function KineticLine({
  words,
  startDelay,
  accent,
}: {
  words: string[];
  startDelay: number;
  accent?: boolean;
}) {
  return (
    <span className="inline-block whitespace-nowrap">
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="relative inline-block overflow-hidden align-bottom"
        >
          <motion.span
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              delay: startDelay + i * 0.08,
              duration: 0.95,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`inline-block ${accent ? "text-gradient-nova" : ""}`}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

function FloatingChips() {
  const chips = [
    {
      x: "8%",
      y: "22%",
      r: -8,
      delay: 0.6,
      content: (
        <>
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-foreground/85">
            Sprint health · <span className="text-emerald-600">+12%</span>
          </span>
        </>
      ),
    },
    {
      x: "82%",
      y: "18%",
      r: 6,
      delay: 0.85,
      content: (
        <>
          <Sparkles className="size-3 text-violet-500" />
          <span className="text-xs font-medium text-foreground/85">
            Nova drafted 3 PRDs
          </span>
        </>
      ),
    },
    {
      x: "6%",
      y: "62%",
      r: 7,
      delay: 1.05,
      content: (
        <>
          <Zap className="size-3 text-amber-500" />
          <span className="text-xs font-medium text-foreground/85">
            Cycle time −1.2d
          </span>
        </>
      ),
    },
    {
      x: "84%",
      y: "60%",
      r: -5,
      delay: 1.25,
      content: (
        <>
          <CheckCircle2 className="size-3 text-cyan-600" />
          <span className="text-xs font-medium text-foreground/85">
            12 tasks shipped
          </span>
        </>
      ),
    },
  ];

  return (
    <>
      {chips.map((c, i) => (
        <motion.div
          key={i}
          aria-hidden
          initial={{ opacity: 0, y: 20, rotate: c.r }}
          animate={{ opacity: 1, y: 0, rotate: c.r }}
          transition={{
            delay: c.delay,
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ left: c.x, top: c.y }}
          className="pointer-events-none absolute z-0 hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center gap-2 rounded-full border border-foreground/[0.08] bg-white/90 px-3 py-1.5 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.25)] backdrop-blur-xl"
          >
            {c.content}
          </motion.div>
        </motion.div>
      ))}
    </>
  );
}
