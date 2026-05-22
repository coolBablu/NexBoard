"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AIInsight() {
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-cyan-500/20"
      />
      <div className="aurora absolute -inset-10 -z-10 opacity-50" />

      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-nova-gradient shadow-glow">
          <Sparkles className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs text-violet-200">
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5">
              Nova Insight
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Just now</span>
          </div>
          <p className="text-sm text-foreground/90 sm:text-base">
            Your sprint velocity is <strong>up 24%</strong> this week —
            mostly driven by Maya's payments redesign and 3 unblocked
            decisions. At this pace, you'll close{" "}
            <strong>2 days ahead</strong> of plan.
          </p>
        </div>
        <Button variant="secondary" className="self-start sm:self-auto">
          See breakdown
          <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>

      {/* Glow bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-nova-gradient"
      />
    </Card>
  );
}
