"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Animated shimmer placeholder used to mask loading content.
 *
 *   <Skeleton className="h-4 w-40" />
 *   <Skeleton variant="circle" className="h-9 w-9" />
 *
 * Honors `prefers-reduced-motion` (set in globals.css).
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "text";
}

export function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-hidden
      className={cn(
        // Foreground-based tint adapts to BOTH light and dark themes —
        // hard-coded white was invisible on the Linear Light surface.
        "relative overflow-hidden bg-foreground/[0.06] dark:bg-white/[0.045]",
        variant === "default" && "rounded-lg",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded-md",
        // Shimmer overlay (uses .shimmer keyframe from globals.css)
        "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-foreground/[0.05] after:to-transparent after:animate-[skeleton-sweep_1.6s_ease-in-out_infinite] dark:after:via-white/[0.08]",
        className
      )}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// Composed skeletons for the most common loading surfaces
// ─────────────────────────────────────────────────────────────────────

/** Generic card skeleton — used for empty grids of cards. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-5/6" />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          <Skeleton variant="circle" className="h-6 w-6" />
          <Skeleton variant="circle" className="h-6 w-6" />
          <Skeleton variant="circle" className="h-6 w-6" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

/** Stat tile skeleton — matches `<MetricTile>` dimensions. */
export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton variant="circle" className="h-7 w-7" />
      </div>
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-3 h-10 w-full" />
    </div>
  );
}

/** Kanban column skeleton — three faded card placeholders. */
export function SkeletonKanban() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-max gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-80 shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton variant="circle" className="h-6 w-6" />
            </div>
            <div className="space-y-2.5">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="rounded-xl border border-white/[0.05] bg-card/40 p-3.5"
                >
                  <Skeleton className="mb-2 h-3.5 w-16" />
                  <Skeleton className="mb-1 h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="mt-3 flex items-center justify-between">
                    <Skeleton className="h-4 w-10" />
                    <div className="flex -space-x-1">
                      <Skeleton variant="circle" className="h-5 w-5" />
                      <Skeleton variant="circle" className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Chat message skeleton (5 rows). */
export function SkeletonChat({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-5 px-5 py-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton variant="circle" className="h-8 w-8 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-10" />
            </div>
            <Skeleton className={cn("h-3", i % 2 ? "w-3/5" : "w-4/5")} />
            {i % 3 === 0 && <Skeleton className="h-3 w-1/3" />}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Generic list-row skeleton (notifications, members, conversations). */
export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5">
      <Skeleton variant="circle" className="h-8 w-8 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}
