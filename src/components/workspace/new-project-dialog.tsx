"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  projectIconMap,
  projectIconOptions,
  projectColorOptions,
} from "@/lib/project-icons";
import { PROJECT_STATUSES, type ProjectIcon } from "@/models/Project";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface NewProjectDialogProps {
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

export function NewProjectDialog({ onCreated, trigger }: NewProjectDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [icon, setIcon] = React.useState<ProjectIcon>("rocket");
  const [color, setColor] = React.useState(projectColorOptions[0]);
  const [status, setStatus] = React.useState<(typeof PROJECT_STATUSES)[number]>(
    "Planning"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const name = String(fd.get("name") || "");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: String(fd.get("description") || ""),
          icon,
          color,
          status,
          progress: 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || "Failed to create project";
        setError(msg);
        toast.error("Could not create project", { description: msg });
        return;
      }

      setOpen(false);
      form.reset();
      onCreated?.();
      toast.success("Project created", { description: name });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
      toast.error("Could not create project", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-3.5" />
            New project
          </Button>
        )}
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2"
              >
                <div className="glass-strong overflow-hidden rounded-2xl">
                  <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                    <Dialog.Title className="font-display text-lg font-semibold">
                      Create new project
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        aria-label="Close"
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </Dialog.Close>
                  </header>

                  <form onSubmit={onSubmit} className="space-y-5 p-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Payments v2"
                        required
                        minLength={1}
                        maxLength={120}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        maxLength={500}
                        placeholder="What is this project about?"
                        className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:bg-white/[0.05] focus-visible:ring-4 focus-visible:ring-primary/15"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {projectIconOptions.map((i) => {
                            const Icon = projectIconMap[i];
                            const active = icon === i;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setIcon(i)}
                                className={cn(
                                  "grid h-10 place-items-center rounded-lg border transition-colors",
                                  active
                                    ? "border-primary/50 bg-primary/[0.08] text-foreground"
                                    : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05]"
                                )}
                                aria-label={i}
                              >
                                <Icon className="size-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {projectColorOptions.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setColor(c)}
                              className={cn(
                                "relative grid h-10 place-items-center rounded-lg",
                                c,
                                color === c &&
                                  "ring-2 ring-white ring-offset-2 ring-offset-background"
                              )}
                              aria-label={`Color ${c}`}
                            >
                              {color === c && (
                                <Check className="size-4 text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex flex-wrap gap-2">
                        {PROJECT_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs transition-colors",
                              status === s
                                ? "border-primary/40 bg-primary/[0.1] text-foreground"
                                : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05]"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-rose-300">{error}</p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <Dialog.Close asChild>
                        <Button type="button" variant="ghost">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Creating…" : "Create project"}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
