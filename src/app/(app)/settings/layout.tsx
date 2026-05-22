import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your profile, workspace, security, integrations, billing and notification preferences.",
  openGraph: {
    title: "Settings · NovaFlow",
    description: "Profile, workspace, billing, integrations.",
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
