import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Velocity, cycle time, AI usage, cost, and team performance — every chart you need to ship faster.",
  openGraph: {
    title: "Analytics · NovaFlow",
    description: "Velocity, cycle time, and team analytics.",
  },
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
