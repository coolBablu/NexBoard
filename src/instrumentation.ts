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
  // at boot, not at the first request. Wrapped in try-catch so a bad
  // env config never crashes the serverless function boot — instead the
  // error is logged once and DB-backed routes surface a clean 503.
  try {
    await import("./lib/env");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[instrumentation] env validation failed:", err);
  }

  // mongodb-memory-server cannot run inside a Vercel serverless function
  // (no persistent fs, restricted egress, binary download not possible).
  // Skip the spawn so DB-backed routes degrade cleanly with a helpful
  // error instead of taking the whole runtime down with a boot crash.
  if (process.env.DEMO_MODE === "true" && !process.env.VERCEL) {
    try {
      const { getDemoMongoUri } = await import("./lib/demo-mongo");
      await getDemoMongoUri({ initialize: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[instrumentation] demo-mongo failed to start:", err);
    }
  }
}
