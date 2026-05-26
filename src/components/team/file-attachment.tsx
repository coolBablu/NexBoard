"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Paperclip,
  X,
  FileText,
  ImageIcon,
  FileVideo,
  FileAudio,
  FileArchive,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttachmentDraft {
  name: string;
  mime: string;
  size: number;
  url: string;
}

interface FileAttachmentButtonProps {
  attachments: AttachmentDraft[];
  onChange: (next: AttachmentDraft[]) => void;
  max?: number;
  maxBytes?: number;
  className?: string;
  /** Linkage so the file shows up under the right channel on /files. */
  channelId?: string;
}

const MAX_BYTES_DEFAULT = 10 * 1024 * 1024; // 10 MB — server enforces too

/** POST a single File to /api/upload; returns the attachment draft. */
async function uploadFile(
  file: File,
  channelId?: string
): Promise<AttachmentDraft> {
  const fd = new FormData();
  fd.append("file", file);
  if (channelId) fd.append("channelId", channelId);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return {
    name: data.name,
    mime: data.mime,
    size: data.size,
    url: data.url,
  };
}

export function FileAttachmentButton({
  attachments,
  onChange,
  max = 4,
  maxBytes = MAX_BYTES_DEFAULT,
  className,
  channelId,
}: FileAttachmentButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function pick(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    const next = [...attachments];
    for (const file of Array.from(files)) {
      if (next.length >= max) break;
      if (file.size > maxBytes) {
        // Surface skipped-file feedback if a toast helper is available.
        // We fall back to a silent skip to avoid hard-coding a toast dep.
        try {
          const { toast } = await import("@/lib/toast");
          toast.error(`${file.name} skipped`, {
            description: `Max ${Math.round(maxBytes / (1024 * 1024))} MB per file.`,
          });
        } catch {
          /* noop */
        }
        continue;
      }
      try {
        const draft = await uploadFile(file, channelId);
        next.push(draft);
      } catch (err) {
        try {
          const { toast } = await import("@/lib/toast");
          toast.fromError(err, `Couldn't upload ${file.name}`);
        } catch {
          /* noop */
        }
      }
    }
    onChange(next);
    setBusy(false);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy || attachments.length >= max}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:opacity-50",
          className
        )}
      >
        <Paperclip className="size-3.5" />
        Attach
        {attachments.length > 0 && (
          <span className="text-violet-300">· {attachments.length}/{max}</span>
        )}
      </button>
    </>
  );
}

interface AttachmentPillProps {
  att: AttachmentDraft;
  onRemove?: () => void;
}

export function AttachmentPill({ att, onRemove }: AttachmentPillProps) {
  const Icon = iconFor(att.mime);
  const isImage = att.mime.startsWith("image/");
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="group inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[11px]"
    >
      {isImage ? (
        // Data-URL preview from the user's local file picker — `next/image`
        // can't optimize data URIs, so a plain <img> is correct here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={att.url}
          alt={att.name}
          loading="lazy"
          decoding="async"
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 rounded object-cover"
        />
      ) : (
        <Icon className="size-3.5 shrink-0 text-violet-300" />
      )}
      <span className="max-w-[120px] truncate font-medium">{att.name}</span>
      <span className="text-muted-foreground">{formatBytes(att.size)}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="grid size-4 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-rose-300"
          aria-label="Remove attachment"
        >
          <X className="size-3" />
        </button>
      )}
    </motion.span>
  );
}

/** Read-only attachment grid (used inside chat / comment threads). */
export function AttachmentList({
  items,
}: {
  items: AttachmentDraft[];
}) {
  if (!items.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((a, i) => {
        const Icon = iconFor(a.mime);
        const isImage = a.mime.startsWith("image/");
        return (
          <a
            key={a.name + i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1.5 text-xs transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
          >
            {isImage ? (
              // Data URL — plain <img> on purpose (see note above).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.url}
                alt={a.name}
                loading="lazy"
                decoding="async"
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-white/[0.04] text-violet-300">
                <Icon className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="line-clamp-1 max-w-[160px] font-medium">{a.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {a.mime.split("/")[0]} · {formatBytes(a.size)}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.includes("zip") || mime.includes("compressed")) return FileArchive;
  if (mime.startsWith("text/") || mime.includes("json") || mime.includes("xml"))
    return FileText;
  return FileIcon;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
