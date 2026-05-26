"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/app/app-shell";
import { TeamChat } from "@/components/team/team-chat";
import { ActivityTimeline } from "@/components/team/activity-timeline";

/**
 * Team collaboration hub.
 *
 *   · "Chat" — channels + active channel + member presence
 *   · "Activity" — workspace-wide animated activity timeline
 *
 * The tabs are intentionally lightweight so we can ship more views
 * (Files, Pinned, Decisions) later without restructuring.
 */
export default function TeamPage() {
  const searchParams = useSearchParams();
  const initialChannelId = searchParams.get("channel") || undefined;

  return (
    <AppShell
      title="Team"
      description="Chat, presence, activity — your team's pulse."
    >
      <Tabs defaultValue="chat" className="w-full">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <TeamChat initialChannelId={initialChannelId} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <ActivityTimeline />
            <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                What you&apos;ll see here
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1 rounded-full bg-violet-400" />
                  Every task created, moved, or completed.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1 rounded-full bg-cyan-400" />
                  New comments, with mentions surfaced in your bell.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1 rounded-full bg-emerald-400" />
                  Projects spinning up, members joining, AI summaries.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1 rounded-full bg-rose-400" />
                  Anomalies — when something looks off, Nova flags it here.
                </li>
              </ul>
              <p className="mt-4 text-[11px] text-muted-foreground/80">
                Updates poll every 15 s with smooth slide-in animations.
              </p>
            </aside>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
