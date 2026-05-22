"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: "violet" | "cyan" | "fuchsia" | "none";
  hover?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { className, glow = "none", hover = true, children, ...props },
    ref
  ) => {
    const glowMap = {
      violet:
        "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.25),transparent_60%)]",
      cyan: "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.22),transparent_60%)]",
      fuchsia:
        "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(ellipse_at_bottom_right,rgba(217,70,239,0.22),transparent_60%)]",
      none: "",
    } as const;

    return (
      <motion.div
        ref={ref}
        whileHover={
          hover
            ? { y: -3, transition: { type: "spring", stiffness: 280, damping: 22 } }
            : undefined
        }
        className={cn(
          "relative isolate overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_40px_-12px_rgba(0,0,0,0.6)]",
          "transition-colors duration-300",
          hover && "hover:border-white/[0.14] hover:bg-white/[0.05]",
          glowMap[glow],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";
