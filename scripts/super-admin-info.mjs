#!/usr/bin/env node
/**
 * Reports every super_admin in the configured MongoDB (Atlas or
 * in-memory demo). Run with:
 *
 *   node scripts/super-admin-info.mjs
 *
 * To also (re)set the password of a specific super-admin:
 *
 *   node scripts/super-admin-info.mjs reset <email> <new-password>
 *
 * To promote any existing account to super_admin (idempotent):
 *
 *   node scripts/super-admin-info.mjs promote <email>
 *
 * Reads MONGODB_URI / MONGODB_DB from .env.local.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

// ── tiny .env.local loader (so we don't depend on dotenv being installed)
function loadEnv() {
  try {
    const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const raw of file.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "novaflow";

if (!uri) {
  console.error(
    "✗ MONGODB_URI not set in .env.local — can't query Atlas.\n" +
      "  (DEMO_MODE uses an in-memory DB that lives only while `npm run dev` runs.)"
  );
  process.exit(1);
}

const cmd = process.argv[2] || "list";
const args = process.argv.slice(3);

const client = new MongoClient(uri);

const PERMS_SUPER = {
  canInviteMembers: true,
  canAssignTasks: true,
  canManageProjects: true,
  canAccessAnalytics: true,
  canManageBilling: true,
};

async function run() {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");

  if (cmd === "list") {
    await list(users);
  } else if (cmd === "reset") {
    const [email, password] = args;
    if (!email || !password) {
      console.error("Usage: node scripts/super-admin-info.mjs reset <email> <password>");
      process.exit(1);
    }
    await reset(users, email, password);
  } else if (cmd === "promote") {
    const [email] = args;
    if (!email) {
      console.error("Usage: node scripts/super-admin-info.mjs promote <email>");
      process.exit(1);
    }
    await promote(users, email);
  } else {
    console.error("Unknown command:", cmd);
    process.exit(1);
  }
  await client.close();
}

async function list(users) {
  const total = await users.countDocuments();
  const supers = await users
    .find(
      { role: "super_admin" },
      { projection: { name: 1, email: 1, status: 1, role: 1, createdAt: 1 } }
    )
    .sort({ createdAt: 1 })
    .toArray();

  console.log(`\nDatabase: ${dbName}`);
  console.log(`Cluster:  ${uri.replace(/:\/\/[^@]+@/, "://***@")}\n`);
  console.log(`Total users: ${total}\n`);

  if (supers.length === 0) {
    console.log("⚠ No super_admin in the database.");
    const earliest = await users
      .find({}, { projection: { name: 1, email: 1, createdAt: 1 } })
      .sort({ createdAt: 1 })
      .limit(1)
      .toArray();
    if (earliest.length) {
      console.log(
        `\nThe earliest account is ${earliest[0].email} — it will be auto-promoted on next login.`
      );
      console.log(`Or promote it now:`);
      console.log(`  node scripts/super-admin-info.mjs promote ${earliest[0].email}`);
    }
    return;
  }

  console.log(`Super admins (${supers.length}):`);
  for (const u of supers) {
    console.log(`  · ${u.email}   (${u.name})   status=${u.status}`);
  }
  console.log(
    `\nTo reset a super-admin password:\n` +
      `  node scripts/super-admin-info.mjs reset ${supers[0].email} <new-password>`
  );
}

async function reset(users, email, password) {
  const lower = email.toLowerCase();
  const user = await users.findOne({ email: lower });
  if (!user) {
    console.error(`✗ no user with email ${lower}`);
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash,
        role: "super_admin",
        status: "active",
        approvedAt: user.approvedAt || new Date(),
        permissions: PERMS_SUPER,
      },
    }
  );
  console.log(`✓ ${lower} is now an ACTIVE super_admin with the new password.`);
  console.log(`  Log in at /login with:`);
  console.log(`    email:    ${lower}`);
  console.log(`    password: ${password}`);
}

async function promote(users, email) {
  const lower = email.toLowerCase();
  const r = await users.updateOne(
    { email: lower },
    {
      $set: {
        role: "super_admin",
        status: "active",
        approvedAt: new Date(),
        permissions: PERMS_SUPER,
      },
    }
  );
  if (r.matchedCount === 0) {
    console.error(`✗ no user with email ${lower}`);
    process.exit(1);
  }
  console.log(`✓ ${lower} promoted to super_admin (active).`);
  console.log(`  Log out & log back in to refresh the JWT.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
