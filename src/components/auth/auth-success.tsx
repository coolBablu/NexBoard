"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface AuthSuccessProps {
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Big animated success state — gradient checkmark, expanding rings,
 * supporting copy, optional action buttons. Used after forgot-password
 * submit and after password reset.
 */
export function AuthSuccess({ title, description, actions }: AuthSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center"
    >
      {/* halo + checkmark */}
      <div className="relative grid h-20 w-20 place-items-center">
        {/* expanding rings */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut",
            }}
            className="absolute inset-0 rounded-full bg-emerald-500/30 blur-[1px]"
          />
        ))}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 18,
            delay: 0.1,
          }}
          className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-400 shadow-[0_0_40px_-8px_rgba(52,211,153,0.7)]"
        >
          <motion.span
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }}
            className="grid h-12 w-12 place-items-center rounded-full bg-background/30 backdrop-blur"
          >
            <Check
              className="size-6 text-white"
              strokeWidth={3}
              strokeLinecap="round"
            />
          </motion.span>
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 font-display text-2xl font-semibold tracking-tight"
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-2 max-w-sm text-sm text-muted-foreground"
      >
        {description}
      </motion.div>

      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex w-full flex-col items-center gap-2"
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
}
