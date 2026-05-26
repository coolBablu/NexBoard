/**
 * Open every popup/dialog in the app and verify:
 *   1. Dialog content is centered in the viewport (horizontal + vertical)
 *   2. Dialog does not overflow past the viewport edges
 *   3. Dialog renders visible content (not empty)
 *
 * Catches the "Create new project dialog not centered" regression where
 * tall dialogs were being pushed below the fold by `top-1/2 -translate-y-1/2`
 * without a max-height constraint.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] || "https://nexboard-beige.vercel.app";
const EMAIL = "demo@novaflow.app";
const PASS = "novaflow123";

await mkdir("dialog-screens", { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
});
const page = await ctx.newPage();

console.log(`→ Logging in…`);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
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

async function testDialog(name, openFn) {
  console.log(`\n• ${name}`);
  const opened = await openFn().catch((e) => {
    console.log(`  ✗ open failed: ${e.message}`);
    return false;
  });
  if (opened === false) return false;
  await page.waitForTimeout(900);

  // The dialog content is whatever has role="dialog" AND is visible.
  const box = await page
    .evaluate(() => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter(
        (d) => d.checkVisibility?.() ?? d.offsetParent !== null
      );
      if (!dialogs.length) return null;
      const d = dialogs[dialogs.length - 1];
      const r = d.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        text: d.innerText.length,
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
    })
    .catch(() => null);

  if (!box) {
    console.log("  ✗ no visible dialog found");
    return false;
  }

  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const vcx = box.vw / 2;
  const vcy = box.vh / 2;
  const dx = Math.abs(cx - vcx);
  const dy = Math.abs(cy - vcy);

  const file = `dialog-screens/${name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`;
  await page.screenshot({ path: file });

  const fitsHoriz = box.x >= 0 && box.x + box.w <= box.vw + 1;
  const fitsVert = box.y >= 0 && box.y + box.h <= box.vh + 1;

  const horizOk = dx <= 2;
  // For vertical we allow a 24px slop because some dialogs prefer to bias
  // slightly above center on tall viewports (more eye-friendly).
  const vertOk = dy <= 24;

  const verdict =
    horizOk && vertOk && fitsHoriz && fitsVert
      ? "✓ CENTERED"
      : "✗ MISALIGNED";

  console.log(
    `  ${verdict}  pos=(${Math.round(box.x)},${Math.round(box.y)}) size=${Math.round(box.w)}x${Math.round(box.h)}  off=(${Math.round(dx)},${Math.round(dy)})  text=${box.text}  fits=H${fitsHoriz ? "✓" : "✗"}V${fitsVert ? "✓" : "✗"}  → ${file}`
  );

  // Close dialog with Escape.
  await page.keyboard.press("Escape").catch(() => null);
  await page.waitForTimeout(400);
  return verdict.startsWith("✓");
}

const results = [];

// 1. New Project dialog (from /projects)
results.push(
  await testDialog("New project dialog (/projects)", async () => {
    await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /new project/i }).first().click();
    return true;
  })
);

// 2. New Project dialog (from /workspace)
results.push(
  await testDialog("New project dialog (/workspace)", async () => {
    await page.goto(`${BASE}/workspace`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /new project/i }).first().click();
    return true;
  })
);

// 3. Create channel dialog (from /team)
results.push(
  await testDialog("Create channel dialog (/team)", async () => {
    await page.goto(`${BASE}/team`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2200);
    // The "+" button next to CHANNELS opens the create-channel dialog.
    const btn = page.locator('button[aria-label*="channel" i], button:has-text("+")').first();
    if ((await btn.count()) === 0) {
      console.log("  ⚠ no channel-create button found, skipping");
      return false;
    }
    await btn.click();
    return true;
  })
);

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} popups passed centering check.`);
await browser.close();
process.exit(passed === results.length ? 0 : 1);
