"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MouseGlowProps {
  className?: string;
  size?: number;
  color?: string;
  opacity?: number;
}

/**
 * A radial gradient that follows the cursor inside its parent.
 * Use as `relative` parent's child to add a cinematic mouse-follow glow.
 *
 * Usage:
 *   <section className="relative ...">
 *     <MouseGlow color="139,92,246" size={600} />
 *     ...content
 *   </section>
 */
export function MouseGlow({
  className,
  size = 520,
  color = "139, 92, 246",
  opacity = 0.18,
}: MouseGlowProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    let rafId = 0;
    let nextX = 0;
    let nextY = 0;

    const handleMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      nextX = e.clientX - rect.left;
      nextY = e.clientY - rect.top;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          el.style.setProperty("--mx", `${nextX}px`);
          el.style.setProperty("--my", `${nextY}px`);
          rafId = 0;
        });
      }
    };

    const handleEnter = () => {
      el.style.opacity = "1";
    };
    const handleLeave = () => {
      el.style.opacity = "0";
    };

    parent.addEventListener("mousemove", handleMove);
    parent.addEventListener("mouseenter", handleEnter);
    parent.addEventListener("mouseleave", handleLeave);

    return () => {
      parent.removeEventListener("mousemove", handleMove);
      parent.removeEventListener("mouseenter", handleEnter);
      parent.removeEventListener("mouseleave", handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500",
        className
      )}
      style={
        {
          background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), rgba(${color}, ${opacity}), transparent 60%)`,
        } as React.CSSProperties
      }
    />
  );
}
