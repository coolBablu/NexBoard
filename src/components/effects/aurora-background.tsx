"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  variant?: "default" | "subtle";
}

/**
 * Cinematic animated aurora used behind hero / auth backgrounds.
 * Pure CSS + framer-motion; GPU-friendly.
 */
export function AuroraBackground({
  className,
  variant = "default",
}: AuroraBackgroundProps) {
  const opacity = variant === "subtle" ? 0.55 : 1;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className
      )}
      aria-hidden
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <div className="absolute -top-1/3 left-1/2 h-[80vh] w-[80vw] -translate-x-1/2 rounded-full bg-violet-600/30 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/4 -right-32 h-[60vh] w-[60vw] rounded-full bg-cyan-500/20 blur-[120px] animate-pulse-glow [animation-delay:-2s]" />
        <div className="absolute -bottom-32 left-0 h-[60vh] w-[60vw] rounded-full bg-fuchsia-600/20 blur-[120px] animate-pulse-glow [animation-delay:-4s]" />
      </motion.div>
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_85%)]" />
    </div>
  );
}
