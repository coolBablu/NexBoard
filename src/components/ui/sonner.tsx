"use client";

import { Toaster as SonnerPrimitive } from "sonner";
import * as React from "react";

/**
 * Branded toast container — glassmorphic dark surface to match the rest
 * of the UI. Mounted once in `Providers`; emit toasts anywhere via
 * `import { toast } from "@/lib/toast"`.
 */
export function Toaster() {
  return (
    <SonnerPrimitive
      position="bottom-right"
      offset={20}
      gap={10}
      visibleToasts={4}
      closeButton
      richColors={false}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-white/10 bg-background/90 px-4 py-3 text-sm text-foreground shadow-[0_20px_60px_-20px_rgba(15, 23, 42, 0.10)] backdrop-blur-2xl",
          title: "font-medium text-foreground leading-tight",
          description: "text-xs text-muted-foreground mt-0.5",
          actionButton:
            "rounded-md bg-nova-gradient px-2.5 py-1 text-xs font-medium text-white shadow-glow",
          cancelButton:
            "rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground",
          closeButton:
            "!bg-white/[0.06] !border-white/10 !text-muted-foreground hover:!text-foreground",
          success: "[&_[data-icon]]:text-emerald-300",
          error: "[&_[data-icon]]:text-rose-300",
          warning: "[&_[data-icon]]:text-amber-300",
          info: "[&_[data-icon]]:text-violet-300",
        },
      }}
    />
  );
}

// Re-export for convenience so callers can `import { toast } from "@/lib/toast"`.
export { toast } from "sonner";

// Suppress unused-var when only the Toaster is imported.
export type ToasterType = typeof SonnerPrimitive;
const _ensureReactImport: typeof React = React;
void _ensureReactImport;
