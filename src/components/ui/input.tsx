import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm",
          "placeholder:text-muted-foreground/60",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:border-primary/50 focus-visible:bg-white/[0.05] focus-visible:ring-4 focus-visible:ring-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
