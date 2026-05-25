"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Quote } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuroraBackground } from "@/components/effects/aurora-background";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="relative flex min-h-screen flex-col px-6 py-10 sm:px-10 lg:min-h-0">
        <AuroraBackground variant="subtle" className="lg:hidden" />
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
            Back to site
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to NovaFlow's{" "}
          <Link href="#" className="underline-offset-4 hover:text-foreground hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline-offset-4 hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Right: showpiece */}
      <div className="relative hidden overflow-hidden border-l border-white/[0.06] lg:block">
        <AuroraBackground />
        <div className="relative flex h-full flex-col items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <div className="relative">
              {/* Floating cards */}
              <FloatCard
                style={{ top: "-2rem", left: "-2rem" }}
                className="rotate-[-4deg]"
                title="Sprint health"
                value="92%"
                tone="emerald"
              />
              <FloatCard
                style={{ top: "-1rem", right: "-3rem" }}
                className="rotate-[5deg]"
                title="AI summary ready"
                value="14 docs"
                tone="violet"
              />
              <FloatCard
                style={{ bottom: "-1rem", left: "-3rem" }}
                className="rotate-[-3deg]"
                title="Cycle time"
                value="−1.2d"
                tone="cyan"
              />

              <div className="glass-strong relative aspect-[4/5] rounded-3xl p-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>NovaFlow · Workspace</span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                    Live
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold">
                  Welcome back, <br />
                  <span className="text-gradient-nova">Alex.</span>
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your team shipped 12 tasks since you were last here. The
                  AI has prepared a 90-second recap.
                </p>

                <div className="mt-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div className="size-8 rounded-lg bg-gradient-to-br from-violet-500/40 to-cyan-500/30" />
                      <div className="flex-1">
                        <div className="h-2 w-3/4 rounded-full bg-white/[0.08]" />
                        <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-white/[0.05]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.figure
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 max-w-md text-center"
          >
            <Quote className="mx-auto size-5 text-violet-300/70" />
            <blockquote className="mt-3 text-sm text-foreground/80">
              "We replaced four tools in a single week. The AI is genuinely
              useful — not a gimmick."
            </blockquote>
            <figcaption className="mt-3 text-xs text-muted-foreground">
              Sara Patel · Head of Product, Lumen Labs
            </figcaption>
          </motion.figure>
        </div>
      </div>
    </div>
  );
}

function FloatCard({
  title,
  value,
  tone,
  style,
  className = "",
}: {
  title: string;
  value: string;
  tone: "emerald" | "violet" | "cyan";
  style?: React.CSSProperties;
  className?: string;
}) {
  const tones = {
    emerald: "from-emerald-400/30 text-emerald-200",
    violet: "from-violet-500/30 text-violet-200",
    cyan: "from-cyan-500/30 text-cyan-200",
  };
  return (
    <motion.div
      style={style}
      className={
        "glass absolute z-10 rounded-2xl p-3 shadow-[0_20px_60px_-15px_rgba(15, 23, 42, 0.08)] " +
        className
      }
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className={`mb-1 inline-flex rounded-md bg-gradient-to-br ${tones[tone]} to-transparent px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider`}>
        {title}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </motion.div>
  );
}
