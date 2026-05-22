"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wrap children with a cursor-following soft spotlight glow.
 * Set --x / --y via mousemove for a subtle micro-interaction.
 */
export function Spotlight({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn("group relative", className)}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 spotlight rounded-[inherit]"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
