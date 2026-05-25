"use client";

import * as React from "react";

/**
 * Tiny dependency-free hook that wires ⌘K / Ctrl+K to a state-setter.
 * Split from `command-palette.tsx` so that importing the keyboard hook
 * (mounted on every app page via AppShell) doesn't drag the heavy
 * `cmdk`/framer-motion command palette tree into the initial bundle.
 */
export function useCommandPaletteShortcut(setOpen: (b: boolean) => void) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}
