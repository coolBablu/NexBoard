"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Layers,
  CheckCircle2,
  Rocket,
  AlertTriangle,
  X,
  SlidersHorizontal,
} from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { ProjectCard } from "@/components/workspace/project-card";
import { NewProjectDialog } from "@/components/workspace/new-project-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUSES,
  type ProjectIcon,
  type ProjectStatus,
} from "@/lib/schemas/project";

interface ProjectDTO {
  id: string;
  name: string;
  description: string;
  icon: ProjectIcon;
  color: string;
  status: ProjectStatus;
  progress: number;
  starred: boolean;
  members: string[];
}

interface ProjectsResponse {
  workspace: { id: string; name: string; slug: string };
  projects: ProjectDTO[];
}

type Filter = ProjectStatus | "All" | "Starred";

const FILTER_META: Record<Filter, { icon: React.ElementType; tone: string }> = {
  All: { icon: Layers, tone: "text-foreground" },
  Starred: { icon: Star, tone: "text-amber-300" },
  Active: { icon: Rocket, tone: "text-violet-200" },
  Planning: { icon: Layers, tone: "text-cyan-200" },
  Shipped: { icon: CheckCircle2, tone: "text-emerald-200" },
  "At risk": { icon: AlertTriangle, tone: "text-rose-200" },
};

export default function ProjectsPage() {
  const { data, isLoading } = useSWR<ProjectsResponse>("/api/projects");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("All");

  const projects = data?.projects || [];

  const counts = React.useMemo(() => {
    const c: Record<Filter, number> = {
      All: projects.length,
      Starred: projects.filter((p) => p.starred).length,
      Active: 0,
      Planning: 0,
      Shipped: 0,
      "At risk": 0,
    };
    for (const s of PROJECT_STATUSES) c[s] = 0;
    for (const p of projects) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [projects]);

  const filtered = React.useMemo(() => {
    let list = projects;
    if (filter === "Starred") list = list.filter((p) => p.starred);
    else if (filter !== "All") list = list.filter((p) => p.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, filter, query]);

  const stats = React.useMemo(
    () => ({
      total: projects.length,
      active: counts.Active,
      shipped: counts.Shipped,
      atRisk: counts["At risk"],
      avgProgress:
        projects.length === 0
          ? 0
          : Math.round(
              projects.reduce((acc, p) => acc + p.progress, 0) /
                projects.length
            ),
    }),
    [projects, counts]
  );

  async function toggleStar(p: ProjectDTO) {
    mutate(
      "/api/projects",
      (curr: ProjectsResponse | undefined) => {
        if (!curr) return curr;
        return {
          ...curr,
          projects: curr.projects.map((x) =>
            x.id === p.id ? { ...x, starred: !x.starred } : x
          ),
        };
      },
      false
    );
    try {
      const res = await fetch(`/api/projects/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !p.starred }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      toast.success(p.starred ? "Removed from favorites" : "Starred", {
        description: p.name,
      });
    } catch (err) {
      toast.fromError(err, "Could not update star");
    }
    mutate("/api/projects");
  }

  return (
    <AppShell
      title="Projects"
      description="Every project in one focused grid."
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">
            Projects · {data?.workspace.name || "Workspace"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="text-gradient-nova">{stats.total}</span> projects
            in motion
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects"
              className="h-10 w-56 pl-8"
            />
          </div>
          <NewProjectDialog onCreated={() => mutate("/api/projects")} />
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Active" value={stats.active} accent="violet" icon={Rocket} />
        <Kpi
          label="Shipped"
          value={stats.shipped}
          accent="emerald"
          icon={CheckCircle2}
        />
        <Kpi
          label="At risk"
          value={stats.atRisk}
          accent="rose"
          icon={AlertTriangle}
        />
        <Kpi
          label="Avg progress"
          value={`${stats.avgProgress}%`}
          accent="cyan"
          icon={SlidersHorizontal}
        />
      </div>

      {/* ── Filter pills ──────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5 backdrop-blur-xl">
        {(["All", "Starred", ...PROJECT_STATUSES] as Filter[]).map((f) => {
          const Icon = FILTER_META[f].icon;
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="projects-filter-bg"
                  className="absolute inset-0 rounded-lg bg-white/[0.06]"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 size-3.5",
                  active ? FILTER_META[f].tone : ""
                )}
              />
              <span className="relative z-10">{f}</span>
              <span
                className={cn(
                  "relative z-10 rounded-md px-1.5 py-0.5 font-mono text-[9px]",
                  active
                    ? "bg-white/[0.1] text-foreground"
                    : "bg-white/[0.04] text-muted-foreground/70"
                )}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
        {(query || filter !== "All") && (
          <button
            onClick={() => {
              setQuery("");
              setFilter("All");
            }}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" />
            Reset
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          query={query}
          filter={filter}
          onClear={() => {
            setQuery("");
            setFilter("All");
          }}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <ProjectCard
                name={p.name}
                description={p.description || "—"}
                progress={p.progress}
                status={p.status}
                color={p.color}
                members={p.members}
                icon={p.icon}
                starred={p.starred}
                onToggleStar={() => toggleStar(p)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  accent: "violet" | "cyan" | "emerald" | "rose";
  icon: React.ElementType;
}) {
  const tones: Record<typeof accent, string> = {
    violet: "from-indigo-500/[0.05] to-transparent text-indigo-600",
    cyan: "from-sky-500/[0.05] to-transparent text-sky-600",
    emerald: "from-emerald-500/[0.05] to-transparent text-emerald-600",
    rose: "from-rose-500/[0.05] to-transparent text-rose-600",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-xl">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          tones[accent]
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "grid size-8 place-items-center rounded-lg bg-white/[0.05]",
            tones[accent].split(" ").slice(-1)[0]
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  query,
  filter,
  onClear,
}: {
  query: string;
  filter: Filter;
  onClear: () => void;
}) {
  const isFiltered = !!query || filter !== "All";
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] py-16 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-nova-gradient/20 text-violet-200">
        {isFiltered ? <Search className="size-5" /> : <Rocket className="size-5" />}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">
        {isFiltered ? "No projects match those filters" : "Start your first project"}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {isFiltered
          ? "Try a different status, clear the search, or create something new."
          : "Spin up a project to track tasks, ship features, and keep the team in sync."}
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        {isFiltered && (
          <Button variant="ghost" onClick={onClear}>
            <X className="size-3.5" />
            Reset filters
          </Button>
        )}
        <NewProjectDialog onCreated={() => mutate("/api/projects")} />
      </div>
    </div>
  );
}
