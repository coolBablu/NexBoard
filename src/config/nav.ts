import {
  LayoutDashboard,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  Inbox,
  Calendar,
  Folder,
  MessagesSquare,
  Shield,
  Files,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Only render when the current session has one of these roles. */
  requiresRole?: ("super_admin" | "admin")[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Inbox", href: "/inbox", icon: Inbox, badge: "4" },
      { label: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Workspace", href: "/workspace", icon: Users },
      { label: "Projects", href: "/projects", icon: Folder },
      { label: "Team", href: "/team", icon: MessagesSquare, badge: "Live" },
      { label: "Files", href: "/files", icon: Files },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "AI Assistant", href: "/assistant", icon: Sparkles, badge: "New" },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        label: "Members",
        href: "/admin",
        icon: Shield,
        requiresRole: ["super_admin"],
      },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];
