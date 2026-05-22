import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your workspace at a glance — productivity metrics, AI insights, recent tasks, team activity, and what needs your attention today.",
  openGraph: {
    title: "Dashboard · NovaFlow",
    description: "Productivity metrics, AI insights, and live team activity.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
