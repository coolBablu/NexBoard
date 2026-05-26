/**
 * Snap the dashboard at the user's reported scroll position so we can
 * see which left-column card is rendering as a tall empty box.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "https://nexboard-beige.vercel.app";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
});
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.fill('input[type="email"]', "demo@novaflow.app");
await page.fill('input[type="password"]', "novaflow123");
await Promise.all([
  page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30_000 }).catch(() => null),
  page.click('button[type="submit"]'),
]);

await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);

// Full-page screenshot first
await page.screenshot({ path: "snap-dashboard-full.png", fullPage: true });

// Then capture every direct child of the main scroll area with height + selector.
const cards = await page.evaluate(() => {
  const main = document.querySelector("main") || document.body;
  const collect = [];
  const stack = main.querySelectorAll("section, article, div");
  for (const el of stack) {
    const r = el.getBoundingClientRect();
    if (r.height < 80) continue;
    const cls = (el.className || "").toString().slice(0, 80);
    if (!/rounded|border/i.test(cls)) continue;
    // Only report direct top-level cards in the grid.
    const text = el.innerText?.trim().slice(0, 60) || "";
    collect.push({ tag: el.tagName.toLowerCase(), h: Math.round(r.height), w: Math.round(r.width), y: Math.round(r.y), text, cls });
  }
  return collect.slice(0, 40);
});

console.log("Tallest cards on dashboard:");
cards
  .sort((a, b) => b.h - a.h)
  .slice(0, 15)
  .forEach((c) =>
    console.log(`  h=${String(c.h).padStart(4)} w=${String(c.w).padStart(4)} y=${String(c.y).padStart(4)} text="${c.text}"`)
  );

await browser.close();
