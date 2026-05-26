import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage members, approve new sign-ups, and tune permissions.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
