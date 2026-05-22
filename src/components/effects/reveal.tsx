"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

const variants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Reveal({
  children,
  className,
  delay = 0,
  y,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={
        y !== undefined
          ? {
              hidden: { opacity: 0, y, filter: "blur(6px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
              },
            }
          : variants
      }
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
