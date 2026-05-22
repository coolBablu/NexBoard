"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** How strongly the element is pulled toward the cursor. 0-1. */
  strength?: number;
}

/**
 * Subtle magnetic hover — the element drifts toward the cursor
 * while it's over the parent's hit area. Springs back when leaving.
 */
export function Magnetic({
  children,
  className,
  strength = 0.28,
}: MagneticProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 220, damping: 18, mass: 0.4 };
  const sx = useSpring(x, springConfig);
  const sy = useSpring(y, springConfig);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn("inline-block", className)}
    >
      <motion.div style={{ x: sx, y: sy }}>{children}</motion.div>
    </div>
  );
}
