import { MongoClient } from "mongodb";

import { getDemoMongoUri, isDemoMode } from "./demo-mongo";

/**
 * Native MongoDB client promise — required by @auth/mongodb-adapter.
 * Cached across hot-reloads in development.
 *
 * When DEMO_MODE=true, connects to the in-memory MongoDB.
 * Otherwise uses MONGODB_URI. If neither is set, returns a lazily
 * rejecting promise so build succeeds cleanly but runtime fails loud.
 */

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

async function resolveUri(): Promise<string> {
  if (isDemoMode()) {
    return getDemoMongoUri();
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local, or set DEMO_MODE=true to use in-memory MongoDB."
    );
  }
  return uri;
}

function buildClientPromise(): Promise<MongoClient> {
  const p = (async () => {
    const uri = await resolveUri();
    return new MongoClient(uri).connect();
  })();
  // Silence "unhandled rejection" at module load.
  // The error still surfaces when something actually awaits it.
  p.catch(() => {});
  return p;
}

const clientPromise: Promise<MongoClient> =
  global._mongoClientPromise ??
  (global._mongoClientPromise = buildClientPromise());

export default clientPromise;
