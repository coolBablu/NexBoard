/**
 * Verifies the post-lockdown auth behavior:
 *
 *  1. GET /signup renders the "by invitation only" disabled screen
 *  2. POST /api/signup with an existing populated DB returns 403
 *  3. /login no longer links to /signup
 *  4. Admin invite enforces the auto-derived company email domain
 *  5. Admin invite with the correct domain succeeds
 */

import { chromium, request as pwRequest } from "playwright";

const BASE = process.env.NEX_TEST_URL || "http://localhost:3000";

const DEMO = {
  email: process.env.DEMO_EMAIL || "demo@novaflow.app",
  password: process.env.DEMO_PASSWORD || "novaflow123",
};

const step = (n, m) => console.log(`\n──[ step ${n} ]── ${m}`);
const ok = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  console.log(`  ✗ ${m}`);
  process.exitCode = 1;
};

/**
 * Programmatic NextAuth credentials login. Posts directly to the
 * /api/auth/callback/credentials endpoint to avoid the React
 * hydration race the UI form can hit in CI.
 */
async function login(page) {
  const csrf = await page.request.get(`${BASE}/api/auth/csrf`).then((r) => r.json());
  const form = new URLSearchParams();
  form.set("email", DEMO.email);
  form.set("password", DEMO.password);
  form.set("csrfToken", csrf.csrfToken);
  form.set("callbackUrl", `${BASE}/dashboard`);
  form.set("json", "true");
  const res = await page.request.post(
    `${BASE}/api/auth/callback/credentials?`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      data: form.toString(),
    }
  );
  if (!res.ok()) {
    throw new Error(`login failed: ${res.status()}`);
  }
  // Confirm the session cookie was set.
  const sess = await page.request.get(`${BASE}/api/auth/session`).then((r) => r.json());
  if (!sess?.user?.email) {
    throw new Error(`session empty after login: ${JSON.stringify(sess)}`);
  }
}

async function run() {
  const browser = await chromium.launch();

  // ── 1) /signup shows the disabled screen
  step(1, "/signup renders 'invitation only' screen");
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const disabledCopy = await page
    .locator("text=invitation only", { ignoreCase: false })
    .first()
    .isVisible()
    .catch(() => false);
  if (disabledCopy) ok("disabled screen visible");
  else fail("disabled screen NOT rendered");
  await page.screenshot({ path: "screens/signup-disabled.png", fullPage: true });

  // ── 2) /api/signup returns 403 (DB already has users from the demo seed)
  step(2, "/api/signup is gated to first-account-only");
  const anon = await pwRequest.newContext();
  const r1 = await anon.post(`${BASE}/api/signup`, {
    data: {
      firstName: "Block",
      lastName: "Me",
      email: `block-${Date.now()}@anywhere.test`,
      password: "Password!234",
      workspaceSlug: `blocked-${Date.now()}`,
    },
    headers: { "Content-Type": "application/json" },
  });
  if (r1.status() === 403) {
    ok(`/api/signup returned 403`);
  } else {
    fail(`/api/signup returned ${r1.status()} (expected 403)`);
  }

  // ── 3) /login no longer has a sign-up link
  step(3, "/login has no /signup link");
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const signupLink = await page.locator("a[href='/signup']").count();
  if (signupLink === 0) ok("no /signup link present");
  else fail(`found ${signupLink} link(s) to /signup on /login`);

  // ── 4) Domain enforcement on admin invite
  step(4, "admin invite rejects wrong-domain email");
  const admin = await ctx.newPage();
  await login(admin);
  const cfgRes = await admin.request.get(`${BASE}/api/admin/config`);
  const cfg = await cfgRes.json();
  const domain = cfg.inviteDomain;
  ok(`derived invite domain = ${domain}`);

  const wrongDomain = await admin.request.post(`${BASE}/api/admin/users`, {
    data: {
      name: "Wrong Domain",
      email: `wrong-${Date.now()}@evil.com`,
      role: "member",
    },
    headers: { "Content-Type": "application/json" },
  });
  if (wrongDomain.status() === 422) {
    ok(`wrong-domain invite rejected (422)`);
  } else {
    fail(`wrong-domain returned ${wrongDomain.status()} (expected 422)`);
  }

  // ── 5) Correct-domain invite succeeds
  step(5, "admin invite with correct domain succeeds");
  const stamp = Date.now().toString(36);
  const goodEmail = `seed-${stamp}@${domain}`;
  const goodRes = await admin.request.post(`${BASE}/api/admin/users`, {
    data: { name: `Seed ${stamp}`, email: goodEmail, role: "member" },
    headers: { "Content-Type": "application/json" },
  });
  const good = await goodRes.json();
  if (goodRes.ok() && good.user?.status === "active") {
    ok(
      `member created — id=${good.user.id}, temp password=${good.temporaryPassword?.slice(0, 4)}…`
    );
  } else {
    fail(`good invite failed: ${JSON.stringify(good)}`);
  }

  // ── 6) Invite dialog opens + /api/admin/config returns the domain
  step(6, "invite dialog opens, /api/admin/config exposes domain");
  if (cfg.inviteDomain) {
    ok(`/api/admin/config.inviteDomain = ${cfg.inviteDomain}`);
  } else {
    fail("/api/admin/config did not return inviteDomain");
  }

  await admin.goto(`${BASE}/admin`, { waitUntil: "load" });
  await admin.waitForLoadState("networkidle");
  await admin.waitForTimeout(2000);

  // Wait for sidebar's Admin entry to mean the session is wired.
  await admin
    .waitForSelector("aside a[href='/admin']", { timeout: 10000 })
    .catch(() => null);

  const addBtn = admin.locator("button", { hasText: "Add member" }).first();
  if (await addBtn.count()) {
    await addBtn.click();
    await admin.waitForTimeout(2500);
    const dialogOpen = await admin
      .locator("[role='dialog']")
      .first()
      .isVisible()
      .catch(() => false);
    if (dialogOpen) ok("Add member dialog opened");
    else fail("dialog did not open");
    await admin.screenshot({
      path: "screens/admin-invite-dialog.png",
      fullPage: true,
    });
  } else {
    fail("Add member button not present on /admin");
  }

  console.log(
    process.exitCode === 1
      ? "\n❌ lockdown test had failures"
      : "\n✅ lockdown test passed"
  );
  await browser.close();
}

run().catch((err) => {
  console.error("\n❌ lockdown crashed:", err);
  process.exit(1);
});
