import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { badRequest, serverError } from "@/lib/api";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
});

const TOKEN_TTL_MIN = 30;

/**
 * Request a password-reset link.
 *
 * Privacy: this endpoint always responds with `{ ok: true }`, even when the
 * email is not registered, so attackers can't use it to enumerate accounts.
 *
 * Demo mode: since this project has no SMTP wired, the reset URL is also
 * returned in the response (`__demoResetUrl`) and logged to the server
 * console. In production, send this URL via your transactional email
 * provider (Resend, Postmark, SES, etc.) and remove the `__demoResetUrl`
 * field from the response.
 */
export async function POST(req: Request) {
  // Email enumeration / spam protection: 3 attempts per 10 min per IP.
  const limited = rateLimit(req, { name: "forgot-pw", window: "5m", limit: 3 });
  if (!limited.ok) return tooMany(limited);

  try {
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid email");

    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ email })
      .select("_id email passwordHash")
      .lean();

    // Always return ok — but only create a token for real credentials accounts.
    if (!user?.passwordHash) {
      return NextResponse.json({ ok: true });
    }

    // Generate raw token (returned to user via email link), store only the hash.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
      requestIp:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });

    const base =
      process.env.NEXTAUTH_URL ??
      (req.headers.get("origin") ||
        `${new URL(req.url).protocol}//${new URL(req.url).host}`);
    const resetUrl = `${base}/reset-password?token=${rawToken}`;

    // eslint-disable-next-line no-console
    console.log(`[auth] Password reset URL for ${email}: ${resetUrl}`);

    const isDemo = process.env.DEMO_MODE === "true";
    return NextResponse.json({
      ok: true,
      ...(isDemo ? { __demoResetUrl: resetUrl } : {}),
    });
  } catch (err) {
    return serverError(err);
  }
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
