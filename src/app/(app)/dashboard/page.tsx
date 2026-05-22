"use client";

import {
  DollarSign,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";
import { AppShell, useAppShell } from "@/components/app/app-shell";
import { GreetingHero } from "@/components/dashboard/greeting-hero";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { ProductivityChart } from "@/components/dashboard/productivity-chart";
import { AIInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { TeamActivity } from "@/components/dashboard/team-activity";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" description="Your team's pulse, in real-time.">
      <DashboardBody />
    </AppShell>
  );
}

function DashboardBody() {
  const { openPalette } = useAppShell();

  return (
    <div className="space-y-6">
      <GreetingHero onOpenPalette={openPalette} />

      {/* Hero metric tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Annual revenue"
          value={2843900}
          prefix="$"
          delta={18.2}
          icon={DollarSign}
          accent="violet"
          formatter={(n) =>
            n >= 1_000_000
              ? `${(n / 1_000_000).toFixed(2)}M`
              : Math.round(n).toLocaleString()
          }
          spark={[20, 22, 18, 26, 30, 28, 35, 32, 38, 42, 40, 48, 52, 50, 58, 62, 60, 68, 72, 78]}
        />
        <MetricTile
          label="Active users"
          value={12481}
          delta={6.4}
          icon={Users}
          accent="cyan"
          spark={[30, 34, 31, 38, 42, 40, 45, 43, 48, 51, 49, 55, 58, 56, 60, 62, 65, 67, 69, 72]}
        />
        <MetricTile
          label="Cycle time"
          value={2.4}
          unit="d"
          delta={-12.5}
          icon={Activity}
          accent="fuchsia"
          formatter={(n) => n.toFixed(1)}
          spark={[58, 55, 60, 52, 50, 48, 51, 46, 44, 42, 45, 38, 36, 38, 32, 30, 28, 30, 25, 24]}
        />
        <MetricTile
          label="Conversion"
          value={4.2}
          suffix="%"
          delta={0.7}
          icon={TrendingUp}
          accent="emerald"
          formatter={(n) => n.toFixed(1)}
          spark={[20, 22, 21, 24, 26, 25, 28, 27, 30, 32, 31, 34, 35, 37, 36, 39, 41, 40, 43, 42]}
        />
      </div>

      {/* Main grid: 8 + 4 split */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column (8) */}
        <div className="space-y-6 lg:col-span-8">
          <ProductivityChart />
          <RecentTasks />
          <TeamActivity />
        </div>

        {/* Right column (4) */}
        <div className="space-y-6 lg:col-span-4">
          <AIInsightsPanel />
          <SmartRecommendations />
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
}
