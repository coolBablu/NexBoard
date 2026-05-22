"use client";

import * as React from "react";
import useSWR from "swr";
import { Check, Plus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceDot, type PresenceState } from "@/components/team/presence";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  handle: string;
  image: string;
  title: string | null;
  presence: PresenceState;
}

interface AssigneePickerProps {
  assigneeIds: string[];
  onChange: (ids: string[]) => void;
  trigger?: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
}

/**
 * Avatar stack + popover member picker.
 *
 *   · Renders up to 3 avatars + a "+N" overflow chip.
 *   · Click to open the popover (search + multi-select).
 *   · Optimistic — calls `onChange` synchronously on each toggle.
 */
export function AssigneePicker({
  assigneeIds,
  onChange,
  trigger,
  side = "bottom",
  align = "start",
}: AssigneePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const { data } = useSWR<{ members: Member[] }>("/api/members");
  const members = data?.members ?? [];
  const memberMap = React.useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );
  const assigned = assigneeIds.map((id) => memberMap.get(id)).filter(Boolean) as Member[];

  const filtered = query
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.handle.toLowerCase().includes(query.toLowerCase())
      )
    : members;

  function toggle(id: string) {
    if (assigneeIds.includes(id)) {
      onChange(assigneeIds.filter((x) => x !== id));
    } else {
      onChange([...assigneeIds, id]);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? <AvatarStack assigned={assigned} />}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        className="w-[280px] overflow-hidden p-0"
      >
        <div className="border-b border-white/[0.06] p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Assign teammates…"
              className="block w-full rounded-md bg-white/[0.04] py-1.5 pl-8 pr-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              No match.
            </p>
          )}
          {filtered.map((m) => {
            const checked = assigneeIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05]",
                  checked && "bg-white/[0.03]"
                )}
              >
                <div className="relative">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.image} alt={m.name} />
                    <AvatarFallback>{m.name[0]}</AvatarFallback>
                  </Avatar>
                  <PresenceDot
                    state={m.presence}
                    size="xs"
                    className="absolute -bottom-0.5 -right-0.5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{m.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {m.title || `@${m.handle}`}
                  </p>
                </div>
                {checked && <Check className="size-3.5 text-violet-300" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AvatarStack({ assigned }: { assigned: Member[] }) {
  if (assigned.length === 0) {
    return (
      <button
        type="button"
        className="grid h-7 w-7 place-items-center rounded-full border border-dashed border-white/15 text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
        aria-label="Assign"
      >
        <Plus className="size-3.5" />
      </button>
    );
  }
  return (
    <button
      type="button"
      className="flex -space-x-1.5 transition-transform hover:scale-105"
      aria-label="Edit assignees"
    >
      {assigned.slice(0, 3).map((m) => (
        <Avatar key={m.id} className="h-7 w-7 ring-2 ring-card">
          <AvatarImage src={m.image} alt={m.name} />
          <AvatarFallback>{m.name[0]}</AvatarFallback>
        </Avatar>
      ))}
      {assigned.length > 3 && (
        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white/[0.08] px-1.5 text-[10px] font-medium text-foreground ring-2 ring-card">
          +{assigned.length - 3}
        </span>
      )}
    </button>
  );
}
