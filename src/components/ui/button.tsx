"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "relative bg-nova-gradient text-white shadow-glow hover:shadow-[0_0_60px_-10px_rgba(139,92,246,0.8)] hover:brightness-110",
        secondary:
          "glass text-foreground hover:bg-white/[0.06] hover:border-white/[0.14]",
        outline:
          "border border-white/10 bg-transparent text-foreground hover:bg-white/[0.04] hover:border-white/20",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_30px_-8px_rgba(239,68,68,0.6)]",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "relative bg-transparent text-foreground border border-primary/40 hover:border-primary shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_-6px_rgba(139,92,246,0.8)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-7 text-base",
        xl: "h-14 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
