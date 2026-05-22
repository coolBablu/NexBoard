"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { Filter, Search } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { ProjectCard } from "@/components/workspace/project-card";
import { KanbanLive } from "@/components/workspace/kanban-live";
import { TeamMembers } from "@/components/workspace/team-members";
import { NewProjectDialog } from "@/components/workspace/new-project-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import type { ProjectIcon, ProjectStatus } from "@/models/Project";

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

export default function WorkspacePage() {
  const { data, isLoading } = useSWR<ProjectsResponse>("/api/projects");
  const [query, setQuery] = React.useState("");

  const projects = data?.projects || [];
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
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
      mutate("/api/projects");
    }
    mutate("/api/projects");
  }

  return (
    <AppShell title="Workspace" description="All your team's work, in one place.">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">
            Workspace · {data?.workspace.name || "Loading…"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Build, ship, and{" "}
            <span className="text-gradient-nova">tell the story</span>.
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
          <Button variant="secondary" size="default">
            <Filter className="size-3.5" />
            Filter
          </Button>
          <NewProjectDialog onCreated={() => mutate("/api/projects")} />
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            query ? (
              <NoSearchResults query={query} onClear={() => setQuery("")} />
            ) : (
              <EmptyProjects />
            )
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
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
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="board" className="mt-6">
          <KanbanLive
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <TeamMembers />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function EmptyProjects() {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] py-16 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Filter className="size-5 text-violet-300" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">
        No projects yet
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Create your first project to start tracking work on the board.
      </p>
      <div className="mt-6">
        <NewProjectDialog onCreated={() => mutate("/api/projects")} />
      </div>
    </div>
  );
}

function NoSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] py-12 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Search className="size-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">
        No results for &ldquo;{query}&rdquo;
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
        Try a different query or clear the filter.
      </p>
      <Button variant="ghost" className="mt-4" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}
