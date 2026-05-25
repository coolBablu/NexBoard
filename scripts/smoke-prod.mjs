/**
 * Headless smoke test for production NexBoard:
 *  1. Login as demo user
 *  2. Visit /dashboard, /workspace, /team, /assistant, /analytics, /settings
 *  3. Capture console errors, page errors, and visible heading text
 *  4. Print a verdict per page
 *
 * Usage:  node scripts/smoke-prod.mjs [BASE_URL]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "https://nexboard-beige.vercel.app";
const EMAIL = "demo@novaflow.app";
const PASS = "novaflow123";

const PAGES = [
  { path: "/dashboard", expect: ["Dashboard", "Alex"] },
  { path: "/workspace", expect: ["Projects", "Payments"] },
  { path: "/team", expect: ["Chat", "Activity", "general"] },
  { path: "/assistant", expect: ["Nova"] },
  { path: "/analytics", expect: ["Analytics"] },
  { path: "/settings", expect: ["Settings", "Profile"] },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push({ type: "console", text: m.text() });
});
page.on("pageerror", (e) => errors.push({ type: "pageerror", text: String(e?.message ?? e) }));

console.log(`→ Logging in as ${EMAIL}…`);
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
const [resp] = await Promise.all([
  page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30_000 }).catch(() => null),
  page.click('button[type="submit"]'),
]);
const afterLogin = page.url();
console.log(`  ← landed at ${afterLogin}`);
if (afterLogin.includes("/login")) {
  console.log("  ✗ login failed; aborting");
  console.log(JSON.stringify(errors, null, 2));
  await browser.close();
  process.exit(1);
}

for (const p of PAGES) {
  errors.length = 0;
  console.log(`\n→ ${p.path}`);
  const before = Date.now();
  // Use domcontentloaded — SWR keeps polling so networkidle never resolves.
  await page.goto(`${BASE}${p.path}`, { waitUntil: "domcontentloaded", timeout: 20_000 }).catch((e) => {
    console.log(`  ✗ navigation failed: ${e.message}`);
  });
  // Give React a beat to hydrate + render.
  await page.waitForTimeout(2500);

  const html = await page.content();
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 800));
  const charsVisible = bodyText.trim().length;

  const matched = p.expect.filter((s) => bodyText.includes(s));
  const verdict =
    charsVisible < 50 ? "✗ BLANK" :
    matched.length === 0 ? "⚠ no expected text" :
    `✓ ${matched.length}/${p.expect.length} markers`;

  console.log(`  loaded in ${Date.now() - before}ms · ${charsVisible} chars · ${verdict}`);
  if (errors.length) {
    console.log(`  ${errors.length} client error(s):`);
    for (const e of errors.slice(0, 4)) {
      console.log(`    [${e.type}] ${e.text.slice(0, 280)}`);
    }
  }
  if (charsVisible < 200) {
    console.log(`  body preview: ${JSON.stringify(bodyText.slice(0, 200))}`);
  }
}

console.log("\n→ Inbox button click test (from /dashboard)…");
errors.length = 0;
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const bellSel = 'button[aria-label*="Notifications" i]';
const bell = await page.$(bellSel);
if (!bell) {
  console.log("  ✗ no notification bell found in DOM");
} else {
  await bell.click().catch((e) => console.log(`  ✗ click error: ${e.message}`));
  await page.waitForTimeout(800);
  const popOpen = await page.$('text=Inbox');
  console.log(popOpen ? "  ✓ inbox popover opened" : "  ✗ inbox popover did NOT open");
  if (errors.length) {
    for (const e of errors.slice(0, 4)) {
      console.log(`    [${e.type}] ${e.text.slice(0, 280)}`);
    }
  }
}

await browser.close();
