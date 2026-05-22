import bundleAnalyzer from "@next/bundle-analyzer";

/**
 * Strong default security headers applied to every response.
 *
 * - HSTS: HTTPS only for 2 years (Vercel terminates TLS).
 * - X-Frame-Options + X-Content-Type-Options: clickjacking / MIME sniffing.
 * - Referrer-Policy: minimal cross-origin leakage.
 * - Permissions-Policy: deny powerful APIs by default.
 *
 * A full CSP is intentionally NOT added globally: Next.js dev needs
 * `unsafe-eval` and we use a few `data:` URLs (favicons, attachments).
 * Use middleware nonce-CSP if/when you need it.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 750, 1080, 1280, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // Keep heavy native/server-only deps out of the webpack bundle so
  // they're required at runtime instead of statically analyzed.
  // `mongodb-memory-server` is dynamically imported only when
  // DEMO_MODE=true and must NEVER be bundled (it pulls in Node built-ins
  // like `http`/`https` that aren't available to the bundler's "node"
  // target). Externalizing in both dev and prod means the import is
  // resolved at runtime from node_modules (where it actually exists).
  serverExternalPackages: [
    "mongoose",
    "mongodb-memory-server",
    "mongodb-memory-server-core",
    "https-proxy-agent",
    "agent-base",
  ],

  experimental: {
    // Tree-shake heavy default-export libraries to ship only what we use.
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "react-syntax-highlighter",
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        "mongodb-memory-server",
        "mongodb-memory-server-core",
        "https-proxy-agent",
        "agent-base"
      );
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Long-cache fingerprinted static assets.
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API responses are never cached by browsers / shared caches.
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },

  // Pretty redirect: send /sitemap → /sitemap.xml etc.
  async redirects() {
    return [
      { source: "/sitemap", destination: "/sitemap.xml", permanent: true },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
