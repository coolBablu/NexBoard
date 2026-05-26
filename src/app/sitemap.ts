import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://novaflow.app";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/login`, lastModified: now },
    { url: `${base}/dashboard`, lastModified: now },
    { url: `${base}/workspace`, lastModified: now },
    { url: `${base}/analytics`, lastModified: now },
    { url: `${base}/assistant`, lastModified: now },
    { url: `${base}/settings`, lastModified: now },
  ];
}
