/**
 * Capture clean, fully-styled screenshots of the lockdown screens for
 * the user to eyeball.
 */
import { chromium } from "playwright";

const BASE = process.env.NEX_TEST_URL || "http://localhost:3000";

async function shoot(page, url, file) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.waitForLoadState("load");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `screens/${file}`, fullPage: true });
  console.log(`  → ${file}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();

console.log("Capturing lockdown screens…");
await shoot(page, "/signup", "signup-disabled-clean.png");
await shoot(page, "/login", "login-no-signup.png");

// Programmatic login as super-admin so we can shoot /admin invite dialog
const csrf = await page.request.get(`${BASE}/api/auth/csrf`).then((r) => r.json());
const form = new URLSearchParams();
form.set("email", "demo@novaflow.app");
form.set("password", "novaflow123");
form.set("csrfToken", csrf.csrfToken);
form.set("callbackUrl", `${BASE}/dashboard`);
form.set("json", "true");
await page.request.post(`${BASE}/api/auth/callback/credentials?`, {
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  data: form.toString(),
});

await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.locator("button", { hasText: "Add member" }).first().click();
await page.waitForTimeout(2500);
await page.screenshot({
  path: `screens/admin-invite-domain-hint.png`,
  fullPage: true,
});
console.log("  → admin-invite-domain-hint.png");

await browser.close();
console.log("Done.");
