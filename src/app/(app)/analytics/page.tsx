"use client";

import {
  ArrowUpRight,
  Calendar,
  Download,
  Filter,
  Globe2,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { BigAreaChart } from "@/components/analytics/big-area-chart";
import { FunnelBars } from "@/components/analytics/funnel-bars";
import { RetentionLine } from "@/components/analytics/retention-line";
import { SourceDonut } from "@/components/analytics/source-donut";

const topCountries = [
  { country: "United States", flag: "🇺🇸", users: 5283, share: 42 },
  { country: "Germany", flag: "🇩🇪", users: 1842, share: 15 },
  { country: "United Kingdom", flag: "🇬🇧", users: 1431, share: 12 },
  { country: "India", flag: "🇮🇳", users: 1280, share: 10 },
  { country: "Japan", flag: "🇯🇵", users: 912, share: 7 },
  { country: "Brazil", flag: "🇧🇷", users: 712, share: 6 },
];

const aiInsights = [
  {
    icon: TrendingUp,
    title: "Signups up 24% week-over-week",
    desc: "Driven primarily by the new pricing page (+3,210 visits).",
    tone: "from-violet-500/20",
  },
  {
    icon: Zap,
    title: "Activation lagging in EU cohort",
    desc: "Time-to-first-doc is 1.4× higher. Consider EU-specific onboarding.",
    tone: "from-amber-500/20",
  },
  {
    icon: Users,
    title: "Power users growing 3.2x faster",
    desc: "Teams using Nova AI 5+ times/day churn 78% less.",
    tone: "from-cyan-500/20",
  },
];

export default function AnalyticsPage() {
  return (
    <AppShell
      title="Analytics"
      description="Real-time, AI-augmented product analytics."
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-300/80">
            Last 30 days · vs previous period
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Analytics
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="default">
            <Calendar className="size-3.5" />
            Last 30 days
          </Button>
          <Button variant="secondary" size="default">
            <Filter className="size-3.5" />
            Filter
          </Button>
          <Button variant="secondary" size="default">
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sessions"
          value={148230}
          delta={11.4}
          icon={Users}
          accent="violet"
        />
        <StatCard
          label="Signups"
          value={9120}
          delta={24.3}
          icon={TrendingUp}
          accent="cyan"
        />
        <StatCard
          label="Activation"
          value={68}
          suffix="%"
          delta={3.1}
          icon={Zap}
          accent="fuchsia"
        />
        <StatCard
          label="Avg session"
          value={6.4}
          suffix="m"
          delta={-1.2}
          icon={Globe2}
          accent="emerald"
          formatter={(n) => n.toFixed(1)}
        />
      </div>

      {/* AI insights */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {aiInsights.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card
              key={i}
              className={
                "relative overflow-hidden bg-gradient-to-br to-transparent " +
                s.tone
              }
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-violet-200">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3 text-violet-300" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-200">
                        AI Insight
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold">{s.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main chart + donut */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Acquisition</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Sessions, signups & activations · last 30 days
              </p>
            </div>
            <Badge variant="success" className="gap-1.5">
              <ArrowUpRight className="size-3" />
              Healthy
            </Badge>
          </CardHeader>
          <CardContent>
            <BigAreaChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic sources</CardTitle>
          </CardHeader>
          <CardContent>
            <SourceDonut />
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Retention */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activation funnel</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Visit → Retained (30d)
            </p>
          </CardHeader>
          <CardContent>
            <FunnelBars />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retention by cohort</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Weeks since signup · 3 most recent monthly cohorts
            </p>
          </CardHeader>
          <CardContent>
            <RetentionLine />
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-400" />
                Sep cohort
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-cyan-400" />
                Aug cohort
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-fuchsia-400" />
                Jul cohort
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geo + top events */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top countries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCountries.map((c) => (
              <div key={c.country} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span className="font-medium">{c.country}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {c.users.toLocaleString()} users
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-nova-gradient"
                    style={{ width: `${c.share * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "doc_created", count: 18430, trend: "+12%" },
              { name: "task_completed", count: 14210, trend: "+9%" },
              { name: "ai_run", count: 9820, trend: "+38%" },
              { name: "team_invited", count: 4120, trend: "+3%" },
              { name: "billing_upgraded", count: 612, trend: "+24%" },
            ].map((e) => (
              <div
                key={e.name}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div>
                  <p className="font-mono text-sm">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.count.toLocaleString()} occurrences
                  </p>
                </div>
                <Badge variant="success">{e.trend}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
