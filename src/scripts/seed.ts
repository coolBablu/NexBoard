/* eslint-disable no-console */
/**
 * Seed script — wipes the demo workspace and reseeds it with
 * sample projects, tasks, conversations and activity items.
 *
 * Usage:
 *   1. Set MONGODB_URI in .env.local (or set DEMO_MODE=true for in-memory)
 *   2. npm run seed
 *
 * The default demo credentials are:
 *   email:    demo@novaflow.app
 *   password: novaflow123
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";

import { dbConnect } from "../lib/mongodb";
import { seedDemoData, DEMO_EMAIL, DEMO_PASSWORD } from "../lib/demo-seed";

async function main() {
  console.log("→ Connecting to MongoDB…");
  await dbConnect();

  console.log("→ Seeding demo workspace (wipe + reseed)…");
  await seedDemoData({ wipe: true });

  console.log("\n✓ Seed complete.");
  console.log("─────────────────────────────────");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("─────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("✗ Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
