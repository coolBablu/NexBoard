import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every project in one focused grid — filter by status, star favorites, and ship faster.",
  openGraph: {
    title: "Projects · NexBoard",
    description: "Status, progress, and ownership at a glance.",
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
