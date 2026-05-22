"use client";

import * as React from "react";
import {
  Bell,
  Check,
  CreditCard,
  KeyRound,
  Languages,
  Lock,
  Mail,
  Moon,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      description="Manage your account, workspace, and billing."
    >
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-fuchsia-300/80">
          Account
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Settings
        </h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">
            <UserIcon className="size-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="size-3.5" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="size-3.5" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-3.5" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <ProfileSection />
          <WorkspaceSection />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-6">
          <PreferencesSection />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-6">
          <BillingSection />
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <SecuritySection />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ---------------- Sections ---------------- */

function ProfileSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal information</CardTitle>
        <CardDescription>
          Update your name, photo and contact details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 ring-2 ring-violet-500/30">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nova" />
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">
                Upload new
              </Button>
              <Button size="sm" variant="ghost">
                Remove
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG up to 5MB. Square images work best.
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="first" label="First name" defaultValue="Alex" />
          <Field id="last" label="Last name" defaultValue="Chen" />
          <Field
            id="email"
            label="Work email"
            type="email"
            defaultValue="alex@novaflow.app"
          />
          <Field id="title" label="Job title" defaultValue="Head of Product" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspaceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>
          Settings that apply to everyone in this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ws-name" label="Workspace name" defaultValue="Acme Inc." />
          <Field id="ws-url" label="Workspace URL" defaultValue="acme" />
        </div>
        <div className="flex justify-end">
          <Button>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesSection() {
  const [theme, setTheme] = React.useState<"dark" | "light" | "system">("dark");
  const [accent, setAccent] = React.useState("violet");

  const accents = [
    { id: "violet", color: "from-violet-500 to-fuchsia-500" },
    { id: "cyan", color: "from-cyan-500 to-blue-500" },
    { id: "emerald", color: "from-emerald-400 to-cyan-500" },
    { id: "rose", color: "from-rose-500 to-amber-400" },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Personalize the look and feel of NovaFlow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Theme</Label>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-md">
              {[
                { id: "dark" as const, label: "Dark", icon: Moon },
                { id: "light" as const, label: "Light", icon: Sun },
                { id: "system" as const, label: "System", icon: Sparkles },
              ].map((t) => {
                const Icon = t.icon;
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={
                      "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-all " +
                      (active
                        ? "border-primary/50 bg-primary/[0.08] text-foreground shadow-[0_0_30px_-10px_rgba(139,92,246,0.55)]"
                        : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/15 hover:text-foreground")
                    }
                  >
                    <Icon className="size-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <Label>Accent color</Label>
            <div className="mt-3 flex flex-wrap gap-3">
              {accents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  className={
                    "relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br " +
                    a.color +
                    (accent === a.id
                      ? " ring-2 ring-white ring-offset-2 ring-offset-background"
                      : "")
                  }
                  aria-label={`Accent ${a.id}`}
                >
                  {accent === a.id && <Check className="size-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <ToggleRow
              icon={Zap}
              title="Reduce motion"
              desc="Minimize cinematic animations across the app."
            />
            <ToggleRow
              icon={Languages}
              title="Spell-check"
              desc="Use the system spellchecker in documents."
              defaultChecked
            />
            <ToggleRow
              icon={Sparkles}
              title="AI suggestions"
              desc="Let Nova suggest text, tasks and decisions as you work."
              defaultChecked
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function NotificationsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose what you want to hear about, and where.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ToggleRow
          icon={Mail}
          title="Email · daily digest"
          desc="A 90-second summary of what happened in your workspace."
          defaultChecked
        />
        <ToggleRow
          icon={Mail}
          title="Email · mentions & assignments"
          desc="When someone @-mentions you or assigns you a task."
          defaultChecked
        />
        <ToggleRow
          icon={Smartphone}
          title="Push · real-time mentions"
          desc="Mobile push for direct mentions and DMs."
          defaultChecked
        />
        <ToggleRow
          icon={Bell}
          title="In-app · all activity"
          desc="Show all workspace activity in the bell menu."
        />
        <ToggleRow
          icon={Sparkles}
          title="Nova proactive alerts"
          desc="Allow Nova to surface risks and decisions without being asked."
          defaultChecked
        />
      </CardContent>
    </Card>
  );
}

function BillingSection() {
  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="aurora absolute -inset-10 -z-10 opacity-50" />
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="gradient">
                <Sparkles className="size-3" />
                Pro plan
              </Badge>
              <span className="text-muted-foreground">Renews Dec 14</span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-semibold">
              You're on Pro — $14/user/mo
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              22 active seats · next invoice ~$308
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary">Manage seats</Button>
            <Button>Upgrade to Enterprise</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-14 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-semibold text-white">
                VISA
              </div>
              <div>
                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                <p className="text-xs text-muted-foreground">
                  Expires 09 / 2027
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { id: "INV-0089", date: "Nov 14, 2026", amount: "$308.00" },
            { id: "INV-0088", date: "Oct 14, 2026", amount: "$294.00" },
            { id: "INV-0087", date: "Sep 14, 2026", amount: "$280.00" },
          ].map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-white/[0.03]"
            >
              <div>
                <p className="text-sm font-medium">{inv.id}</p>
                <p className="text-xs text-muted-foreground">{inv.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">{inv.amount}</span>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            For your security, choose a strong, unique password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="current" label="Current password" type="password" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="new" label="New password" type="password" />
            <Field id="confirm" label="Confirm password" type="password" />
          </div>
          <div className="flex justify-end">
            <Button>Update password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Add a second layer of security with an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            icon={Lock}
            title="Authenticator app"
            desc="Use Authy, 1Password, or Google Authenticator."
            defaultChecked
          />
          <ToggleRow
            icon={KeyRound}
            title="Hardware security key"
            desc="YubiKey, Titan, or any FIDO2 device."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { device: "MacBook Pro · Chrome", where: "San Francisco, US", current: true },
            { device: "iPhone 15 · Safari", where: "San Francisco, US", current: false },
            { device: "Windows · Edge", where: "Berlin, DE", current: false },
          ].map((s) => (
            <div
              key={s.device}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
            >
              <div>
                <p className="text-sm font-medium">{s.device}</p>
                <p className="text-xs text-muted-foreground">{s.where}</p>
              </div>
              {s.current ? (
                <Badge variant="success">This device</Badge>
              ) : (
                <Button variant="ghost" size="sm">
                  Sign out
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

/* ---------------- Helpers ---------------- */

function Field({
  id,
  label,
  type = "text",
  defaultValue,
}: {
  id: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={defaultValue} />
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  defaultChecked,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-violet-200">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
