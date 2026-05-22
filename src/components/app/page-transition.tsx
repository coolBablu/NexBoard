"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Route-level page transition.
 *
 * Wraps every authenticated page so navigation feels cinematic without
 * being heavy — 220 ms blur + fade + slight slide. Respects the user's
 * `prefers-reduced-motion` preference (in which case it instantly swaps).
 *
 * Keyed by `pathname` so each route mounts fresh and triggers exit.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefers;
}
