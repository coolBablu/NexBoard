/**
 * Centralised, type-safe environment variable access.
 *
 * Imported at server boot via `instrumentation.ts` so misconfigured
 * production deployments fail fast with a readable error instead of
 * crashing on the first request.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const uri = env.MONGODB_URI;          // string | undefined
 *   const isDemo = env.DEMO_MODE;         // boolean
 *
 * To require a value at the call site:
 *   import { requireEnv } from "@/lib/env";
 *   const secret = requireEnv("NEXTAUTH_SECRET");
 */

import { z } from "zod";

const trueish = ["true", "1", "yes", "on"];

const envSchema = z
  .object({
    // ── Runtime ────────────────────────────────────────────────
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // ── App ────────────────────────────────────────────────────
    NEXT_PUBLIC_APP_URL: z
      .string()
      .url()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),

    // ── Demo mode ──────────────────────────────────────────────
    DEMO_MODE: z
      .string()
      .optional()
      .transform((v) => (v ? trueish.includes(v.toLowerCase()) : false)),

    // ── MongoDB ────────────────────────────────────────────────
    MONGODB_URI: z.string().optional(),
    MONGODB_DB: z.string().default("novaflow"),

    // ── NextAuth (Auth.js v5) ──────────────────────────────────
    NEXTAUTH_SECRET: z.string().min(16).optional(),
    AUTH_SECRET: z.string().min(16).optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    AUTH_TRUST_HOST: z
      .string()
      .optional()
      .transform((v) => (v ? trueish.includes(v.toLowerCase()) : false)),

    // ── OAuth (optional) ───────────────────────────────────────
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),

    // ── AI ─────────────────────────────────────────────────────
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  })
  .superRefine((data, ctx) => {
    // Production-only invariants (skip in test + dev).
    if (data.NODE_ENV !== "production") return;
    if (data.DEMO_MODE) return; // demo mode is allowed in prod previews

    if (!data.MONGODB_URI) {
      ctx.addIssue({
        path: ["MONGODB_URI"],
        code: z.ZodIssueCode.custom,
        message:
          "MONGODB_URI is required in production (or set DEMO_MODE=true for a preview deployment).",
      });
    }
    if (!data.NEXTAUTH_SECRET && !data.AUTH_SECRET) {
      ctx.addIssue({
        path: ["NEXTAUTH_SECRET"],
        code: z.ZodIssueCode.custom,
        message:
          "NEXTAUTH_SECRET (or AUTH_SECRET) is required in production. Generate one with `openssl rand -base64 32`.",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  · ${i.path.join(".") || "(env)"} — ${i.message}`)
      .join("\n");
    const banner =
      "─────────────────────────────────────────────────────────\n" +
      "  Invalid environment configuration.\n" +
      "─────────────────────────────────────────────────────────";
    // Loud and obvious — we want the deployment to fail visibly.
    console.error(`\n${banner}\n${issues}\n${banner}\n`);
    throw new Error("Invalid environment configuration. See logs above.");
  }
  return parsed.data;
}

export const env: Env = parseEnv();

/** Throw if the env var is missing. Use sparingly at call sites that
 * legitimately can't continue without it (e.g. webhook secret). */
export function requireEnv<K extends keyof Env>(name: K): NonNullable<Env[K]> {
  const v = env[name];
  if (v === undefined || v === null || v === "") {
    throw new Error(`Required env var \`${String(name)}\` is not set.`);
  }
  return v as NonNullable<Env[K]>;
}

/** True when OAuth Google is fully configured. */
export const isGoogleEnabled =
  !!env.AUTH_GOOGLE_ID && !!env.AUTH_GOOGLE_SECRET;

/** True when OAuth GitHub is fully configured. */
export const isGitHubEnabled =
  !!env.AUTH_GITHUB_ID && !!env.AUTH_GITHUB_SECRET;
