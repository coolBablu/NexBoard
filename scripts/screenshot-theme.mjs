/**
 * Capture a quick visual sweep of the new Linear Light theme:
 *  1. Login as demo
 *  2. Visit /dashboard, /inbox, /calendar, /workspace, /projects,
 *     /team, /assistant, /analytics, /settings
 *  3. Screenshot each at 1440x900 + check it actually has visible content
 *
 * Usage:  node scripts/screenshot-theme.mjs [BASE_URL]
 *
 * Output: ./theme-screens/*.png  (gitignored)
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] || "https://nexboard-beige.vercel.app";
const EMAIL = "demo@novaflow.app";
const PASS = "novaflow123";

const PAGES = [
  "/dashboard",
  "/inbox",
  "/calendar",
  "/workspace",
  "/projects",
  "/team",
  "/assistant",
  "/analytics",
  "/settings",
];

await mkdir("theme-screens", { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push({ type: "console", text: m.text() });
});
page.on("pageerror", (e) =>
  errors.push({ type: "pageerror", text: String(e?.message ?? e) })
);

console.log(`→ Logging in as ${EMAIL}…`);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await Promise.all([
  page
    .waitForURL((u) => !u.toString().includes("/login"), { timeout: 30_000 })
    .catch(() => null),
  page.click('button[type="submit"]'),
]);

if (page.url().includes("/login")) {
  console.log("✗ login failed; aborting");
  console.log(JSON.stringify(errors, null, 2));
  await browser.close();
  process.exit(1);
}
console.log(`  ← landed at ${page.url()}`);

for (const p of PAGES) {
  errors.length = 0;
  await page
    .goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 20_000 })
    .catch((e) => console.log(`  ✗ navigation failed: ${e.message}`));
  // Give SWR + dynamic-import skeletons enough time to resolve.
  await page.waitForTimeout(5500);

  // Read computed body background — verifies LIGHT theme actually shipped.
  const bg = await page
    .evaluate(() => {
      const cs = getComputedStyle(document.body);
      return {
        bg: cs.backgroundColor,
        fg: cs.color,
        bodyText: document.body.innerText.length,
      };
    })
    .catch(() => ({ bg: "?", fg: "?", bodyText: 0 }));

  const file = `theme-screens${p.replace(/\//g, "-") || "-home"}.png`;
  await page.screenshot({ path: file, fullPage: false }).catch(() => null);

  const isLight = /\b25[0-5]|\b24[0-9]|\b23[0-9]|\b22[0-9]/.test(bg.bg);
  const verdict = isLight ? "✓ LIGHT" : "✗ NOT LIGHT";
  console.log(
    `${p}  bg=${bg.bg}  text=${bg.bodyText} chars  ${verdict}  err=${errors.length}  → ${file}`
  );
  if (errors.length) {
    for (const e of errors.slice(0, 2)) {
      console.log(`    [${e.type}] ${e.text.slice(0, 200)}`);
    }
  }
}

await browser.close();
console.log("\n✓ Screenshots saved to ./theme-screens/");
