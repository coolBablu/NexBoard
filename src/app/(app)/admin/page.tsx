"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  UserPlus,
  Check,
  X,
  MoreVertical,
  Search,
  Crown,
  ShieldCheck,
  User as UserIcon,
  Pause,
  Play,
  Trash2,
  Loader2,
  MessageSquare,
  Mail,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Role = "super_admin" | "admin" | "member";
type Status = "pending" | "active" | "suspended";
type Presence = "online" | "away" | "offline";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string;
  title: string | null;
  role: Role;
  status: Status;
  presence: Presence;
  createdAt: string;
  approvedAt: string | null;
}

interface AdminResponse {
  counts: { pending: number; active: number; suspended: number; total: number };
  users: AdminUser[];
}

const ROLE_META: Record<Role, { label: string; icon: React.ElementType; tone: string }> = {
  super_admin: {
    label: "Super admin",
    icon: Crown,
    tone:
      "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200",
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    tone:
      "bg-violet-500/10 text-violet-700 border-violet-500/25 dark:bg-violet-500/15 dark:text-violet-200",
  },
  member: {
    label: "Member",
    icon: UserIcon,
    tone:
      "bg-slate-500/10 text-slate-700 border-slate-500/25 dark:bg-slate-500/15 dark:text-slate-200",
  },
};

const STATUS_META: Record<Status, { label: string; tone: string }> = {
  pending: {
    label: "Pending",
    tone:
      "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200",
  },
  active: {
    label: "Active",
    tone:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-200",
  },
  suspended: {
    label: "Suspended",
    tone:
      "bg-rose-500/10 text-rose-700 border-rose-500/25 dark:bg-rose-500/15 dark:text-rose-200",
  },
};

export default function AdminPage() {
  return (
    <AppShell
      title="Admin"
      description="Members, pending approvals, and permissions."
    >
      <AdminBody />
    </AppShell>
  );
}

function AdminBody() {
  const [tab, setTab] = React.useState<"pending" | "all" | "active" | "suspended">(
    "pending"
  );
  const [query, setQuery] = React.useState("");
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const { data, isLoading } = useSWR<AdminResponse>(
    `/api/admin/users${tab === "all" ? "" : `?status=${tab}`}`
  );

  // Auto-switch away from Pending if there are no pending users on first
  // load — so a freshly-set-up workspace doesn't open on an empty tab.
  React.useEffect(() => {
    if (
      tab === "pending" &&
      data &&
      data.counts.pending === 0 &&
      data.counts.total > 0
    ) {
      setTab("active");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const users = React.useMemo(() => {
    const all = data?.users ?? [];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.title ?? "").toLowerCase().includes(q)
    );
  }, [data, query]);

  function refresh() {
    void mutate(`/api/admin/users${tab === "all" ? "" : `?status=${tab}`}`);
    // Also refresh other tab counts.
    void mutate((key) => typeof key === "string" && key.startsWith("/api/admin/users"));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">
            Admin · super admin only
          </p>
          <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            <Shield className="size-7 text-violet-500" />
            Members &amp; permissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data
              ? `${data.counts.total} accounts · ${data.counts.pending} awaiting approval`
              : "Loading workspace roster…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="h-10 w-56 pl-8"
            />
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-3.5" />
            Add member
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {(data?.counts.pending ?? 0) > 0 && (
              <span className="ml-1.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-700 dark:text-amber-200">
                {data?.counts.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            {(data?.counts.active ?? 0) > 0 && (
              <span className="ml-1.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-200">
                {data?.counts.active}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended
            {(data?.counts.suspended ?? 0) > 0 && (
              <span className="ml-1.5 rounded-md bg-rose-500/15 px-1.5 py-0.5 font-mono text-[10px] text-rose-700 dark:text-rose-200">
                {data?.counts.suspended}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {isLoading ? (
            <SkeletonTable />
          ) : users.length === 0 ? (
            <EmptyState tab={tab} onInvite={() => setInviteOpen(true)} />
          ) : (
            <MemberTable users={users} onChanged={refresh} />
          )}
        </TabsContent>
      </Tabs>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onCreated={() => {
          refresh();
          setInviteOpen(false);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Member table
// ─────────────────────────────────────────────────────────────────────

function MemberTable({
  users,
  onChanged,
}: {
  users: AdminUser[];
  onChanged: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="hidden grid-cols-[1fr_140px_140px_120px_60px] gap-4 border-b border-white/[0.06] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <div>Member</div>
        <div>Role</div>
        <div>Status</div>
        <div>Joined</div>
        <div className="text-right">Actions</div>
      </div>
      <ul>
        <AnimatePresence initial={false}>
          {users.map((u) => (
            <MemberRow key={u.id} user={u} onChanged={onChanged} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function MemberRow({
  user,
  onChanged,
}: {
  user: AdminUser;
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  async function call(
    body: Record<string, unknown> | null,
    method: "PATCH" | "DELETE" | "POST",
    path?: string
  ): Promise<boolean> {
    setBusy(true);
    try {
      const url = `/api/admin/users/${user.id}${path ?? ""}`;
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error("Action failed", { description: data.error ?? `Status ${res.status}` });
        return false;
      }
      return true;
    } catch (err) {
      toast.fromError(err, "Network error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    const ok = await call(null, "POST", "/approve");
    if (ok) {
      toast.success("Approved", { description: `${user.name} is now active.` });
      onChanged();
    }
  }
  async function setRole(role: Role) {
    const ok = await call({ role }, "PATCH");
    if (ok) {
      toast.success(`Role updated`, {
        description: `${user.name} is now ${ROLE_META[role].label}.`,
      });
      onChanged();
      setMenuOpen(false);
    }
  }
  async function suspend() {
    const ok = await call({ status: "suspended" }, "PATCH");
    if (ok) {
      toast.success("Suspended", { description: `${user.name} can no longer log in.` });
      onChanged();
      setMenuOpen(false);
    }
  }
  async function reactivate() {
    const ok = await call({ status: "active" }, "PATCH");
    if (ok) {
      toast.success("Re-activated", { description: `${user.name} is back in.` });
      onChanged();
      setMenuOpen(false);
    }
  }
  async function remove() {
    if (!confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
    const ok = await call(null, "DELETE");
    if (ok) {
      toast.success("Removed", { description: `${user.name} was deleted.` });
      onChanged();
      setMenuOpen(false);
    }
  }

  const RoleIcon = ROLE_META[user.role].icon;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      className="grid grid-cols-1 gap-3 border-b border-white/[0.04] px-5 py-4 transition-colors last:border-0 hover:bg-white/[0.03] sm:grid-cols-[1fr_140px_140px_120px_60px] sm:items-center"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
              user.presence === "online"
                ? "bg-emerald-400"
                : user.presence === "away"
                  ? "bg-amber-400"
                  : "bg-slate-400"
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            ROLE_META[user.role].tone
          )}
        >
          <RoleIcon className="size-3" />
          {ROLE_META[user.role].label}
        </span>
      </div>

      <div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            STATUS_META[user.status].tone
          )}
        >
          {STATUS_META[user.status].label}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        <time suppressHydrationWarning dateTime={user.createdAt}>
          {new Date(user.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </time>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        {user.status === "pending" && (
          <Button
            size="sm"
            variant="default"
            disabled={busy}
            onClick={approve}
          >
            {busy ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Check className="size-3" />
            )}
            Approve
          </Button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            disabled={busy}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Actions"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <MoreVertical className="size-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-popover/95 p-1 shadow-xl backdrop-blur-2xl"
              >
                {user.status === "pending" && (
                  <MenuItem icon={Check} onClick={approve}>
                    Approve account
                  </MenuItem>
                )}
                <MenuLabel>Role</MenuLabel>
                {(["super_admin", "admin", "member"] as Role[]).map((r) => {
                  const Icon = ROLE_META[r].icon;
                  return (
                    <MenuItem
                      key={r}
                      icon={Icon}
                      onClick={() => setRole(r)}
                      active={user.role === r}
                    >
                      {ROLE_META[r].label}
                    </MenuItem>
                  );
                })}
                <MenuDivider />
                <MenuItem icon={MessageSquare} asLink href={`/team?u=${user.id}`}>
                  Chat in team
                </MenuItem>
                <MenuItem icon={Mail} asLink href={`mailto:${user.email}`}>
                  Email
                </MenuItem>
                <MenuDivider />
                {user.status === "active" && user.role !== "super_admin" && (
                  <MenuItem icon={Pause} onClick={suspend} tone="warn">
                    Suspend access
                  </MenuItem>
                )}
                {user.status === "suspended" && (
                  <MenuItem icon={Play} onClick={reactivate}>
                    Re-activate
                  </MenuItem>
                )}
                {user.role !== "super_admin" && (
                  <MenuItem icon={Trash2} onClick={remove} tone="danger">
                    Delete account
                  </MenuItem>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}

function MenuItem({
  icon: Icon,
  children,
  onClick,
  active,
  tone,
  asLink,
  href,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  tone?: "warn" | "danger";
  asLink?: boolean;
  href?: string;
}) {
  const cls = cn(
    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
    tone === "danger"
      ? "text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
      : tone === "warn"
        ? "text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
        : "text-foreground/85 hover:bg-white/[0.06]",
    active && "bg-white/[0.06] font-medium text-foreground"
  );
  if (asLink && href) {
    return (
      <Link href={href} className={cls}>
        <Icon className="size-3.5" />
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} onClick={onClick}>
      <Icon className="size-3.5" />
      {children}
      {active && <Check className="ml-auto size-3" />}
    </button>
  );
}
function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 px-2.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </div>
  );
}
function MenuDivider() {
  return <div className="my-1 h-px bg-white/[0.05]" />;
}

// ─────────────────────────────────────────────────────────────────────
// Invite dialog
// ─────────────────────────────────────────────────────────────────────

function InviteDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [tempPassword, setTempPassword] = React.useState<string | null>(null);
  const [emailHandle, setEmailHandle] = React.useState("");
  const { data: cfg } = useSWR<{ inviteDomain: string | null }>(
    "/api/admin/config"
  );
  const inviteDomain = cfg?.inviteDomain ?? null;
  const composedEmail = inviteDomain
    ? `${emailHandle.trim()}@${inviteDomain}`
    : emailHandle.trim();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setTempPassword(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const email = inviteDomain
      ? composedEmail
      : String(fd.get("email") || "").trim();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") || ""),
          email,
          role: String(fd.get("role") || "member"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not add member", { description: data.error });
        return;
      }
      toast.success("Member added", {
        description: `${data.user.name} is now active.`,
      });
      if (data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
      } else {
        form.reset();
        setEmailHandle("");
        onCreated();
      }
    } catch (err) {
      toast.fromError(err, "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Add a member</DialogTitle>
        <p className="-mt-1 text-xs text-muted-foreground">
          Skip the public sign-up. The new account is active immediately.
        </p>

        {tempPassword ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3 text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                Account created — share these credentials:
              </p>
              <div className="mt-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-mono text-xs">
                <span className="text-muted-foreground">Temporary password</span>
                <p className="mt-0.5 select-all text-foreground">
                  {tempPassword}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                The user should change it from Settings after first login.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setTempPassword(null);
                  onCreated();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="Maya Okonkwo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Company email</Label>
              {inviteDomain ? (
                <div className="flex items-stretch overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/15">
                  <input
                    id="email"
                    name="emailHandle"
                    autoComplete="off"
                    placeholder="maya"
                    required
                    pattern="[a-zA-Z0-9._%+-]+"
                    value={emailHandle}
                    onChange={(e) =>
                      setEmailHandle(
                        e.target.value.toLowerCase().replace(/\s+/g, "")
                      )
                    }
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                  <span className="grid place-items-center border-l border-white/[0.08] bg-white/[0.03] px-3 font-mono text-xs text-muted-foreground">
                    @{inviteDomain}
                  </span>
                </div>
              ) : (
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="maya@acme.com"
                  required
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                {inviteDomain
                  ? `Only @${inviteDomain} addresses can be invited.`
                  : "Any work email is allowed."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue="member"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3" />
                    Add member
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Misc bits
// ─────────────────────────────────────────────────────────────────────

function SkeletonTable() {
  return (
    <div className="space-y-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-foreground/[0.06]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-foreground/[0.06]" />
            <div className="h-2.5 w-1/2 rounded bg-foreground/[0.06]" />
          </div>
          <div className="h-6 w-20 rounded-full bg-foreground/[0.06]" />
          <div className="h-6 w-20 rounded-full bg-foreground/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  tab,
  onInvite,
}: {
  tab: "pending" | "all" | "active" | "suspended";
  onInvite: () => void;
}) {
  const copy: Record<typeof tab, { title: string; body: string; cta?: string }> = {
    pending: {
      title: "No one's waiting.",
      body: "When a new user signs up, they'll show up here for approval.",
    },
    active: {
      title: "No active members yet.",
      body: "Add your team to start collaborating.",
      cta: "Add a member",
    },
    suspended: {
      title: "No suspended accounts.",
      body: "Suspended users will appear here so you can re-activate them.",
    },
    all: {
      title: "Your roster is empty.",
      body: "Add team members to start collaborating.",
      cta: "Add the first member",
    },
  };
  const c = copy[tab];
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] py-16 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-nova-gradient/20 text-violet-700 dark:text-violet-200">
        <Shield className="size-6" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">{c.title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {c.body}
      </p>
      {c.cta && (
        <Button className="mt-4" onClick={onInvite}>
          <UserPlus className="size-3.5" />
          {c.cta}
        </Button>
      )}
    </div>
  );
}
