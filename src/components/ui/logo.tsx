import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  size = "md",
  withText = true,
  href = "/",
  className,
}: LogoProps) {
  const sizes = {
    sm: { box: "h-7 w-7", text: "text-base", icon: 14 },
    md: { box: "h-9 w-9", text: "text-lg", icon: 18 },
    lg: { box: "h-12 w-12", text: "text-2xl", icon: 24 },
  } as const;

  const s = sizes[size];

  const inner = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl bg-nova-gradient shadow-glow",
          s.box
        )}
      >
        <div className="absolute inset-0 rounded-xl bg-noise opacity-[0.15] mix-blend-overlay" />
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 19V5h3l8 10V5h3v14h-3L8 9v10H5z"
            fill="white"
          />
        </svg>
      </div>
      {withText && (
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            s.text
          )}
        >
          Nova<span className="text-gradient-nova">Flow</span>
        </span>
      )}
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="group inline-flex items-center">
      {inner}
    </Link>
  );
}
