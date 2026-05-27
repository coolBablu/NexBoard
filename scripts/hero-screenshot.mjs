/**
 * Quick visual smoke test for the landing-page hero.
 * - Boots a Chromium against the local dev server
 * - Captures both the immediate hero-fold and a longer scroll-shot
 * - Reads computed background + a few key colors so we can confirm the
 *   "white hero, white nav, center glow" intent without eyeballing
 *
 * Usage:  node scripts/hero-screenshot.mjs [BASE_URL]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] || "http://localhost:3000";

await mkdir("hero-screens", { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

console.log(`→ ${BASE}/`);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
await page.waitForTimeout(2500);

const colors = await page.evaluate(() => {
  const body = document.body;
  const section = document.querySelector("section");
  const nav = document.querySelector("header nav");
  function readBg(el) {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color };
  }
  return {
    body: readBg(body),
    section: readBg(section),
    nav: readBg(nav),
  };
});

await page.screenshot({ path: "hero-screens/hero-fold.png", fullPage: false });

// Then take a taller frame so we can verify the stat strip + trust line
await page.setViewportSize({ width: 1440, height: 1300 });
await page.waitForTimeout(800);
await page.screenshot({ path: "hero-screens/hero-tall.png", fullPage: false });

console.log("\nKey computed colors (light theme expected):");
console.log(JSON.stringify(colors, null, 2));

await browser.close();
console.log("\n✓ Saved to hero-screens/hero-fold.png");
