/**
 * End-to-end smoke test for the super-admin flow.
 *
 *  1. Demo super-admin logs in via UI
 *  2. Session JSON shows role=super_admin
 *  3. Sidebar shows Admin entry
 *  4. /admin renders with Members + Pending tabs
 *  5. POST /api/signup creates a brand-new user (pending)
 *  6. /admin?status=pending lists the new user
 *  7. POST /api/admin/users/[id]/approve flips them to active
 *  8. /admin?status=active now lists them
 */

import { chromium } from "playwright";

const BASE = process.env.NEX_TEST_URL || "http://localhost:3000";
const STAMP = Date.now().toString(36);

const NEW_USER = {
  firstName: "Test",
  lastName: `User${STAMP.slice(-4)}`,
  email: `test-${STAMP}@nexboard.local`,
  password: "Password!234",
  workspaceSlug: `ws-${STAMP}`,
};

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

async function loginCredentials(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator("input[name='email']").fill(email);
  await page.locator("input[name='password']").fill(password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 }),
    page.locator("button[type='submit']").click(),
  ]);
}

async function run() {
  const browser = await chromium.launch();

  // ── 1) Demo super admin logs in
  step(1, "demo super-admin logs in");
  const adminCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const admin = await adminCtx.newPage();
  await loginCredentials(admin, DEMO.email, DEMO.password);
  ok(`demo logged in (at ${admin.url()})`);

  // ── 2) Verify session shows role=super_admin
  step(2, "verify session.user.role === 'super_admin'");
  const sessionRes = await admin.request.get(`${BASE}/api/auth/session`);
  const session = await sessionRes.json();
  if (session?.user?.role === "super_admin") {
    ok(`session.user.role = ${session.user.role}, status = ${session.user.accountStatus}`);
  } else {
    fail(`expected role=super_admin, got ${JSON.stringify(session?.user)}`);
  }

  // ── 3) Sidebar shows Admin link
  step(3, "sidebar exposes Admin entry");
  await admin.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await admin.waitForTimeout(2500);
  const sidebarAdmin = admin.locator("aside a[href='/admin']").first();
  const sidebarVisible = (await sidebarAdmin.count()) > 0;
  if (sidebarVisible) {
    ok("sidebar Admin link rendered");
  } else {
    fail("sidebar Admin link missing — UI gate failed");
  }
  await admin.screenshot({ path: "screens/admin-dashboard.png", fullPage: true });

  // ── 4) /admin renders
  step(4, "open /admin");
  await admin.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  await admin.waitForTimeout(3000);
  if (admin.url().includes("/admin")) {
    ok("/admin loaded (not redirected)");
  } else {
    fail(`/admin redirected → ${admin.url()}`);
  }
  await admin.screenshot({ path: "screens/admin-initial.png", fullPage: true });

  // ── 5) Brand-new user signs up via API
  step(5, `signup ${NEW_USER.email} directly via API`);
  const signupRes = await admin.request.post(`${BASE}/api/signup`, {
    data: NEW_USER,
    headers: { "Content-Type": "application/json" },
  });
  const signup = await signupRes.json();
  if (signupRes.ok() && signup.pending) {
    ok(`signup ok — user landed pending (id=${signup.user.id})`);
  } else if (signupRes.ok()) {
    fail(`signup ok but expected pending=true, got: ${JSON.stringify(signup)}`);
  } else {
    fail(`signup failed (${signupRes.status()}): ${JSON.stringify(signup)}`);
  }
  const newUserId = signup?.user?.id;

  // ── 6) Pending tab lists the new user
  step(6, "verify pending list contains new user");
  const pendingRes = await admin.request.get(`${BASE}/api/admin/users?status=pending`);
  const pending = await pendingRes.json();
  const foundPending = pending.users?.find((u) => u.email === NEW_USER.email);
  if (foundPending) {
    ok(`new user in pending list — role=${foundPending.role}, status=${foundPending.status}`);
  } else {
    fail(`new user NOT in pending list: ${JSON.stringify(pending.counts)}`);
  }

  // Reload /admin in browser, capture pending screen
  await admin.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  await admin.waitForTimeout(2500);
  await admin.screenshot({ path: "screens/admin-pending.png", fullPage: true });
  const rowVisible = await admin
    .locator(`text=${NEW_USER.email}`)
    .first()
    .isVisible()
    .catch(() => false);
  if (rowVisible) ok("pending row visible in /admin UI");
  else fail(`pending row NOT visible in /admin UI for ${NEW_USER.email}`);

  // ── 7) Approve via API
  step(7, "approve via /api/admin/users/[id]/approve");
  const approveRes = await admin.request.post(
    `${BASE}/api/admin/users/${newUserId}/approve`
  );
  const approve = await approveRes.json();
  if (approveRes.ok() && approve.ok) {
    ok("approval API returned ok");
  } else {
    fail(`approval failed: ${JSON.stringify(approve)}`);
  }

  // ── 8) Active list now contains new user
  step(8, "verify user is in active list");
  const activeRes = await admin.request.get(`${BASE}/api/admin/users?status=active`);
  const active = await activeRes.json();
  const foundActive = active.users?.find((u) => u.email === NEW_USER.email);
  if (foundActive) {
    ok(`new user in active list — role=${foundActive.role}, status=${foundActive.status}`);
  } else {
    fail(`new user NOT in active list`);
  }

  await admin.goto(`${BASE}/admin?_t=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await admin.waitForTimeout(2000);
  // Switch to Active tab
  await admin.locator("button[role='tab']", { hasText: "Active" }).click();
  await admin.waitForTimeout(1500);
  await admin.screenshot({ path: "screens/admin-active.png", fullPage: true });

  // ── 9) Non-admin user can't reach /admin
  step(9, "verify non-admin user is blocked from /admin");
  const nonAdminCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const nonAdmin = await nonAdminCtx.newPage();
  // Approved user logs in (they have role=member now)
  await loginCredentials(nonAdmin, NEW_USER.email, NEW_USER.password);
  await nonAdmin.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  await nonAdmin.waitForTimeout(2500);
  if (nonAdmin.url().includes("/admin")) {
    fail(`non-admin reached /admin (security bug!) at ${nonAdmin.url()}`);
  } else {
    ok(`non-admin redirected to ${nonAdmin.url()}`);
  }

  // ── 10) Confirm /awaiting-approval renders for an authenticated session
  //   (a pending user would be redirected here by middleware; here we
  //    just verify the page route compiles and renders.)
  step(10, "verify /awaiting-approval renders");
  await admin.goto(`${BASE}/awaiting-approval`, { waitUntil: "domcontentloaded" });
  await admin.waitForTimeout(2000);
  const awaitingText = await admin
    .locator("text=in the queue")
    .first()
    .isVisible()
    .catch(() => false);
  if (awaitingText) {
    ok("/awaiting-approval renders the pending screen");
  } else {
    fail("/awaiting-approval did not render expected content");
  }
  await admin.screenshot({
    path: "screens/awaiting-approval.png",
    fullPage: true,
  });

  console.log(
    process.exitCode === 1
      ? "\n❌ admin flow had failures — see logs above"
      : "\n✅ admin flow smoke test passed"
  );
  await browser.close();
}

run().catch((err) => {
  console.error("\n❌ admin flow crashed:", err);
  process.exit(1);
});
