"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import {
  CommandPalette,
  useCommandPaletteShortcut,
} from "@/components/dashboard/command-palette";
import { FloatingAssistant } from "@/components/assistant/floating-assistant";
import { usePresenceHeartbeat } from "@/components/team/presence";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

interface ShellContextValue {
  openPalette: () => void;
}

const ShellContext = React.createContext<ShellContextValue | null>(null);

export function useAppShell() {
  const ctx = React.useContext(ShellContext);
  if (!ctx) throw new Error("useAppShell must be used inside <AppShell>");
  return ctx;
}

export function AppShell({ children, title, description }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Global ⌘K / Ctrl+K to open the command palette
  useCommandPaletteShortcut(setPaletteOpen);

  // Heartbeat the user's presence every 30 s.
  usePresenceHeartbeat(true);

  const ctxValue = React.useMemo<ShellContextValue>(
    () => ({ openPalette: () => setPaletteOpen(true) }),
    []
  );

  return (
    <ShellContext.Provider value={ctxValue}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "transition-[padding] duration-300 ease-out",
            collapsed ? "lg:pl-[78px]" : "lg:pl-[260px]"
          )}
        >
          <Topbar
            onOpenSidebar={() => setMobileOpen(true)}
            onOpenPalette={() => setPaletteOpen(true)}
            title={title}
            description={description}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className="relative px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
          >
            <div
              aria-hidden
              className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[60vh] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]"
            />
            {children}
          </main>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <FloatingAssistant />
      </div>
    </ShellContext.Provider>
  );
}
