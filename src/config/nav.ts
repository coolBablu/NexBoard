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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
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
      { label: "Inbox", href: "/dashboard?inbox", icon: Inbox, badge: "4" },
      { label: "Calendar", href: "/dashboard?cal", icon: Calendar },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Workspace", href: "/workspace", icon: Users },
      { label: "Projects", href: "/workspace?p", icon: Folder },
      { label: "Team", href: "/team", icon: MessagesSquare, badge: "Live" },
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
    label: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];
