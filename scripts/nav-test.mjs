/**
 * Click-test every primary sidebar link from /dashboard to verify
 * client-side navigation actually works on the first click (no hard
 * refresh required).
 *
 * Catches regressions like the no-store Cache-Control header that
 * silently broke RSC prefetch + App Router navigation.
 *
 * Usage:  node scripts/nav-test.mjs [BASE_URL]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "https://nexboard-beige.vercel.app";
const EMAIL = "demo@novaflow.app";
const PASS = "novaflow123";

const LINKS = [
  { href: "/inbox", label: "Inbox" },
  { href: "/calendar", label: "Calendar" },
  { href: "/workspace", label: "Workspace" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/analytics", label: "Analytics" },
  { href: "/assistant", label: "AI Assistant" },
  { href: "/settings", label: "Settings" },
  { href: "/dashboard", label: "Dashboard" },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
});
const page = await ctx.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[console] ${m.text().slice(0, 160)}`);
});
page.on("pageerror", (e) =>
  errors.push(`[pageerror] ${String(e?.message ?? e).slice(0, 160)}`)
);

console.log(`→ Logging in as ${EMAIL}…`);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await Promise.all([
  page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30_000 }).catch(() => null),
  page.click('button[type="submit"]'),
]);

if (page.url().includes("/login")) {
  console.log("✗ login failed");
  await browser.close();
  process.exit(1);
}
console.log(`  ← landed at ${page.url()}\n`);

// Wait for sidebar to settle.
await page.waitForTimeout(2000);

let passed = 0;
let failed = 0;

for (const { href, label } of LINKS) {
  errors.length = 0;
  const before = page.url();
  const t0 = Date.now();

  const link = page.locator(`a[href="${href}"]`).first();
  const exists = (await link.count()) > 0;
  if (!exists) {
    console.log(`✗ ${label.padEnd(14)} link not found in sidebar`);
    failed++;
    continue;
  }

  // Click and wait for URL to change. NO reload allowed.
  let urlChanged = false;
  const urlChangePromise = page
    .waitForURL((u) => u.toString().endsWith(href), { timeout: 6_000 })
    .then(() => {
      urlChanged = true;
    })
    .catch(() => null);

  await link.click();
  await urlChangePromise;

  // After URL change, the page should render its main content in <1.5s.
  await page.waitForTimeout(1500);
  const visibleText = await page
    .evaluate(() => document.body.innerText.length)
    .catch(() => 0);

  const elapsed = Date.now() - t0;
  const after = page.url();

  if (!urlChanged || !after.endsWith(href)) {
    console.log(
      `✗ ${label.padEnd(14)} URL did not change (${before} → ${after}) — first click failed`
    );
    failed++;
  } else if (visibleText < 400) {
    console.log(
      `✗ ${label.padEnd(14)} navigated but body is empty (${visibleText} chars)`
    );
    failed++;
  } else {
    console.log(
      `✓ ${label.padEnd(14)} ${href.padEnd(12)} ${elapsed}ms  body=${visibleText} chars`
    );
    passed++;
  }
  if (errors.length) {
    for (const e of errors.slice(0, 1)) console.log(`     ${e}`);
  }
}

console.log(`\n${passed}/${LINKS.length} sidebar links navigated on FIRST click.`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
