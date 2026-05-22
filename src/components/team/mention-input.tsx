"use client";

import * as React from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  handle: string;
  image: string;
  presence: "online" | "away" | "offline";
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  /** Render markdown-like @handles as styled spans inside the value. */
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Textarea with `@username` autocomplete.
 *
 *   · Listens for `@` after whitespace / line start.
 *   · Pulls candidate members from /api/members.
 *   · ↑/↓ to navigate, Tab/Enter to insert, Esc to close.
 *   · Enter without the dropdown open submits (calls `onSubmit`).
 *   · `@` characters elsewhere are kept verbatim.
 */
export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  rows = 2,
  disabled,
  autoFocus,
}: MentionInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);
  const [anchorIdx, setAnchorIdx] = React.useState<number | null>(null);

  const { data } = useSWR<{ members: Member[] }>(
    active ? `/api/members?q=${encodeURIComponent(query)}` : null,
    { dedupingInterval: 5_000, revalidateOnFocus: false }
  );
  const candidates = (data?.members ?? []).slice(0, 6);

  // Auto-resize the textarea like Slack / Linear.
  React.useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    onChange(next);

    const caret = e.target.selectionStart;
    // Find an `@token` immediately before the caret with no whitespace.
    const before = next.slice(0, caret);
    const match = /(^|\s)@([a-z0-9_-]*)$/i.exec(before);
    if (match) {
      const startOfAt = caret - match[2].length - 1;
      setActive(true);
      setQuery(match[2]);
      setAnchorIdx(startOfAt);
      setHighlight(0);
    } else {
      setActive(false);
      setAnchorIdx(null);
    }
  }

  function insertMention(member: Member) {
    if (anchorIdx == null) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart;
    const before = value.slice(0, anchorIdx);
    const after = value.slice(caret);
    const inserted = `@${member.handle} `;
    const next = before + inserted + after;
    onChange(next);
    setActive(false);
    setAnchorIdx(null);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = before.length + inserted.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (active && candidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % candidates.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(candidates[highlight]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setActive(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !active) {
      e.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "block w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-60",
          className
        )}
      />

      <AnimatePresence>
        {active && candidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 z-30 mb-1 w-[min(320px,100%)] overflow-hidden rounded-xl border border-white/10 bg-background/95 shadow-2xl backdrop-blur-2xl"
          >
            <div className="border-b border-white/[0.05] bg-white/[0.02] px-3 py-1.5">
              <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <AtSign className="size-3" />
                Mention a teammate
              </p>
            </div>
            <ul className="py-1">
              {candidates.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(m);
                    }}
                    onMouseEnter={() => setHighlight(i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors",
                      highlight === i && "bg-white/[0.05]"
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={m.image} alt={m.name} />
                      <AvatarFallback>{m.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        @{m.handle}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        m.presence === "online"
                          ? "bg-emerald-400"
                          : m.presence === "away"
                          ? "bg-amber-400"
                          : "bg-zinc-500"
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Renders message text with `@handle` tokens highlighted, and links
 * mention pills to the matching member (if provided).
 */
export function MentionedText({
  text,
  currentUserId,
  members,
}: {
  text: string;
  currentUserId?: string | null;
  members?: Member[];
}) {
  const parts: React.ReactNode[] = [];
  const re = /@([a-z0-9_-]+)/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const handle = match[1].toLowerCase();
    const member = members?.find((m) => m.handle === handle);
    const isMe = member && currentUserId && member.id === currentUserId;
    parts.push(
      <span
        key={`m-${match.index}`}
        className={cn(
          "rounded px-1 font-medium",
          isMe
            ? "bg-violet-500/25 text-violet-100"
            : "text-violet-300 hover:bg-violet-500/10"
        )}
      >
        @{handle}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return (
    <span className="whitespace-pre-wrap leading-relaxed">{parts}</span>
  );
}
