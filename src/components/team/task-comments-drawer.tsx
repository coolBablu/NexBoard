"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  X,
  MessageSquare,
  Send,
  Loader2,
  Tag,
  Flag,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MentionInput, MentionedText } from "@/components/team/mention-input";
import { AssigneePicker } from "@/components/team/assignee-picker";
import {
  FileAttachmentButton,
  AttachmentPill,
  AttachmentList,
  type AttachmentDraft,
} from "@/components/team/file-attachment";
import { SkeletonChat } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { TaskColumn, TaskPriority } from "@/models/Task";

interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  project: string;
  column: TaskColumn;
  priority: TaskPriority;
  assignees: string[];
  done: boolean;
  aiAssisted: boolean;
}

interface CommentDTO {
  id: string;
  body: string;
  mentions: string[];
  attachments: AttachmentDraft[];
  createdAt: string;
  author: { id: string; name: string; handle: string; image: string | null };
}

interface Member {
  id: string;
  name: string;
  handle: string;
  image: string;
  presence: "online" | "away" | "offline";
}

const COLUMN_LABEL: Record<TaskColumn, string> = {
  backlog: "Backlog",
  progress: "In progress",
  review: "In review",
  done: "Shipped",
};

const PRIORITY_TONE: Record<TaskPriority, string> = {
  high: "bg-rose-500/15 text-rose-200 border-rose-500/20",
  med: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  low: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
};

interface TaskCommentsDrawerProps {
  task: TaskDTO | null;
  onClose: () => void;
  onTaskUpdated?: (task: TaskDTO) => void;
}

/**
 * Side drawer that opens when a kanban card is clicked.
 *
 *   · Top half: task meta (title, project, assignees, priority, tag).
 *   · Bottom half: full threaded comment list with mentions + attachments.
 *   · All mutations are optimistic; SWR re-validates after each API write.
 */
export function TaskCommentsDrawer({ task, onClose, onTaskUpdated }: TaskCommentsDrawerProps) {
  const open = !!task;
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const commentsKey = task ? `/api/tasks/${task.id}/comments` : null;
  const { data, isLoading } = useSWR<{ comments: CommentDTO[] }>(commentsKey, {
    refreshInterval: 8_000,
  });
  const comments = data?.comments ?? [];

  const { data: membersData } = useSWR<{ members: Member[] }>("/api/members");
  const members = membersData?.members ?? [];

  const [draft, setDraft] = React.useState("");
  const [attachments, setAttachments] = React.useState<AttachmentDraft[]>([]);
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (task) {
      setDraft("");
      setAttachments([]);
    }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [comments.length, sending]);

  async function send() {
    if (!task) return;
    const trimmed = draft.trim();
    if (!trimmed && attachments.length === 0) return;
    setSending(true);

    // Optimistic
    const optimistic: CommentDTO = {
      id: `temp-${Date.now()}`,
      body: trimmed,
      mentions: [],
      attachments,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUserId || "",
        name: session?.user?.name || "You",
        handle: "you",
        image: session?.user?.image || null,
      },
    };
    mutate(
      commentsKey!,
      (curr: { comments?: CommentDTO[] } | undefined) =>
        curr
          ? { ...curr, comments: [...(curr.comments || []), optimistic] }
          : { comments: [optimistic] },
      false
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, attachments }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setDraft("");
      setAttachments([]);
      if (trimmed.includes("@")) {
        toast.success("Comment posted", {
          description: "Mentioned teammates were notified.",
        });
      }
    } catch (err) {
      toast.fromError(err, "Comment failed to send");
      setDraft(trimmed);
      setAttachments(optimistic.attachments);
    } finally {
      setSending(false);
    }
    void mutate(commentsKey!);
    void mutate("/api/tasks");
    void mutate("/api/activities");
    void mutate("/api/notifications");
  }

  async function updateAssignees(ids: string[]) {
    if (!task) return;
    onTaskUpdated?.({ ...task, assignees: ids });
    // Optimistic for kanban list cache
    mutate(
      "/api/tasks",
      (curr: { tasks?: TaskDTO[] } | undefined) =>
        curr
          ? {
              tasks: (curr.tasks || []).map((t) =>
                t.id === task.id ? { ...t, assignees: ids } : t
              ),
            }
          : curr,
      false
    );
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignees: ids }),
    });
    void mutate("/api/tasks");
    void mutate("/api/notifications");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogContent
          hideCloseButton
          className="left-auto right-0 top-0 h-screen max-w-none translate-x-0 translate-y-0 rounded-none border-l border-l-white/[0.08] sm:max-w-[560px]"
        >
          <AnimatePresence mode="wait">
            {task && (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="flex h-full flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-white/[0.06] px-1 pb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Task · {COLUMN_LABEL[task.column]}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold leading-tight">
                      {task.title}
                    </h2>
                    {task.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-white/[0.06] px-1 py-4 text-sm">
                  <MetaRow icon={<Flag className="size-3.5" />} label="Priority">
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        PRIORITY_TONE[task.priority]
                      )}
                    >
                      {task.priority}
                    </span>
                  </MetaRow>
                  <MetaRow icon={<Tag className="size-3.5" />} label="Status">
                    <Badge variant="outline">{COLUMN_LABEL[task.column]}</Badge>
                  </MetaRow>
                  <MetaRow
                    icon={<MessageSquare className="size-3.5" />}
                    label="Comments"
                  >
                    <span className="text-foreground/80">{comments.length}</span>
                  </MetaRow>
                  <MetaRow
                    icon={<Sparkles className="size-3.5" />}
                    label="AI"
                    full={task.aiAssisted}
                  >
                    {task.aiAssisted ? (
                      <span className="text-violet-300">AI-assisted</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </MetaRow>
                  <div className="col-span-2 flex items-center justify-between border-t border-white/[0.04] pt-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <span className="text-violet-300">●</span> Assignees
                    </span>
                    <AssigneePicker
                      assigneeIds={task.assignees}
                      onChange={updateAssignees}
                      align="end"
                    />
                  </div>
                </div>

                {/* Comments */}
                <div className="flex min-h-0 flex-1 flex-col">
                  <div
                    ref={scrollRef}
                    className="flex-1 space-y-4 overflow-y-auto px-1 py-4"
                  >
                    {isLoading && comments.length === 0 ? (
                      <SkeletonChat rows={3} />
                    ) : comments.length === 0 ? (
                      <EmptyComments />
                    ) : (
                      <AnimatePresence initial={false}>
                        {comments.map((c) => (
                          <CommentRow
                            key={c.id}
                            comment={c}
                            currentUserId={currentUserId}
                            members={members}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Composer */}
                  <div className="border-t border-white/[0.06] px-1 pt-3">
                    <MentionInput
                      value={draft}
                      onChange={setDraft}
                      onSubmit={send}
                      placeholder="Comment… use @ to mention"
                      rows={3}
                    />
                    {attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <AnimatePresence>
                          {attachments.map((a, i) => (
                            <AttachmentPill
                              key={a.name + i}
                              att={a}
                              onRemove={() =>
                                setAttachments(attachments.filter((_, j) => j !== i))
                              }
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <FileAttachmentButton
                        attachments={attachments}
                        onChange={setAttachments}
                      />
                      <Button
                        size="sm"
                        onClick={send}
                        disabled={
                          sending || (!draft.trim() && attachments.length === 0)
                        }
                      >
                        {sending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function MetaRow({
  icon,
  label,
  children,
  full,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", full && "col-span-2")}>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="text-xs">{children}</div>
    </div>
  );
}

function CommentRow({
  comment,
  currentUserId,
  members,
}: {
  comment: CommentDTO;
  currentUserId?: string | null;
  members: Member[];
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={comment.author.image || undefined} alt={comment.author.name} />
        <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-semibold leading-tight">
            {comment.author.name}
          </p>
          <span className="text-[10px] text-muted-foreground">@{comment.author.handle}</span>
          <span className="text-[10px] text-muted-foreground/70">
            · {formatTime(comment.createdAt)}
          </span>
        </div>
        <div className="mt-0.5 text-sm">
          <MentionedText
            text={comment.body}
            currentUserId={currentUserId}
            members={members}
          />
        </div>
        {comment.attachments && comment.attachments.length > 0 && (
          <AttachmentList items={comment.attachments} />
        )}
      </div>
    </motion.div>
  );
}

function EmptyComments() {
  return (
    <div className="grid place-items-center px-4 py-8 text-center">
      <div className="grid size-10 place-items-center rounded-2xl bg-white/[0.04] text-violet-200">
        <AlertCircle className="size-4" />
      </div>
      <p className="mt-3 text-sm font-medium">No comments yet</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Be the first to share context.
      </p>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  if (h < 48) return "yesterday";
  return d.toLocaleDateString();
}
