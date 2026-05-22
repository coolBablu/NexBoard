"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PresenceState = "online" | "away" | "offline";

const TONE: Record<PresenceState, string> = {
  online: "bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.18)]",
  away: "bg-amber-400 shadow-[0_0_0_2px_rgba(245,158,11,0.18)]",
  offline: "bg-zinc-500",
};

const SIZES = {
  xs: "size-1.5",
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
} as const;

interface PresenceDotProps {
  state: PresenceState;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}

/** Visual indicator (green/amber/grey dot) for a user's presence state. */
export function PresenceDot({
  state,
  size = "sm",
  className,
  ring = true,
}: PresenceDotProps) {
  return (
    <span
      aria-label={state}
      className={cn(
        "inline-block rounded-full",
        SIZES[size],
        TONE[state],
        ring && "ring-2 ring-background",
        state === "online" && "animate-pulse",
        className
      )}
    />
  );
}

/**
 * Heartbeat hook — call once at the top of `AppShell` to keep the user's
 * `lastSeenAt` field fresh. Pings every 30 s while the tab is visible.
 */
export function usePresenceHeartbeat(enabled: boolean = true): void {
  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const ping = () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      fetch("/api/presence", { method: "POST" }).catch(() => undefined);
    };

    ping(); // immediate
    timer = setInterval(ping, 30_000);

    const onFocus = () => ping();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [enabled]);
}
