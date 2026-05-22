"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  GitPullRequest,
  MessageSquare,
  Sparkles,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const items = [
  {
    icon: GitPullRequest,
    color: "text-violet-300 bg-violet-500/10",
    user: "Maya",
    seed: "Maya",
    text: "merged PR #482 · payments redesign",
    time: "2m",
  },
  {
    icon: Sparkles,
    color: "text-cyan-300 bg-cyan-500/10",
    user: "Nova AI",
    seed: "Nova",
    text: "summarized 12 docs into a Q4 brief",
    time: "8m",
  },
  {
    icon: CheckCircle2,
    color: "text-emerald-300 bg-emerald-500/10",
    user: "Daniel",
    seed: "Daniel",
    text: "completed task · API rate limits",
    time: "21m",
  },
  {
    icon: MessageSquare,
    color: "text-fuchsia-300 bg-fuchsia-500/10",
    user: "Sara",
    seed: "Sara",
    text: "commented on 'Onboarding v3'",
    time: "47m",
  },
  {
    icon: UserPlus,
    color: "text-blue-300 bg-blue-500/10",
    user: "Jordan",
    seed: "Jordan",
    text: "joined the Engineering team",
    time: "1h",
  },
  {
    icon: AlertCircle,
    color: "text-amber-300 bg-amber-500/10",
    user: "Aisha",
    seed: "Aisha",
    text: "flagged anomaly in revenue dashboard",
    time: "2h",
  },
  {
    icon: GitPullRequest,
    color: "text-violet-300 bg-violet-500/10",
    user: "Lucas",
    seed: "Lucas",
    text: "opened PR #483 · onboarding analytics",
    time: "3h",
  },
];

export function ActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[420px] px-6 pb-6">
          <ol className="relative space-y-4 border-l border-white/[0.06] pl-6">
            {items.map((it, i) => {
              const Icon = it.icon;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <span
                    className={
                      "absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full ring-4 ring-background " +
                      it.color
                    }
                  >
                    <Icon className="size-3" />
                  </span>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${it.seed}`}
                      />
                      <AvatarFallback>{it.seed[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">
                          {it.user}
                        </span>{" "}
                        <span className="text-muted-foreground">{it.text}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        {it.time} ago
                      </p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
