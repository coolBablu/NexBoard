/**
 * End-to-end smoke test for chat + DM + file sharing.
 *
 *  1. Demo super-admin logs in (programmatic)
 *  2. GET /api/channels returns the workspace channels
 *  3. POST /api/upload with a small text file -> 201, returns { id, url }
 *  4. GET /api/files/<id> streams the same bytes back
 *  5. GET /api/files lists the uploaded file
 *  6. POST /api/channels/[id]/messages with attachments succeeds
 *  7. POST /api/channels/dm to self -> 400
 *  8. DELETE /api/files/<id> cleans up
 */

import { request } from "playwright";

const BASE = process.env.NEX_TEST_URL || "http://localhost:3000";

const DEMO = {
  email: process.env.DEMO_EMAIL || "demo@novaflow.app",
  password: process.env.DEMO_PASSWORD || "novaflow123",
};

const step = (n, msg) => console.log(`\n──[ step ${n} ]── ${msg}`);
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.log(`  ✗ ${msg}`);
  process.exitCode = 1;
};

async function programmaticLogin(ctx) {
  const csrfRes = await ctx.get(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const params = new URLSearchParams({
    email: DEMO.email,
    password: DEMO.password,
    csrfToken,
    redirect: "false",
    callbackUrl: `${BASE}/dashboard`,
    json: "true",
  });
  const res = await ctx.post(`${BASE}/api/auth/callback/credentials`, {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: params.toString(),
    maxRedirects: 0,
  });
  if (![200, 302].includes(res.status())) {
    throw new Error(`login failed (status ${res.status()})`);
  }
  const sess = await ctx.get(`${BASE}/api/auth/session`);
  const data = await sess.json();
  if (!data?.user?.id) throw new Error("no session after login");
  return data.user;
}

async function run() {
  const ctx = await request.newContext();

  step(1, "log in as demo super-admin");
  const me = await programmaticLogin(ctx);
  ok(`logged in as ${me.email} (role=${me.role ?? "?"})`);

  step(2, "list channels");
  const chRes = await ctx.get(`${BASE}/api/channels`);
  const channels = (await chRes.json()).channels ?? [];
  if (channels.length === 0) fail("no channels in workspace");
  else ok(`${channels.length} channel(s) — first is #${channels[0].name}`);
  const generalId = channels.find((c) => c.type === "channel")?.id ?? channels[0]?.id;

  step(3, "upload a small text file");
  const payload = `Hello from NexBoard smoke test @ ${new Date().toISOString()}\n`;
  const upRes = await ctx.post(`${BASE}/api/upload`, {
    multipart: {
      file: {
        name: "smoke.txt",
        mimeType: "text/plain",
        buffer: Buffer.from(payload, "utf8"),
      },
    },
  });
  if (upRes.status() !== 201) {
    fail(`upload returned ${upRes.status()}`);
    console.log(await upRes.text());
    return;
  }
  const uploaded = await upRes.json();
  ok(`upload ok — id=${uploaded.id}, url=${uploaded.url}, storage=${uploaded.storage}`);

  step(4, "stream the file back");
  const dlRes = await ctx.get(`${BASE}${uploaded.url}`);
  if (dlRes.status() !== 200) {
    fail(`download returned ${dlRes.status()}`);
  } else {
    const text = await dlRes.text();
    if (text === payload) ok("downloaded bytes match what we uploaded");
    else fail(`bytes mismatch (got ${text.length}B, expected ${payload.length}B)`);
  }

  step(5, "list files");
  const listRes = await ctx.get(`${BASE}/api/files`);
  const list = await listRes.json();
  if (list.files?.some((f) => f.id === uploaded.id)) {
    ok(`/api/files includes our upload (total=${list.total})`);
  } else {
    fail("uploaded file not in /api/files listing");
  }

  step(6, "send a chat message with an attachment");
  if (generalId) {
    const msgRes = await ctx.post(
      `${BASE}/api/channels/${generalId}/messages`,
      {
        data: {
          body: "Smoke test: sharing a doc 📄",
          attachments: [
            {
              name: uploaded.name,
              mime: uploaded.mime,
              size: uploaded.size,
              url: uploaded.url,
            },
          ],
        },
      }
    );
    if (msgRes.status() === 201) ok(`message posted to channel ${generalId}`);
    else fail(`message POST returned ${msgRes.status()}`);
  } else {
    fail("no channel available to test message");
  }

  step(7, "DM to self should be rejected");
  const selfDm = await ctx.post(`${BASE}/api/channels/dm`, {
    data: { userId: me.id },
  });
  if (selfDm.status() === 400) ok("self-DM rejected (400)");
  else fail(`expected 400 self-DM rejection, got ${selfDm.status()}`);

  step(8, "delete the uploaded file");
  const delRes = await ctx.delete(`${BASE}/api/files/${uploaded.id}`);
  if (delRes.status() === 200) ok("file deleted");
  else fail(`delete returned ${delRes.status()}`);

  await ctx.dispose();
  if (!process.exitCode) console.log("\n✅ chat + files smoke test passed\n");
  else console.log("\n❌ smoke test had failures (see above)\n");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
