/**
 * Smoke test: chat + DM notifications.
 *
 *  1. Log in as demo super-admin (Alex)
 *  2. Find another workspace member (Maya / Dinesh)
 *  3. Open a DM with them
 *  4. Post a message in the DM as Alex
 *  5. Sign in AS Maya (separate context, programmatic)
 *  6. GET /api/notifications -> expect a "dm" notification from Alex
 *  7. Maya posts back in the DM
 *  8. As Alex, GET /api/notifications -> expect a "dm" from Maya
 *  9. Alex posts in #general
 * 10. Maya's notifications include a "message" entry for #general
 *
 * Coalescing check:
 * 11. Alex posts 3 more messages in #general within 5 minutes
 * 12. Maya's UNREAD message-kind count for that channel stays = 1
 */

import { request } from "playwright";

const BASE = process.env.NEX_TEST_URL || "http://localhost:3001";
const PASS = "novaflow123";

const ALEX = { email: "demo@novaflow.app", password: PASS };
// These two are seeded by demo-seed.ts as workspace members.
const MAYA = { email: "maya@novaflow.app", password: PASS };
const DINESH = { email: "dinesh@novaflow.app", password: PASS };

const step = (n, msg) => console.log(`\n──[ step ${n} ]── ${msg}`);
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.log(`  ✗ ${msg}`);
  process.exitCode = 1;
};

async function login(ctx, { email, password }) {
  const csrf = await (await ctx.get(`${BASE}/api/auth/csrf`)).json();
  const params = new URLSearchParams({
    email,
    password,
    csrfToken: csrf.csrfToken,
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
    throw new Error(`login failed for ${email} (${res.status()})`);
  }
  const data = await (await ctx.get(`${BASE}/api/auth/session`)).json();
  if (!data?.user?.id) throw new Error(`no session after login for ${email}`);
  return data.user;
}

async function run() {
  step(1, "log in as Alex (super-admin)");
  const alexCtx = await request.newContext();
  const alex = await login(alexCtx, ALEX);
  ok(`alex = ${alex.email} (id=${alex.id})`);

  step(2, "find another workspace member");
  const members = (await (await alexCtx.get(`${BASE}/api/members`)).json())
    .members ?? [];
  const peer = members.find((m) => m.email !== alex.email);
  if (!peer) {
    fail("no peer member found in workspace");
    return;
  }
  ok(`peer = ${peer.name} <${peer.email}>`);

  step(3, "open a DM with the peer");
  const dmRes = await alexCtx.post(`${BASE}/api/channels/dm`, {
    data: { userId: peer.id },
  });
  const dm = await dmRes.json();
  if (![200, 201].includes(dmRes.status())) {
    fail(`DM open returned ${dmRes.status()}: ${JSON.stringify(dm)}`);
    return;
  }
  ok(`dm channel = ${dm.id} (existed=${dm.existed})`);

  step(4, "alex posts a message in the DM");
  const postRes = await alexCtx.post(
    `${BASE}/api/channels/${dm.id}/messages`,
    { data: { body: `Hey ${peer.name.split(" ")[0]}, smoke-testing DM notifs` } }
  );
  if (postRes.status() !== 201) {
    fail(`DM post returned ${postRes.status()}`);
    return;
  }
  ok("alex posted in the DM");

  step(5, `sign in as ${peer.email}`);
  const peerCtx = await request.newContext();
  let peerUser;
  try {
    peerUser = await login(peerCtx, {
      email: peer.email,
      password: PASS,
    });
    ok(`logged in as ${peerUser.email}`);
  } catch (err) {
    fail(`could not log in as peer (${err.message}) — demo seed may use a different password`);
    return;
  }

  step(6, "peer's notifications include the new DM");
  const notif1 = await (await peerCtx.get(`${BASE}/api/notifications`)).json();
  const dmFromAlex = (notif1.notifications ?? []).find(
    (n) => n.kind === "dm" && !n.readAt && n.actor?.id === alex.id
  );
  if (dmFromAlex) {
    ok(`bell has unread DM: "${dmFromAlex.title}" (priority=${dmFromAlex.priority})`);
  } else {
    fail(`no DM notification found — unread=${notif1.unreadCount}, kinds=${(notif1.notifications ?? []).map(n => n.kind).join(",")}`);
  }

  step(7, "peer replies in the DM");
  const replyRes = await peerCtx.post(
    `${BASE}/api/channels/${dm.id}/messages`,
    { data: { body: "Got your test, replying" } }
  );
  if (replyRes.status() !== 201) fail(`peer reply returned ${replyRes.status()}`);
  else ok("peer replied");

  step(8, "alex sees the peer's DM in their bell");
  const notif2 = await (await alexCtx.get(`${BASE}/api/notifications`)).json();
  const dmBack = (notif2.notifications ?? []).find(
    (n) => n.kind === "dm" && !n.readAt && n.actor?.id === peerUser.id
  );
  if (dmBack) ok(`alex has unread DM from peer: "${dmBack.title}"`);
  else fail("alex didn't receive the peer's DM notification");

  step(9, "alex posts in a regular channel");
  const channels = (await (await alexCtx.get(`${BASE}/api/channels`)).json())
    .channels ?? [];
  const general = channels.find((c) => c.type === "channel");
  if (!general) {
    fail("no regular channel in workspace");
    return;
  }
  const chPost = await alexCtx.post(
    `${BASE}/api/channels/${general.id}/messages`,
    { data: { body: `Burst 1 from alex` } }
  );
  if (chPost.status() !== 201) fail(`channel post 1 returned ${chPost.status()}`);
  else ok(`alex posted in #${general.name}`);

  step(10, "peer has a 'message' kind notification for that channel");
  const notif3 = await (await peerCtx.get(`${BASE}/api/notifications`)).json();
  const chNotif = (notif3.notifications ?? []).find(
    (n) => n.kind === "message" && !n.readAt && n.actor?.id === alex.id
  );
  if (chNotif) ok(`peer's bell has channel notif: "${chNotif.title}"`);
  else fail("peer didn't receive channel-message notification");

  step(11, "alex posts 3 more messages in the same channel");
  for (let i = 2; i <= 4; i++) {
    const r = await alexCtx.post(
      `${BASE}/api/channels/${general.id}/messages`,
      { data: { body: `Burst ${i} from alex` } }
    );
    if (r.status() !== 201) fail(`burst ${i} returned ${r.status()}`);
  }
  ok("posted bursts 2-4");

  step(12, "coalescing: peer still has exactly ONE unread channel notif");
  const notif4 = await (await peerCtx.get(`${BASE}/api/notifications`)).json();
  const channelNotifs = (notif4.notifications ?? []).filter(
    (n) =>
      n.kind === "message" &&
      !n.readAt &&
      n.actor?.id === alex.id &&
      n.title.includes(general.name)
  );
  if (channelNotifs.length === 1) {
    ok(`coalescing works — 1 unread notif for #${general.name} (body: "${channelNotifs[0].body.slice(0, 60)}")`);
  } else {
    fail(`expected 1 coalesced notif, got ${channelNotifs.length}`);
  }

  // ── Edit + delete on own messages ───────────────────────────────────
  step(13, "alex edits his own DM message");
  const dmListRes = await alexCtx.get(`${BASE}/api/channels/${dm.id}/messages`);
  const dmList = (await dmListRes.json()).messages ?? [];
  const ownMsg = dmList.find((m) => m.author.id === alex.id);
  if (!ownMsg) {
    fail("alex's own DM message not found in listing");
    return;
  }
  const editRes = await alexCtx.patch(
    `${BASE}/api/channels/${dm.id}/messages/${ownMsg.id}`,
    { data: { body: "(edited) updated DM body" } }
  );
  if (editRes.status() !== 200) {
    fail(`edit returned ${editRes.status()}`);
  } else {
    const edited = await editRes.json();
    if (edited.body.startsWith("(edited)") && edited.editedAt) {
      ok(`edit ok — editedAt=${edited.editedAt}`);
    } else {
      fail(`edit response missing body/editedAt: ${JSON.stringify(edited)}`);
    }
  }

  step(14, "peer cannot edit alex's message (403)");
  const peerEditRes = await peerCtx.patch(
    `${BASE}/api/channels/${dm.id}/messages/${ownMsg.id}`,
    { data: { body: "peer trying to hijack" } }
  );
  if (peerEditRes.status() === 403) ok("peer correctly blocked from editing");
  else fail(`expected 403, got ${peerEditRes.status()}`);

  step(15, "peer cannot delete alex's message (403)");
  const peerDelRes = await peerCtx.delete(
    `${BASE}/api/channels/${dm.id}/messages/${ownMsg.id}`
  );
  if (peerDelRes.status() === 403) ok("peer correctly blocked from deleting");
  else fail(`expected 403, got ${peerDelRes.status()}`);

  step(16, "alex deletes his own DM message");
  const delRes = await alexCtx.delete(
    `${BASE}/api/channels/${dm.id}/messages/${ownMsg.id}`
  );
  if (delRes.status() === 200) ok("delete ok");
  else fail(`delete returned ${delRes.status()}`);

  step(17, "deleted message is gone from the listing");
  const afterDel = await (
    await alexCtx.get(`${BASE}/api/channels/${dm.id}/messages`)
  ).json();
  const stillThere = (afterDel.messages ?? []).some((m) => m.id === ownMsg.id);
  if (!stillThere) ok("message no longer in the channel listing");
  else fail("message still present after delete");

  await alexCtx.dispose();
  await peerCtx.dispose();

  if (!process.exitCode) {
    console.log("\n✅ chat + DM notification smoke test passed\n");
  } else {
    console.log("\n❌ smoke test had failures (see above)\n");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
