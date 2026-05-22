"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { ChevronsUpDown, Check, Plus, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface WorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  icon: string;
  role: "owner" | "admin" | "member" | "guest";
  memberCount: number;
}

interface Response {
  defaultWorkspaceId: string | null;
  workspaces: WorkspaceDTO[];
}

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

const ROLE_TONE: Record<WorkspaceDTO["role"], string> = {
  owner: "text-violet-300 bg-violet-500/15",
  admin: "text-cyan-300 bg-cyan-500/15",
  member: "text-zinc-300 bg-white/[0.05]",
  guest: "text-zinc-400 bg-white/[0.04]",
};

/**
 * Workspace switcher — lives at the top of the sidebar.
 *
 *   · Click → popover with full workspace list + create form
 *   · Selecting a workspace calls /api/workspaces/switch and reloads
 *   · Collapsed sidebar mode shows just the icon
 */
export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [working, setWorking] = React.useState(false);

  const { data, isLoading } = useSWR<Response>("/api/workspaces");
  const workspaces = data?.workspaces ?? [];
  const active =
    workspaces.find((w) => w.id === data?.defaultWorkspaceId) ?? workspaces[0];

  async function switchTo(workspaceId: string) {
    if (working || workspaceId === active?.id) return;
    setWorking(true);
    const next = workspaces.find((w) => w.id === workspaceId);
    const loadingId = toast.loading("Switching workspace…");
    try {
      const res = await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      await Promise.all([
        mutate("/api/workspaces"),
        mutate("/api/projects"),
        mutate("/api/tasks"),
        mutate("/api/members"),
        mutate("/api/channels"),
        mutate("/api/notifications"),
        mutate("/api/activities"),
        mutate("/api/presence"),
      ]);
      setOpen(false);
      toast.success(`Now viewing ${next?.name ?? "workspace"}`, {
        id: loadingId,
      });
      if (typeof window !== "undefined") window.location.reload();
    } catch (err) {
      toast.fromError(err, "Could not switch workspace");
      toast.dismiss(loadingId);
    } finally {
      setWorking(false);
    }
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || working) return;
    setWorking(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setNewName("");
      setCreating(false);
      await mutate("/api/workspaces");
      const created = await res.json();
      toast.success("Workspace created", { description: created.name });
      await switchTo(created.id);
    } catch (err) {
      toast.fromError(err, "Could not create workspace");
    } finally {
      setWorking(false);
    }
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-auto mb-2 mt-3 grid h-9 w-9 place-items-center rounded-lg bg-nova-gradient text-sm shadow-glow"
        aria-label={`Workspace: ${active?.name ?? "loading"}`}
      >
        <span aria-hidden>{active?.icon || "✨"}</span>
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
          )}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-nova-gradient text-sm shadow-glow">
            <span aria-hidden>{active?.icon || "✨"}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {isLoading ? "Loading…" : active?.name ?? "Workspace"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {active ? `${active.memberCount} members · ${active.role}` : "—"}
            </p>
          </div>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[280px] overflow-hidden bg-background/90 p-0"
      >
        <div className="border-b border-white/[0.06] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Switch workspace
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto py-1.5">
          {workspaces.map((w) => {
            const activeRow = w.id === active?.id;
            return (
              <button
                key={w.id}
                onClick={() => switchTo(w.id)}
                disabled={working}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-50",
                  activeRow && "bg-white/[0.04]"
                )}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-nova-gradient text-sm">
                  <span aria-hidden>{w.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{w.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    /{w.slug} · {w.memberCount} members
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
                    ROLE_TONE[w.role]
                  )}
                >
                  {w.role}
                </span>
                {activeRow && (
                  <motion.span
                    layoutId="ws-active"
                    className="shrink-0 text-violet-300"
                  >
                    <Check className="size-3.5" />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/[0.06] p-2">
          {creating ? (
            <form onSubmit={createWorkspace} className="space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workspace name"
                autoFocus
                disabled={working}
                className="h-9"
              />
              <div className="flex gap-1.5">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newName.trim() || working}
                  className="flex-1"
                >
                  {working ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                  }}
                  disabled={working}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/[0.03] hover:text-foreground"
            >
              <Plus className="size-3.5" />
              New workspace
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
