"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  GitPullRequest,
  GitMerge,
  GitCommit,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  UserPlus,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Item {
  icon: React.ElementType;
  type: string;
  user: string;
  seed: string;
  text: React.ReactNode;
  time: string;
  color: string;
}

const items: Item[] = [
  {
    icon: GitMerge,
    type: "merge",
    user: "Maya",
    seed: "Maya",
    text: (
      <>
        merged{" "}
        <span className="font-mono text-xs text-violet-300">#PR-482</span>{" "}
        Payments redesign
      </>
    ),
    time: "2m",
    color: "text-violet-300 bg-violet-500/12",
  },
  {
    icon: Sparkles,
    type: "ai",
    user: "Nova AI",
    seed: "Nova",
    text: <>summarized 12 docs into a Q4 brief</>,
    time: "8m",
    color: "text-fuchsia-300 bg-fuchsia-500/12",
  },
  {
    icon: CheckCircle2,
    type: "done",
    user: "Daniel",
    seed: "Daniel",
    text: (
      <>
        completed{" "}
        <span className="font-mono text-xs text-emerald-300">PLA-318</span> API
        rate limits
      </>
    ),
    time: "21m",
    color: "text-emerald-300 bg-emerald-500/12",
  },
  {
    icon: GitCommit,
    type: "commit",
    user: "Lucas",
    seed: "Lucas",
    text: (
      <>
        pushed{" "}
        <span className="font-mono text-xs text-cyan-300">3 commits</span> to{" "}
        <span className="font-mono text-xs">main</span>
      </>
    ),
    time: "34m",
    color: "text-cyan-300 bg-cyan-500/12",
  },
  {
    icon: MessageSquare,
    type: "comment",
    user: "Sara",
    seed: "Sara",
    text: <>commented on "Onboarding v3 RFC"</>,
    time: "47m",
    color: "text-fuchsia-300 bg-fuchsia-500/12",
  },
  {
    icon: AlertCircle,
    type: "alert",
    user: "Aisha",
    seed: "Aisha",
    text: (
      <>
        flagged anomaly:{" "}
        <span className="font-mono text-xs text-amber-300">+2.1%</span> churn
      </>
    ),
    time: "1h",
    color: "text-amber-300 bg-amber-500/12",
  },
  {
    icon: UserPlus,
    type: "join",
    user: "Jordan",
    seed: "Jordan",
    text: <>joined the Engineering team</>,
    time: "2h",
    color: "text-blue-300 bg-blue-500/12",
  },
  {
    icon: GitPullRequest,
    type: "pr",
    user: "Maya",
    seed: "Maya",
    text: (
      <>
        opened{" "}
        <span className="font-mono text-xs text-violet-300">#PR-483</span>{" "}
        Onboarding analytics
      </>
    ),
    time: "3h",
    color: "text-violet-300 bg-violet-500/12",
  },
];

export function TeamActivity() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Activity className="size-3" />
            Team activity
          </div>
          <h3 className="mt-1 text-sm font-semibold">Live feed</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live
        </div>
      </div>

      <ScrollArea className="max-h-[480px]">
        <ol className="relative px-4 py-4 sm:px-5">
          {/* spine */}
          <span
            aria-hidden
            className="absolute left-[33px] top-7 bottom-7 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent sm:left-[37px]"
          />

          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.li
                key={i}
                // `animate` (not `whileInView`) — the latter would keep
                // items at opacity:0 if the IntersectionObserver hadn't
                // fired yet, leaving a "tall empty card" until the user
                // scrolled. Always-on fade-in is safer.
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative flex items-start gap-3 py-2.5"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 ring-2 ring-background">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${it.seed}`}
                    />
                    <AvatarFallback>{it.seed[0]}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full ring-2 ring-background ${it.color}`}
                  >
                    <Icon className="size-2.5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs leading-relaxed">
                    <span className="font-medium text-foreground">
                      {it.user}
                    </span>{" "}
                    <span className="text-muted-foreground">{it.text}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                    {it.time} ago
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </ScrollArea>
    </div>
  );
}
