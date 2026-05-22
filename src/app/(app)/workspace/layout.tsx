import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace",
  description:
    "All your team's projects, kanban boards, comments and assignments — one collaborative surface.",
  openGraph: {
    title: "Workspace · NovaFlow",
    description: "Projects, kanban, and team collaboration.",
  },
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
