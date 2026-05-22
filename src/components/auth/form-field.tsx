"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  icon?: LucideIcon;
  error?: string | null;
  success?: boolean;
  trailing?: React.ReactNode;
}

/**
 * Floating-label input with focus glow, error shake, and success checkmark.
 * Pure cosmetic wrapper over native <input> — works with FormData / RHF.
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField(
    { label, icon: Icon, error, success, trailing, className, id, ...props },
    ref
  ) {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const [focused, setFocused] = React.useState(false);
    const [filled, setFilled] = React.useState(
      !!props.defaultValue || !!props.value
    );

    function handleInput(e: React.FormEvent<HTMLInputElement>) {
      setFilled(e.currentTarget.value.length > 0);
    }

    const floated = focused || filled;
    const showError = !!error;

    return (
      <div className={cn("relative", className)}>
        <motion.div
          animate={
            showError
              ? { x: [0, -4, 4, -3, 3, -1, 1, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.35 }}
          className={cn(
            "group relative flex h-12 items-center rounded-xl border bg-white/[0.025] transition-all",
            showError
              ? "border-rose-500/40 ring-4 ring-rose-500/10"
              : focused
                ? "border-violet-500/40 ring-4 ring-violet-500/10 bg-white/[0.05]"
                : "border-white/[0.08] hover:border-white/[0.14]"
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                "ml-3.5 size-4 shrink-0 transition-colors",
                showError
                  ? "text-rose-300"
                  : focused
                    ? "text-violet-300"
                    : "text-muted-foreground"
              )}
            />
          )}

          <div className="relative h-full flex-1">
            {/* floating label */}
            <motion.label
              htmlFor={inputId}
              animate={{
                top: floated ? "0.3rem" : "50%",
                y: floated ? 0 : "-50%",
                fontSize: floated ? "10px" : "13px",
                color: showError
                  ? "rgb(252 165 165 / 0.85)"
                  : focused
                    ? "rgb(196 181 253 / 0.9)"
                    : "rgb(156 163 175 / 0.75)",
              }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-none absolute left-3 origin-left font-medium tracking-wide uppercase",
                Icon && "left-2"
              )}
              style={{
                letterSpacing: floated ? "0.14em" : "0.04em",
              }}
            >
              {label}
            </motion.label>

            <input
              {...props}
              ref={ref}
              id={inputId}
              onFocus={(e) => {
                setFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                props.onBlur?.(e);
              }}
              onInput={(e) => {
                handleInput(e);
                props.onInput?.(e);
              }}
              className={cn(
                "h-full w-full bg-transparent pl-3 pr-3 pt-3 pb-1 text-sm text-foreground placeholder:text-transparent focus:outline-none",
                Icon && "pl-2"
              )}
            />
          </div>

          {/* trailing: success ✓ or custom slot */}
          <div className="mr-2 flex items-center gap-1">
            <AnimatePresence>
              {success && !showError && (
                <motion.span
                  key="ok"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/15 text-emerald-300"
                >
                  <Check className="size-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
            {trailing}
          </div>
        </motion.div>

        <AnimatePresence>
          {showError && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-rose-300">
                <AlertCircle className="size-3" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
