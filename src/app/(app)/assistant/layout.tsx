import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant",
  description:
    "Nova — your team's intelligence layer. Streaming GPT-powered chat with full markdown, syntax highlighting, and one-click task creation.",
  openGraph: {
    title: "Nova Assistant · NovaFlow",
    description: "Streaming AI chat with workspace context.",
  },
};

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
