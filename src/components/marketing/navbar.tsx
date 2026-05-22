"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
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

export function MarketingNavbar() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

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
            ? "border-white/10 bg-background/70 backdrop-blur-2xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)]"
            : "border-transparent bg-transparent"
        )}
      >
        <Logo size="sm" />

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">
              Get started
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

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-4 top-20 z-50 md:hidden"
        >
          <div className="glass rounded-2xl p-4">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2 border-t border-white/[0.07] pt-3">
              <Button asChild variant="secondary" className="flex-1">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/signup">Get started</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
