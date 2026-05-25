"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkspaceSwitcher } from "@/components/team/workspace-switcher";
import { navGroups } from "@/config/nav";
import { cn, initials } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name || "Guest";
  const userEmail = user?.email || "—";
  const userImage =
    user?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      userEmail
    )}`;

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
        {collapsed ? (
          <Logo size="sm" withText={false} />
        ) : (
          <Logo size="sm" />
        )}
        <button
          onClick={onToggle}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground lg:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </button>
      </div>

      <WorkspaceSwitcher collapsed={collapsed} />

      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed && (
              <h4 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </h4>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                        active
                          ? "text-foreground nav-active"
                          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[18px] shrink-0 transition-colors",
                          active && "text-primary"
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant={
                                item.badge === "New" ? "gradient" : "secondary"
                              }
                              className="px-1.5 py-0 text-[10px]"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                      {active && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-nova-gradient"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="m-3 mt-0">
          <div className="glass relative overflow-hidden rounded-2xl p-4">
            <div className="aurora absolute -inset-6 -z-10 opacity-60" />
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/90">
              <Sparkles className="size-3.5 text-violet-300" />
              Upgrade to Pro
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Unlock unlimited AI runs, advanced analytics, and priority
              support.
            </p>
            <Link
              href="/settings"
              className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-nova-gradient text-xs font-medium text-white shadow-glow"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      <div className="border-t border-white/[0.06] p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback>{initials(userName)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p suppressHydrationWarning className="truncate text-sm font-medium">
                  {userName}
                </p>
                <p
                  suppressHydrationWarning
                  className="truncate text-xs text-muted-foreground"
                >
                  {userEmail}
                </p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </>
          )}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/[0.06] bg-background/70 backdrop-blur-2xl transition-[width] duration-300 ease-out lg:block",
          collapsed ? "w-[78px]" : "w-[260px]"
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          onClick={onMobileClose}
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] border-r border-white/[0.06] bg-background/95 backdrop-blur-2xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
