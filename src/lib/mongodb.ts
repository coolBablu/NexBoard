import mongoose, { type Mongoose } from "mongoose";

import { getDemoMongoUri, isDemoMode } from "./demo-mongo";

/**
 * Mongoose connection for application models.
 * Uses a cached promise across hot-reloads to avoid creating
 * multiple connections in development.
 *
 * When DEMO_MODE=true, an in-memory MongoDB is spawned automatically
 * and demo data is seeded if the database is empty.
 */

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global._mongooseCache ?? (global._mongooseCache = { conn: null, promise: null });

async function resolveUri(): Promise<string> {
  // On Vercel (serverless), in-memory MongoDB cannot run — there is no
  // persistent fs to cache the binary and the function cannot spawn a
  // long-lived mongod process. Require a real connection string instead.
  if (isDemoMode() && process.env.VERCEL) {
    const uri = process.env.MONGODB_URI;
    if (uri) return uri;
    throw new Error(
      "Demo mode is local-only. Set MONGODB_URI to a MongoDB Atlas connection string on Vercel " +
        "and either unset DEMO_MODE or leave it enabled to keep the seeded data on first boot. " +
        "See DEPLOYMENT.md for the 5-minute Atlas setup."
    );
  }

  if (isDemoMode()) {
    return getDemoMongoUri();
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local, or set DEMO_MODE=true to use in-memory MongoDB (local only)."
    );
  }
  return uri;
}

export async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = (async () => {
      const uri = await resolveUri();
      // Tuned for serverless (Vercel functions): keep the pool small,
      // fail fast on misconfigured URIs, and let idle sockets close so
      // the function can freeze cleanly between invocations.
      const m = await mongoose.connect(uri, {
        dbName: process.env.MONGODB_DB || "novaflow",
        bufferCommands: false,
        maxPoolSize: isDemoMode() ? 5 : 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });

      if (isDemoMode()) {
        try {
          const { ensureDemoSeed } = await import("./demo-seed");
          await ensureDemoSeed();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[demo-seed] Auto-seed failed:", err);
        }
      }

      return m;
    })();
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
