import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox",
  description:
    "All your mentions, comments, assignments, and AI insights — in one focused inbox.",
  openGraph: {
    title: "Inbox · NexBoard",
    description: "Notifications, mentions, and AI nudges in one place.",
  },
};

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
