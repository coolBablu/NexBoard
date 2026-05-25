"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  LayoutDashboard,
  Users,
  Folder,
  BarChart3,
  Settings,
  Plus,
  Calendar,
  GitBranch,
  Inbox,
  FileText,
  ArrowRight,
  Command,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  shortcut?: string[];
  action: (router: ReturnType<typeof useRouter>) => void;
  keywords?: string;
}

interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

const groups: CommandGroup[] = [
  {
    id: "ai",
    label: "Ask Nova",
    items: [
      {
        id: "ai-summarize",
        label: "Summarize this week's risks",
        hint: "Nova AI",
        icon: Sparkles,
        action: (r) => r.push("/assistant"),
        keywords: "ai assistant nova risk summary",
      },
      {
        id: "ai-status",
        label: "Draft a status update for engineering",
        hint: "Nova AI",
        icon: Sparkles,
        action: (r) => r.push("/assistant"),
        keywords: "ai assistant status update",
      },
      {
        id: "ai-plan",
        label: "Plan next sprint from current backlog",
        hint: "Nova AI",
        icon: Sparkles,
        action: (r) => r.push("/assistant"),
        keywords: "ai assistant plan sprint",
      },
    ],
  },
  {
    id: "nav",
    label: "Navigate",
    items: [
      {
        id: "n-dashboard",
        label: "Go to Dashboard",
        icon: LayoutDashboard,
        shortcut: ["G", "D"],
        action: (r) => r.push("/dashboard"),
      },
      {
        id: "n-workspace",
        label: "Go to Workspace",
        icon: Users,
        shortcut: ["G", "W"],
        action: (r) => r.push("/workspace"),
      },
      {
        id: "n-projects",
        label: "Browse Projects",
        icon: Folder,
        shortcut: ["G", "P"],
        action: (r) => r.push("/workspace"),
      },
      {
        id: "n-analytics",
        label: "Open Analytics",
        icon: BarChart3,
        shortcut: ["G", "A"],
        action: (r) => r.push("/analytics"),
      },
      {
        id: "n-assistant",
        label: "Open Nova Assistant",
        icon: Sparkles,
        shortcut: ["G", "I"],
        action: (r) => r.push("/assistant"),
      },
      {
        id: "n-settings",
        label: "Open Settings",
        icon: Settings,
        shortcut: ["G", "S"],
        action: (r) => r.push("/settings"),
      },
    ],
  },
  {
    id: "create",
    label: "Create",
    items: [
      {
        id: "c-task",
        label: "New task",
        icon: Plus,
        shortcut: ["C"],
        action: (r) => r.push("/workspace"),
        keywords: "task create new",
      },
      {
        id: "c-project",
        label: "New project",
        icon: Folder,
        shortcut: ["P"],
        action: (r) => r.push("/workspace"),
        keywords: "project create new",
      },
      {
        id: "c-event",
        label: "New calendar event",
        icon: Calendar,
        action: (r) => r.push("/dashboard"),
        keywords: "calendar event create",
      },
      {
        id: "c-doc",
        label: "New document",
        icon: FileText,
        action: (r) => r.push("/workspace"),
      },
    ],
  },
  {
    id: "recent",
    label: "Recent",
    items: [
      {
        id: "r-pay",
        label: "Payments v2",
        hint: "Project · 78% complete",
        icon: Folder,
        action: (r) => r.push("/workspace"),
      },
      {
        id: "r-pr",
        label: "PR-482 · Payments redesign",
        hint: "Pull request",
        icon: GitBranch,
        action: (r) => r.push("/workspace"),
      },
      {
        id: "r-inbox",
        label: "Inbox · 4 new",
        hint: "Notifications",
        icon: Inbox,
        action: (r) => r.push("/dashboard"),
      },
    ],
  },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Flatten + filter
  const flat = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: Array<{ group: string; item: CommandItem }> = [];
    for (const g of groups) {
      for (const item of g.items) {
        if (!q) {
          result.push({ group: g.label, item });
          continue;
        }
        const hay = `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""} ${g.label}`.toLowerCase();
        if (hay.includes(q)) result.push({ group: g.label, item });
      }
    }
    return result;
  }, [query]);

  // Group rendered list
  const renderedGroups = React.useMemo(() => {
    const m = new Map<string, CommandItem[]>();
    for (const { group, item } of flat) {
      if (!m.has(group)) m.set(group, []);
      m.get(group)!.push(item);
    }
    return Array.from(m.entries());
  }, [flat]);

  // Reset state when opened
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keep activeIndex in bounds
  React.useEffect(() => {
    if (activeIndex >= flat.length) setActiveIndex(Math.max(0, flat.length - 1));
  }, [flat.length, activeIndex]);

  // Keyboard handling inside the palette
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const f = flat[activeIndex];
      if (f) {
        f.item.action(router);
        onOpenChange(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md"
          onClick={() => onOpenChange(false)}
          role="presentation"
        >
          <motion.div
            key="palette"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onKeyDown={onKeyDown}
            className="absolute left-1/2 top-[18%] w-[92%] max-w-2xl -translate-x-1/2"
          >
            {/* Subtle gradient halo */}
            <div className="pointer-events-none absolute -inset-1 rounded-[20px] bg-[conic-gradient(from_120deg_at_50%_50%,#8b5cf640,#22d3ee40,#d946ef40,#8b5cf640)] blur-2xl opacity-60" />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-background/85 shadow-[0_30px_80px_-20px_rgba(15, 23, 42, 0.08)] backdrop-blur-2xl">
              {/* Input row */}
              <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
                <Search className="size-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder="Search for actions, projects, people, or ask Nova…"
                  className="h-14 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <kbd className="hidden h-6 items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto px-2 py-2">
                {flat.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground">
                      <Search className="size-5" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No matches for{" "}
                      <span className="font-mono text-foreground">
                        "{query}"
                      </span>
                    </p>
                    <button
                      onClick={() => {
                        router.push(`/assistant?q=${encodeURIComponent(query)}`);
                        onOpenChange(false);
                      }}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-nova-gradient px-3 py-1.5 text-xs font-medium text-white shadow-glow"
                    >
                      <Sparkles className="size-3" />
                      Ask Nova about "{query.slice(0, 24)}"
                    </button>
                  </div>
                ) : (
                  renderedGroups.map(([group, items]) => (
                    <div key={group} className="mb-1">
                      <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                        {group}
                      </div>
                      <ul>
                        {items.map((it) => {
                          const idx = flat.findIndex(
                            (f) => f.item.id === it.id
                          );
                          const active = idx === activeIndex;
                          const Icon = it.icon;
                          return (
                            <li key={it.id}>
                              <button
                                onMouseEnter={() => setActiveIndex(idx)}
                                onClick={() => {
                                  it.action(router);
                                  onOpenChange(false);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                                  active
                                    ? "bg-white/[0.06]"
                                    : "hover:bg-white/[0.03]"
                                )}
                              >
                                <div
                                  className={cn(
                                    "grid h-7 w-7 shrink-0 place-items-center rounded-md border transition-colors",
                                    active
                                      ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                                      : "border-white/10 bg-white/[0.04] text-muted-foreground"
                                  )}
                                >
                                  <Icon className="size-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm text-foreground/95">
                                    {it.label}
                                  </div>
                                  {it.hint && (
                                    <div className="truncate text-[10px] text-muted-foreground">
                                      {it.hint}
                                    </div>
                                  )}
                                </div>
                                {it.shortcut && (
                                  <div className="hidden items-center gap-1 sm:flex">
                                    {it.shortcut.map((k, i) => (
                                      <kbd
                                        key={i}
                                        className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                      >
                                        {k}
                                      </kbd>
                                    ))}
                                  </div>
                                )}
                                {active && (
                                  <ArrowRight className="size-3 text-violet-300" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.02] px-4 py-2">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 font-mono">
                      ↑
                    </kbd>
                    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 font-mono">
                      ↓
                    </kbd>
                    Navigate
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 font-mono">
                      ↵
                    </kbd>
                    Select
                  </span>
                  <span className="hidden items-center gap-1 sm:inline-flex">
                    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 font-mono">
                      ESC
                    </kbd>
                    Close
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Command className="size-3" />
                  Powered by Nova
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// `useCommandPaletteShortcut` lives in `./use-command-shortcut` so that
// shell-level callers don't pull this entire heavy module.
export { useCommandPaletteShortcut } from "./use-command-shortcut";
