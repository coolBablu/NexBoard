"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin gradient progress bar pinned to the top of the viewport,
 * representing how far the user has scrolled.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.2,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-px origin-left bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
      aria-hidden
    />
  );
}
