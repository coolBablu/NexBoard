import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary-foreground/90 [&_svg]:size-3",
        secondary:
          "border-white/10 bg-white/[0.04] text-foreground/80",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-300",
        danger: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        outline: "border-white/15 text-foreground/80",
        gradient:
          "border-transparent bg-nova-gradient text-white shadow-glow",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
