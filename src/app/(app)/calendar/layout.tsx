import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Your team's schedule — meetings, focus blocks, and AI digests on one timeline.",
  openGraph: {
    title: "Calendar · NexBoard",
    description: "Schedule, focus blocks, and AI digests.",
  },
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
