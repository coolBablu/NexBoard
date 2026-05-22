"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, Menu, Command, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn, initials } from "@/lib/utils";

interface TopbarProps {
  onOpenSidebar: () => void;
  onOpenPalette?: () => void;
  title?: string;
  description?: string;
}

export function Topbar({
  onOpenSidebar,
  onOpenPalette,
  title,
  description,
}: TopbarProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name || "Guest";
  const userEmail = user?.email || "—";
  const userImage =
    user?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      userEmail
    )}`;

  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/60 px-4 backdrop-blur-2xl transition-[border-color,box-shadow] duration-300 sm:px-6",
        scrolled
          ? "border-white/[0.1] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.6)]"
          : "border-white/[0.04]"
      )}
    >
      <button
        onClick={onOpenSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-foreground transition-colors hover:bg-white/[0.05] lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </button>

      {title && (
        <div className="min-w-0 hidden md:block">
          <h1 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h1>
          {description && (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="ml-auto flex flex-1 max-w-md items-center">
        <button
          onClick={onOpenPalette}
          className="group relative flex h-10 w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] pl-3 pr-2 text-left text-sm text-muted-foreground transition-colors hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-foreground"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate text-muted-foreground/70 group-hover:text-foreground/80">
            Search or jump to…
          </span>
          <kbd className="pointer-events-none hidden h-6 items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            <Command className="size-3" />K
          </kbd>
        </button>
      </div>

      <Button
        size="sm"
        className="hidden sm:inline-flex"
        asChild
      >
        <Link href="/workspace">
          <Plus className="size-3.5" />
          New
        </Link>
      </Button>

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 pr-3 transition-colors hover:bg-white/[0.05]"
            aria-label="Account menu"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={userImage} alt={userName} />
              <AvatarFallback>{initials(userName)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">
              {userName.split(" ")[0]}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <div className="font-medium">{userName}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {userEmail}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => (window.location.href = "/settings")}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => (window.location.href = "/settings")}>
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => (window.location.href = "/workspace")}>
            Team
          </DropdownMenuItem>
          <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-rose-300 focus:text-rose-300"
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
