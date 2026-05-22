"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  showChecklist?: boolean;
}

const CHECKS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const LEVELS = [
  { label: "Too weak", color: "from-rose-500 to-rose-400", text: "text-rose-300" },
  { label: "Weak", color: "from-amber-500 to-amber-400", text: "text-amber-300" },
  { label: "Fair", color: "from-yellow-500 to-yellow-400", text: "text-yellow-300" },
  { label: "Strong", color: "from-cyan-500 to-cyan-400", text: "text-cyan-300" },
  { label: "Excellent", color: "from-violet-500 via-fuchsia-500 to-cyan-400", text: "text-violet-300" },
];

/**
 * Animated password-strength meter with optional rule checklist.
 * Score 0–4 derived from the same rules shown in the checklist.
 */
export function PasswordStrength({
  password,
  showChecklist = true,
}: PasswordStrengthProps) {
  const score = CHECKS.reduce((s, c) => (c.test(password) ? s + 1 : s), 0);
  const level = LEVELS[Math.min(score, LEVELS.length - 1)];
  const segments = 4;
  const filled = password.length === 0 ? 0 : Math.max(1, score);

  return (
    <div className="space-y-2.5">
      {/* segmented bar */}
      <div className="flex gap-1.5">
        {Array.from({ length: segments }).map((_, i) => {
          const active = i < filled;
          return (
            <div
              key={i}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: active ? "100%" : 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.04,
                }}
                className={cn(
                  "absolute inset-y-0 left-0 bg-gradient-to-r",
                  active && level.color
                )}
              />
            </div>
          );
        })}
      </div>

      {/* label */}
      <div className="flex items-center justify-between text-[11px]">
        <span className={cn("font-medium", password ? level.text : "text-muted-foreground")}>
          {password ? level.label : "Enter a password"}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {score}/{segments}
        </span>
      </div>

      {/* checklist */}
      {showChecklist && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
          {CHECKS.map((c, i) => {
            const ok = c.test(password);
            return (
              <motion.li
                key={c.label}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-1.5 text-[11px]"
              >
                <motion.span
                  animate={{
                    scale: ok ? [1, 1.15, 1] : 1,
                    backgroundColor: ok
                      ? "rgba(52,211,153,0.15)"
                      : "rgba(255,255,255,0.04)",
                  }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full",
                    ok ? "text-emerald-300" : "text-muted-foreground"
                  )}
                >
                  {ok ? <Check className="size-2.5" /> : <X className="size-2.5" />}
                </motion.span>
                <span className={ok ? "text-foreground/80" : "text-muted-foreground"}>
                  {c.label}
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
