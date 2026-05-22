/**
 * Demo-mode in-memory MongoDB.
 *
 * Spins up a real MongoDB binary inside the Node.js process so the
 * app can run locally with zero external services. The binary is
 * downloaded once (~80 MB) and cached in the user's home dir.
 *
 * Enable by setting DEMO_MODE=true in .env.local.
 *
 * Cross-bundle URI sharing: Next.js bundles server modules into
 * separate webpack outputs (instrumentation, middleware, RSC, route
 * handlers). `globalThis` is not reliably shared across them in dev,
 * so we publish the URI via `process.env.DEMO_MONGO_URI` — env vars
 * are process-wide and survive HMR.
 */

import type { MongoMemoryServer } from "mongodb-memory-server";

const ENV_KEY = "DEMO_MONGO_URI";

interface DemoMongoCache {
  server: MongoMemoryServer | null;
  uriPromise: Promise<string> | null;
}

const GLOBAL_KEY = "__novaflow_demo_mongo__";

type GlobalWithCache = typeof globalThis & {
  [GLOBAL_KEY]?: DemoMongoCache;
};

function getCache(): DemoMongoCache {
  const g = globalThis as GlobalWithCache;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { server: null, uriPromise: null };
  }
  return g[GLOBAL_KEY]!;
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

async function startInMemoryServer(): Promise<string> {
  // eslint-disable-next-line no-console
  console.log(
    "[demo-mongo] Starting in-memory MongoDB… (first run downloads MongoDB binary, ~80 MB)"
  );
  const mod = await import("mongodb-memory-server");
  const server = await mod.MongoMemoryServer.create({
    instance: {
      dbName: process.env.MONGODB_DB || "novaflow",
    },
  });
  const uri = server.getUri();
  const cache = getCache();
  cache.server = server;
  process.env[ENV_KEY] = uri;
  // eslint-disable-next-line no-console
  console.log("[demo-mongo] Ready at", uri.replace(/\/[^/]+$/, "/"));

  const stop = async () => {
    try {
      await server.stop();
    } catch {
      // ignore
    }
    delete process.env[ENV_KEY];
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  process.once("beforeExit", stop);

  return uri;
}

/**
 * Returns the connection URI for the demo MongoDB.
 *
 * - `initialize: true` (instrumentation only) starts the in-memory
 *   server and publishes the URI via process.env.
 * - All other contexts read the URI from process.env, waiting briefly
 *   for instrumentation to publish it if needed.
 */
export async function getDemoMongoUri(
  options: { initialize?: boolean } = {}
): Promise<string> {
  // Fast path: already published by instrumentation in this process.
  const fromEnv = process.env[ENV_KEY];
  if (fromEnv) return fromEnv;

  const cache = getCache();
  if (cache.uriPromise) return cache.uriPromise;

  cache.uriPromise = (async () => {
    if (options.initialize) {
      return startInMemoryServer();
    }

    // Wait up to 30s for instrumentation to publish the URI
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const u = process.env[ENV_KEY];
      if (u) return u;
    }

    // Last resort fallback (shouldn't happen if instrumentation ran)
    return startInMemoryServer();
  })();

  try {
    return await cache.uriPromise;
  } catch (err) {
    cache.uriPromise = null;
    throw err;
  }
}
