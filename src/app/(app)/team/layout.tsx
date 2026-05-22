import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
  description:
    "Realtime team chat, channels, presence, mentions, and a live activity timeline — the pulse of your workspace.",
  openGraph: {
    title: "Team · NovaFlow",
    description: "Realtime chat, presence, and live activity.",
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
