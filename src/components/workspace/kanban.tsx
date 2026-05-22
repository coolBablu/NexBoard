"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Paperclip,
  Plus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KanbanTask {
  id: string;
  title: string;
  tag?: { label: string; color: string };
  comments?: number;
  attachments?: number;
  assignees: string[];
  ai?: boolean;
  priority?: "low" | "med" | "high";
}

interface KanbanColumn {
  id: string;
  title: string;
  badge: string;
  tone: string;
  tasks: KanbanTask[];
}

const columns: KanbanColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    badge: "8",
    tone: "border-l-white/30",
    tasks: [
      {
        id: "k1",
        title: "Audit empty states across product",
        tag: { label: "Design", color: "bg-fuchsia-500/15 text-fuchsia-200" },
        comments: 3,
        attachments: 2,
        assignees: ["Maya", "Lucas"],
        priority: "med",
      },
      {
        id: "k2",
        title: "Outline pricing experiment",
        tag: { label: "Growth", color: "bg-cyan-500/15 text-cyan-200" },
        comments: 1,
        assignees: ["Aisha"],
        priority: "low",
      },
      {
        id: "k3",
        title: "Spec audit log export endpoint",
        tag: { label: "Backend", color: "bg-violet-500/15 text-violet-200" },
        comments: 4,
        assignees: ["Daniel"],
        priority: "med",
      },
    ],
  },
  {
    id: "progress",
    title: "In progress",
    badge: "5",
    tone: "border-l-violet-400/60",
    tasks: [
      {
        id: "k4",
        title: "Payments redesign · phase 2",
        tag: { label: "Design", color: "bg-fuchsia-500/15 text-fuchsia-200" },
        comments: 7,
        attachments: 5,
        assignees: ["Maya", "Sara"],
        priority: "high",
      },
      {
        id: "k5",
        title: "Nova AI: streaming responses",
        tag: { label: "AI", color: "bg-amber-500/15 text-amber-200" },
        comments: 2,
        assignees: ["Jordan"],
        ai: true,
        priority: "high",
      },
      {
        id: "k6",
        title: "Onboarding analytics dashboard",
        tag: { label: "Data", color: "bg-emerald-500/15 text-emerald-200" },
        comments: 5,
        attachments: 1,
        assignees: ["Lucas", "Aisha"],
        priority: "med",
      },
    ],
  },
  {
    id: "review",
    title: "In review",
    badge: "3",
    tone: "border-l-cyan-400/60",
    tasks: [
      {
        id: "k7",
        title: "SSO with Okta + Azure AD",
        tag: { label: "Security", color: "bg-blue-500/15 text-blue-200" },
        comments: 4,
        assignees: ["Daniel", "Sara"],
        priority: "high",
      },
      {
        id: "k8",
        title: "Refactor activity feed query",
        tag: { label: "Backend", color: "bg-violet-500/15 text-violet-200" },
        comments: 2,
        assignees: ["Jordan"],
        priority: "low",
      },
    ],
  },
  {
    id: "done",
    title: "Shipped",
    badge: "12",
    tone: "border-l-emerald-400/60",
    tasks: [
      {
        id: "k9",
        title: "Real-time multiplayer cursors",
        tag: { label: "Platform", color: "bg-fuchsia-500/15 text-fuchsia-200" },
        comments: 9,
        assignees: ["Jordan", "Maya", "Daniel"],
        priority: "high",
      },
      {
        id: "k10",
        title: "Slack 2-way sync",
        tag: { label: "Integrations", color: "bg-cyan-500/15 text-cyan-200" },
        comments: 6,
        assignees: ["Lucas"],
        priority: "med",
      },
    ],
  },
];

export function Kanban() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-max gap-4">
        {columns.map((col) => (
          <div key={col.id} className="w-80 shrink-0">
            <div
              className={cn(
                "flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl border-l-2",
                col.tone
              )}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-muted-foreground">
                    {col.badge}
                  </span>
                </div>
                <button
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                  aria-label="Add task"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <div className="space-y-2.5 px-3 pb-3">
                {col.tasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -2 }}
                    className="group cursor-pointer rounded-xl border border-white/[0.06] bg-card/60 p-3.5 backdrop-blur-xl transition-colors hover:border-white/[0.14] hover:bg-card/80"
                  >
                    {task.tag && (
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium",
                          task.tag.color
                        )}
                      >
                        {task.tag.label}
                      </span>
                    )}
                    <p className="mt-2 text-sm font-medium leading-snug text-foreground/90">
                      {task.title}
                    </p>

                    {task.ai && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-nova-gradient/20 px-1.5 py-0.5 text-[10px] text-violet-200">
                        <Sparkles className="size-3" />
                        AI-assisted
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {task.comments != null && (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            {task.comments}
                          </span>
                        )}
                        {task.attachments != null && (
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="size-3" />
                            {task.attachments}
                          </span>
                        )}
                      </div>
                      <div className="flex -space-x-1.5">
                        {task.assignees.map((a) => (
                          <Avatar
                            key={a}
                            className="h-6 w-6 ring-2 ring-card"
                          >
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${a}`}
                            />
                            <AvatarFallback>{a[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <button className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/[0.02] hover:text-foreground">
                  <Plus className="size-3.5" />
                  Add task
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
