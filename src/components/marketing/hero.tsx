"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { Badge } from "@/components/ui/badge";
import { HeroPreview } from "./hero-preview";

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
      <AuroraBackground />

      <div className="container relative">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
          >
            <Link href="#" className="group inline-flex">
              <Badge
                variant="outline"
                className="gap-2 border-white/10 bg-white/[0.03] px-3 py-1 backdrop-blur"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
                </span>
                <span className="text-xs text-foreground/80">
                  Introducing NovaFlow 2.0 — AI in every workflow
                </span>
                <ArrowRight className="size-3 text-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Badge>
            </Link>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-7 text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            The AI workspace where{" "}
            <span className="text-gradient-nova">teams move</span>{" "}
            at the speed of thought.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
          >
            Plan, build, and ship with an AI that understands your team.
            One beautifully fast workspace for docs, projects, and
            decisions — cinematically smooth, secure by default.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">
                Start free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
              <Link href="#workflow">
                <Play className="size-3.5" />
                Watch the 90-sec tour
              </Link>
            </Button>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-5 text-xs text-muted-foreground"
          >
            <Sparkles className="mr-1.5 inline size-3 text-violet-300" />
            Free for teams of up to 10 · No credit card required
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 80, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20"
        >
          <HeroPreview />
        </motion.div>
      </div>
    </section>
  );
}
