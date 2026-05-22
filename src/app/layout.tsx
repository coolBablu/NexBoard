import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://novaflow.app"),
  title: {
    default: "NovaFlow — AI-Powered Workspace Collaboration",
    template: "%s · NovaFlow",
  },
  description:
    "NovaFlow is the AI-powered workspace where modern teams plan, build, and ship — together. Beautifully fast. Cinematically smooth.",
  keywords: [
    "AI workspace",
    "team collaboration",
    "project management",
    "AI assistant",
    "Linear alternative",
    "Notion alternative",
    "SaaS",
  ],
  authors: [{ name: "NovaFlow" }],
  creator: "NovaFlow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://novaflow.app",
    siteName: "NovaFlow",
    title: "NovaFlow — AI-Powered Workspace Collaboration",
    description:
      "The AI-powered workspace where modern teams plan, build, and ship — together.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NovaFlow — AI-Powered Workspace Collaboration",
    description:
      "The AI-powered workspace where modern teams plan, build, and ship — together.",
    creator: "@novaflow",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          display.variable,
          mono.variable,
          "font-sans selection:bg-primary/30 selection:text-foreground"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
