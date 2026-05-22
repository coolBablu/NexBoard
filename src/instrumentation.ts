/**
 * Next.js instrumentation hook — runs once when the server boots,
 * before any request is handled.
 *
 * In demo mode we start the single in-memory MongoDB instance here
 * and write its URI to disk so all other server contexts (which
 * have their own webpack bundles) can read the same URI instead of
 * spawning their own MongoDB.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Validate environment FIRST so a misconfigured deploy fails loudly
  // at boot, not at the first request. Throws and surfaces in Vercel
  // build / runtime logs with a readable error summary.
  await import("./lib/env");

  if (process.env.DEMO_MODE === "true") {
    const { getDemoMongoUri } = await import("./lib/demo-mongo");
    await getDemoMongoUri({ initialize: true });
  }
}
