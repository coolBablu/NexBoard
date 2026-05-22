"use client";

import { motion } from "framer-motion";
import { Star, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { projectIconMap } from "@/lib/project-icons";
import type { ProjectIcon, ProjectStatus } from "@/models/Project";

interface ProjectCardProps {
  name: string;
  description: string;
  progress: number;
  status: ProjectStatus;
  color: string;
  members: string[];
  icon: ProjectIcon;
  starred?: boolean;
  onToggleStar?: () => void;
}

const statusMap: Record<ProjectStatus, string> = {
  Active: "bg-violet-500/15 text-violet-200 border-violet-500/25",
  Planning: "bg-cyan-500/15 text-cyan-200 border-cyan-500/25",
  Shipped: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
  "At risk": "bg-amber-500/15 text-amber-200 border-amber-500/25",
};

export function ProjectCard({
  name,
  description,
  progress,
  status,
  color,
  members,
  icon,
  starred,
  onToggleStar,
}: ProjectCardProps) {
  const Icon = projectIconMap[icon] || projectIconMap.folder;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <Card className="group h-full overflow-hidden transition-colors hover:border-white/[0.12]">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between">
            <div
              className={
                "grid h-11 w-11 place-items-center rounded-xl shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] " +
                color
              }
            >
              <Icon className="size-5 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleStar}
                className={
                  "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-amber-300 " +
                  (starred ? "text-amber-300" : "")
                }
                aria-label="Star"
              >
                <Star className={"size-4 " + (starred ? "fill-current" : "")} />
              </button>
              <button
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                aria-label="More"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <h3 className="mt-4 truncate text-base font-semibold">{name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex -space-x-2">
              {members.slice(0, 4).map((m, i) => (
                <Avatar key={m + i} className="h-7 w-7 ring-2 ring-background">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m}`}
                  />
                  <AvatarFallback>{m[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
              {members.length > 4 && (
                <div className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-[10px] font-medium ring-2 ring-background">
                  +{members.length - 4}
                </div>
              )}
            </div>
            <Badge variant="outline" className={statusMap[status]}>
              {status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
