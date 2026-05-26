"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Search,
  Upload,
  Download,
  Trash2,
  File as FileIcon,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Loader2,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type FilterType = "all" | "image" | "doc" | "video" | "audio";

interface FileItem {
  id: string;
  name: string;
  mime: string;
  size: number;
  url: string;
  downloadUrl: string;
  createdAt: string;
  uploader: {
    id: string;
    name: string;
    email: string;
    image: string;
  } | null;
}

export default function FilesPage() {
  return (
    <AppShell title="Files" description="Shared docs, images, and assets.">
      <FilesBody />
    </AppShell>
  );
}

function FilesBody() {
  const [type, setType] = React.useState<FilterType>("all");
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const key = `/api/files${type === "all" ? "" : `?type=${type}`}`;
  const { data, isLoading } = useSWR<{ total: number; files: FileItem[] }>(key);

  const files = React.useMemo(() => {
    const all = data?.files ?? [];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((f) => f.name.toLowerCase().includes(q));
  }, [data, query]);

  async function uploadSelected(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    let okCount = 0;
    for (const file of Array.from(list)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) {
          toast.error(`${file.name} failed`, { description: json.error });
          continue;
        }
        okCount += 1;
      } catch (err) {
        toast.fromError(err, `${file.name} failed`);
      }
    }
    setUploading(false);
    if (okCount > 0) {
      toast.success(
        `Uploaded ${okCount} file${okCount === 1 ? "" : "s"}`,
        { description: "Shared with your workspace." }
      );
      void mutate((k) => typeof k === "string" && k.startsWith("/api/files"));
    }
  }

  async function remove(file: FileItem) {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Couldn't delete", { description: json.error });
      return;
    }
    toast.success("File deleted");
    void mutate((k) => typeof k === "string" && k.startsWith("/api/files"));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">
            Workspace · {data?.total ?? 0} file{(data?.total ?? 0) === 1 ? "" : "s"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Files &amp; docs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop any file up to 10 MB — your team can preview, download, and reference it from chat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files"
              className="h-10 w-56 pl-8"
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              void uploadSelected(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            Upload
          </Button>
        </div>
      </div>

      <Tabs value={type} onValueChange={(v) => setType(v as FilterType)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="doc">Docs</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>

        <TabsContent value={type} className="mt-6">
          {isLoading ? (
            <FileGridSkeleton />
          ) : files.length === 0 ? (
            <EmptyState
              query={query}
              onUpload={() => inputRef.current?.click()}
            />
          ) : (
            <FileGrid
              files={files}
              currentUserId={currentUserId}
              userRole={userRole}
              onDelete={remove}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FileGrid({
  files,
  currentUserId,
  userRole,
  onDelete,
}: {
  files: FileItem[];
  currentUserId: string | undefined;
  userRole: string | undefined;
  onDelete: (f: FileItem) => void;
}) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence initial={false}>
        {files.map((f) => (
          <FileCard
            key={f.id}
            file={f}
            canDelete={
              f.uploader?.id === currentUserId || userRole === "super_admin"
            }
            onDelete={() => onDelete(f)}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function FileCard({
  file,
  canDelete,
  onDelete,
}: {
  file: FileItem;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const isImage = file.mime.startsWith("image/");
  const Icon = iconFor(file.mime);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-white/[0.14]"
    >
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-[16/10] bg-foreground/[0.04]"
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Icon className="size-10" />
          </div>
        )}
      </a>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={file.name}>
            {file.name}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {file.mime.split("/")[0]} · {formatBytes(file.size)}
          </p>
          {file.uploader && (
            <div className="mt-2 flex items-center gap-1.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={file.uploader.image} alt={file.uploader.name} />
                <AvatarFallback className="text-[9px]">
                  {file.uploader.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-[10px] text-muted-foreground">
                {file.uploader.name} ·{" "}
                <time
                  suppressHydrationWarning
                  dateTime={file.createdAt}
                  title={new Date(file.createdAt).toLocaleString()}
                >
                  {formatRel(file.createdAt)}
                </time>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <a
            href={file.downloadUrl}
            download={file.name}
            title="Download"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <Download className="size-3.5" />
          </a>
          {canDelete && (
            <button
              onClick={onDelete}
              title="Delete"
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function FileGridSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]"
        >
          <div className="aspect-[16/10] bg-foreground/[0.06]" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 rounded bg-foreground/[0.06]" />
            <div className="h-2.5 w-1/2 rounded bg-foreground/[0.06]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  query,
  onUpload,
}: {
  query: string;
  onUpload: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] py-16 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-nova-gradient/20 text-violet-700 dark:text-violet-200">
        <FileIcon className="size-6" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">
        {query ? "No files match your search." : "No files shared yet."}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {query
          ? "Try a different name or clear the search."
          : "Drop a file here or upload to make it available to your whole team."}
      </p>
      {!query && (
        <Button className="mt-4" onClick={onUpload}>
          <Upload className="size-3.5" />
          Upload your first file
        </Button>
      )}
    </div>
  );
}

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.includes("zip") || mime.includes("compressed")) return FileArchive;
  if (
    mime.includes("pdf") ||
    mime.startsWith("text/") ||
    mime.includes("json") ||
    mime.includes("xml") ||
    mime.includes("word") ||
    mime.includes("sheet") ||
    mime.includes("document")
  )
    return FileText;
  return FileIcon;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
