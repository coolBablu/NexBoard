import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Files",
  description: "Every doc, image, and asset shared with your workspace.",
};

export default function FilesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
