"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { MessageSquare, Paperclip, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { SkeletonKanban } from "@/components/ui/skeleton";
import { AssigneePicker } from "@/components/team/assignee-picker";
import { TaskCommentsDrawer } from "@/components/team/task-comments-drawer";
import {
  TASK_COLUMNS,
  type TaskColumn,
  type TaskPriority,
} from "@/models/Task";

interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  project: string;
  column: TaskColumn;
  priority: TaskPriority;
  tag?: { label: string; color: string } | null;
  assignees: string[];
  aiAssisted: boolean;
  commentsCount: number;
  attachmentsCount: number;
  done: boolean;
  order: number;
}

interface ProjectDTO {
  id: string;
  name: string;
}

const columnMeta: Record<
  TaskColumn,
  { title: string; tone: string }
> = {
  backlog: { title: "Backlog", tone: "border-l-white/30" },
  progress: { title: "In progress", tone: "border-l-violet-400/60" },
  review: { title: "In review", tone: "border-l-cyan-400/60" },
  done: { title: "Shipped", tone: "border-l-emerald-400/60" },
};

const priorityBadge = {
  high: "bg-rose-500/15 text-rose-200 border-rose-500/20",
  med: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  low: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
} as const;

export function KanbanLive({ projects }: { projects: ProjectDTO[] }) {
  const { data, isLoading } = useSWR<{ tasks: TaskDTO[] }>("/api/tasks", {
    refreshInterval: 10_000,
  });
  const tasks = data?.tasks || [];
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null);
  const openTask = React.useMemo(
    () => tasks.find((t) => t.id === openTaskId) || null,
    [tasks, openTaskId]
  );

  async function updateAssignees(taskId: string, ids: string[]) {
    const prevAssignees =
      data?.tasks.find((t) => t.id === taskId)?.assignees ?? [];
    mutate(
      "/api/tasks",
      (curr: { tasks: TaskDTO[] } | undefined) => {
        if (!curr) return curr;
        return {
          tasks: curr.tasks.map((t) =>
            t.id === taskId ? { ...t, assignees: ids } : t
          ),
        };
      },
      false
    );
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignees: ids }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const added = ids.filter((id) => !prevAssignees.includes(id));
      if (added.length === 1) {
        toast.success("Task assigned", {
          description: "Teammate notified in their inbox.",
        });
      } else if (added.length > 1) {
        toast.success(`${added.length} teammates assigned`);
      }
    } catch (err) {
      toast.fromError(err, "Could not update assignees");
      void mutate("/api/tasks");
    }
    void mutate("/api/tasks");
    void mutate("/api/notifications");
  }

  const grouped: Record<TaskColumn, TaskDTO[]> = {
    backlog: [],
    progress: [],
    review: [],
    done: [],
  };
  for (const t of tasks) {
    grouped[t.column]?.push(t);
  }

  async function moveTask(taskId: string, target: TaskColumn) {
    const prevTask = data?.tasks.find((t) => t.id === taskId);
    mutate(
      "/api/tasks",
      (curr: { tasks: TaskDTO[] } | undefined) => {
        if (!curr) return curr;
        return {
          tasks: curr.tasks.map((t) =>
            t.id === taskId
              ? { ...t, column: target, done: target === "done" || t.done }
              : t
          ),
        };
      },
      false
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column: target }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      if (target === "done" && prevTask && prevTask.column !== "done") {
        toast.success("Shipped", {
          description: prevTask.title,
        });
      }
    } catch (err) {
      toast.fromError(err, "Could not move task");
    }
    mutate("/api/tasks");
  }

  async function createTask(
    column: TaskColumn,
    title: string,
    projectId: string
  ) {
    if (!title.trim() || !projectId) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          column,
          projectId,
          priority: "med",
        }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      toast.success("Task created");
    } catch (err) {
      toast.fromError(err, "Could not create task");
    }
    mutate("/api/tasks");
  }

  if (isLoading && tasks.length === 0) {
    return <SkeletonKanban />;
  }

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-max gap-4">
          {TASK_COLUMNS.map((col) => (
            <KanbanColumn
              key={col}
              column={col}
              meta={columnMeta[col]}
              tasks={grouped[col]}
              projects={projects}
              onDropTask={(id) => moveTask(id, col)}
              onAddTask={(title, projectId) => createTask(col, title, projectId)}
              onOpenTask={(id) => setOpenTaskId(id)}
              onChangeAssignees={updateAssignees}
            />
          ))}
        </div>
      </div>
      <TaskCommentsDrawer
        task={openTask}
        onClose={() => setOpenTaskId(null)}
      />
    </>
  );
}

function KanbanColumn({
  column,
  meta,
  tasks,
  projects,
  onDropTask,
  onAddTask,
  onOpenTask,
  onChangeAssignees,
}: {
  column: TaskColumn;
  meta: { title: string; tone: string };
  tasks: TaskDTO[];
  projects: ProjectDTO[];
  onDropTask: (id: string) => void;
  onAddTask: (title: string, projectId: string) => void;
  onOpenTask: (id: string) => void;
  onChangeAssignees: (id: string, ids: string[]) => void;
}) {
  const [over, setOver] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newProject, setNewProject] = React.useState(projects[0]?.id || "");

  React.useEffect(() => {
    if (!newProject && projects[0]) setNewProject(projects[0].id);
  }, [projects, newProject]);

  return (
    <div className="w-80 shrink-0">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const id = e.dataTransfer.getData("text/task-id");
          if (id) onDropTask(id);
        }}
        className={cn(
          "flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl border-l-2 transition-colors",
          meta.tone,
          over && "border-white/30 bg-white/[0.05]"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{meta.title}</h3>
            <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-muted-foreground">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => setAdding((a) => !a)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            aria-label="Add task"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="space-y-2.5 px-3 pb-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={() => onOpenTask(task.id)}
              onChangeAssignees={(ids) => onChangeAssignees(task.id, ids)}
            />
          ))}

          {adding ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddTask(newTitle, newProject);
                setNewTitle("");
                setAdding(false);
              }}
              className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5"
            >
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Task title…"
                className="block w-full bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <select
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-background/60 px-2 py-1 text-xs text-foreground/80 focus:outline-none focus:border-primary/40"
              >
                {projects.length === 0 && (
                  <option value="">No projects — create one first</option>
                )}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1"
                  disabled={!newTitle.trim() || !newProject}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAdding(false);
                    setNewTitle("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/[0.02] hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Add task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onOpen,
  onChangeAssignees,
}: {
  task: TaskDTO;
  onOpen: () => void;
  onChangeAssignees: (ids: string[]) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      draggable
      onDragStart={(e) => {
        (e as unknown as DragEvent).dataTransfer?.setData(
          "text/task-id",
          task.id
        );
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-prevent-open]")) return;
        onOpen();
      }}
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

      {task.aiAssisted && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-200">
          <Sparkles className="size-3" />
          AI-assisted
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span
            className={cn(
              "rounded-full border px-1.5 py-0 text-[9px] font-medium uppercase tracking-wider",
              priorityBadge[task.priority]
            )}
          >
            {task.priority}
          </span>
          {task.commentsCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" />
              {task.commentsCount}
            </span>
          )}
          {task.attachmentsCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3" />
              {task.attachmentsCount}
            </span>
          )}
        </div>
        <div data-prevent-open>
          <AssigneePicker
            assigneeIds={task.assignees}
            onChange={onChangeAssignees}
            align="end"
          />
        </div>
      </div>
    </motion.div>
  );
}
