import {
  CreditCard,
  Cpu,
  Rocket,
  Palette,
  LineChart,
  Shield,
  Sparkles,
  Folder,
  type LucideIcon,
} from "lucide-react";
import type { ProjectIcon } from "@/models/Project";

export const projectIconMap: Record<ProjectIcon, LucideIcon> = {
  "credit-card": CreditCard,
  cpu: Cpu,
  rocket: Rocket,
  palette: Palette,
  "line-chart": LineChart,
  shield: Shield,
  sparkles: Sparkles,
  folder: Folder,
};

export const projectIconOptions: ProjectIcon[] = [
  "rocket",
  "credit-card",
  "cpu",
  "palette",
  "line-chart",
  "shield",
  "sparkles",
  "folder",
];

export const projectColorOptions = [
  "bg-gradient-to-br from-violet-500 to-fuchsia-500",
  "bg-gradient-to-br from-cyan-500 to-blue-600",
  "bg-gradient-to-br from-fuchsia-500 to-rose-500",
  "bg-gradient-to-br from-amber-400 to-orange-500",
  "bg-gradient-to-br from-emerald-400 to-cyan-500",
  "bg-gradient-to-br from-blue-500 to-indigo-600",
];
