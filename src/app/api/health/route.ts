import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";

/**
 * Health probe used by uptime monitors (BetterStack, Pingdom, Vercel
 * Cron, etc.) and by you on deploy day to verify the database is
 * actually reachable.
 *
 * Returns 200 with structured JSON when healthy, 503 when the DB ping
 * fails. Adds `Cache-Control: no-store` so monitors always see fresh
 * data.
 *
 *   GET /api/health
 *   { "status": "ok", "db": "connected", "uptime": 1234.5, ... }
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STARTED_AT = Date.now();

interface HealthResponse {
  status: "ok" | "degraded";
  db: "connected" | "down";
  demoMode: boolean;
  uptimeSec: number;
  timestamp: string;
  region?: string;
  commit?: string;
  version: string;
  dbLatencyMs?: number;
  error?: string;
}

export async function GET() {
  const body: HealthResponse = {
    status: "ok",
    db: "connected",
    demoMode: process.env.DEMO_MODE === "true",
    uptimeSec: Math.round((Date.now() - STARTED_AT) / 1000),
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    version: process.env.npm_package_version || "1.0.0",
  };

  const started = Date.now();
  try {
    await dbConnect();
    // Lightweight ping. Times out per mongoose serverSelectionTimeoutMS.
    await mongoose.connection.db?.admin().ping();
    body.dbLatencyMs = Date.now() - started;
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    body.status = "degraded";
    body.db = "down";
    body.error =
      err instanceof Error ? err.message : "Unknown database error";
    return NextResponse.json(body, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

/** HEAD = same as GET but with no body — cheaper for uptime monitors. */
export async function HEAD() {
  try {
    await dbConnect();
    await mongoose.connection.db?.admin().ping();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
