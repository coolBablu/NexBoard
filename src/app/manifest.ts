import type { MetadataRoute } from "next";

/**
 * Web App Manifest — lets users "install" NovaFlow on their phone
 * home screen and improves Lighthouse PWA score.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NovaFlow",
    short_name: "NovaFlow",
    description:
      "The AI-powered workspace where modern teams plan, build, and ship.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b0a10",
    theme_color: "#0b0a10",
    orientation: "any",
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
