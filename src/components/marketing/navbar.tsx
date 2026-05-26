"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#automation", label: "Automation" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Highlights whichever section is currently in view by tracking the
 * intersection ratio of the matching <section id="…"> blocks. We pick
 * the entry whose top crosses ~28 % of the viewport so that the next
 * section lights up just before its header fully scrolls into view —
 * matches what users intuitively read as "I'm now in this section".
 */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    // Map id -> latest intersection ratio so we can pick the dominant
    // section on every observer fire.
    const ratios = new Map<string, number>(elements.map((el) => [el.id, 0]));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        // Require at least a sliver of the section to be visible
        // before we mark it active — prevents flicker between sections.
        setActive(bestRatio > 0.08 ? bestId : null);
      },
      {
        // Bias the active edge ~28 % from the top of the viewport.
        rootMargin: "-28% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export function MarketingNavbar() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  // Stable id list so the effect dependency is stable across renders.
  const sectionIds = React.useMemo(
    () => navLinks.map((l) => l.href.replace(/^#/, "")),
    []
  );
  const activeSection = useActiveSection(sectionIds);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-500",
          scrolled
            ? "border-white/10 bg-background/70 backdrop-blur-2xl shadow-[0_10px_40px_-12px_rgba(15, 23, 42, 0.06)]"
            : "border-transparent bg-transparent"
        )}
      >
        <Logo size="sm" />

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const id = link.href.replace(/^#/, "");
            const isActive = activeSection === id;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative rounded-lg px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 -z-0 rounded-lg bg-foreground/[0.06]"
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild size="sm">
            <Link href="/login">
              Sign in
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-foreground"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-4 top-20 z-50 md:hidden"
          >
            <div className="glass rounded-2xl p-4">
              <ul className="space-y-1">
                {navLinks.map((link) => {
                  const id = link.href.replace(/^#/, "");
                  const isActive = activeSection === id;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-foreground/[0.06] text-foreground"
                            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                        )}
                      >
                        {isActive && (
                          <span
                            aria-hidden
                            className="size-1.5 shrink-0 rounded-full bg-violet-500 dark:bg-violet-400"
                          />
                        )}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex gap-2 border-t border-white/[0.07] pt-3">
                <Button asChild className="flex-1">
                  <Link href="/login">
                    Sign in
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
