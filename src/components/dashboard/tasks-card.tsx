"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  project: string;
  due: string;
  assignee: string;
  priority: "low" | "med" | "high";
  ai?: boolean;
  done?: boolean;
}

const seed: Task[] = [
  {
    id: "t1",
    title: "Ship payments redesign",
    project: "Billing",
    due: "Today",
    assignee: "Maya",
    priority: "high",
    done: true,
  },
  {
    id: "t2",
    title: "Review Q3 OKRs with team",
    project: "Strategy",
    due: "Today",
    assignee: "Sara",
    priority: "high",
    done: true,
  },
  {
    id: "t3",
    title: "Draft Loom recap of sprint review",
    project: "Comms",
    due: "Today",
    assignee: "Nova AI",
    priority: "med",
    ai: true,
  },
  {
    id: "t4",
    title: "Pair on rate-limit retry strategy",
    project: "Platform",
    due: "Tomorrow",
    assignee: "Daniel",
    priority: "med",
  },
  {
    id: "t5",
    title: "Update onboarding analytics doc",
    project: "Growth",
    due: "Thu",
    assignee: "Lucas",
    priority: "low",
  },
];

const priorityMap = {
  high: "bg-rose-500/15 text-rose-200 border-rose-500/20",
  med: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  low: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
} as const;

export function TasksCard() {
  const [tasks, setTasks] = React.useState(seed);

  function toggle(id: string) {
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>My tasks</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.filter((t) => !t.done).length} open · {tasks.filter((t) => t.done).length} done
          </p>
        </div>
        <Button variant="secondary" size="sm">
          <Plus className="size-3.5" />
          Add task
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]",
              t.done && "opacity-60"
            )}
          >
            <button
              onClick={() => toggle(t.id)}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t.done ? "Mark incomplete" : "Mark complete"}
            >
              {t.done ? (
                <CheckCircle2 className="size-5 text-emerald-400" />
              ) : (
                <Circle className="size-5" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "truncate text-sm font-medium text-foreground/90",
                    t.done && "line-through text-muted-foreground"
                  )}
                >
                  {t.title}
                </p>
                {t.ai && (
                  <Badge variant="gradient" className="px-1.5 py-0 text-[10px]">
                    <Sparkles className="size-2.5" />
                    AI
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t.project}</span>
                <span className="text-foreground/30">·</span>
                <span>Due {t.due}</span>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                priorityMap[t.priority]
              )}
            >
              {t.priority}
            </span>
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.assignee}`}
              />
              <AvatarFallback>{t.assignee[0]}</AvatarFallback>
            </Avatar>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
