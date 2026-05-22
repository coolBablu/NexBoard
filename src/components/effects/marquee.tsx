"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  className?: string;
  children: React.ReactNode;
  pauseOnHover?: boolean;
  reverse?: boolean;
  speed?: "slow" | "default" | "fast";
}

export function Marquee({
  className,
  children,
  pauseOnHover = true,
  reverse = false,
  speed = "default",
}: MarqueeProps) {
  const durationMap = {
    slow: "60s",
    default: "40s",
    fast: "25s",
  } as const;

  return (
    <div
      className={cn(
        "group flex w-full overflow-hidden mask-fade-r",
        className
      )}
      style={
        { "--marquee-duration": durationMap[speed] } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-10 pr-10",
          "animate-[marquee_var(--marquee-duration)_linear_infinite]",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
