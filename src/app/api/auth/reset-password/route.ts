import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { badRequest, serverError } from "@/lib/api";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  token: z.string().min(20),
});

const resetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

/** GET — validate that a token exists, isn't used, and isn't expired. */
export async function GET(req: Request) {
  try {
    await dbConnect();
    const token = new URL(req.url).searchParams.get("token");
    const parsed = verifySchema.safeParse({ token });
    if (!parsed.success) {
      return NextResponse.json({ valid: false, reason: "invalid" });
    }

    const record = await PasswordResetToken.findOne({
      tokenHash: sha256(parsed.data.token),
    }).lean();

    if (!record) {
      return NextResponse.json({ valid: false, reason: "not_found" });
    }
    if (record.usedAt) {
      return NextResponse.json({ valid: false, reason: "used" });
    }
    if (record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ valid: false, reason: "expired" });
    }
    return NextResponse.json({ valid: true });
  } catch (err) {
    return serverError(err);
  }
}

/** POST — atomically consume the token and update the user's password. */
export async function POST(req: Request) {
  // 10 attempts / 10 min / IP — generous but blocks token brute force.
  const limited = rateLimit(req, {
    name: "reset-pw",
    window: "5m",
    limit: 10,
  });
  if (!limited.ok) return tooMany(limited);

  try {
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const { token, password } = parsed.data;
    const tokenHash = sha256(token);

    // findOneAndUpdate so claiming the token is atomic — no double-use race.
    const record = await PasswordResetToken.findOneAndUpdate(
      {
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
      { new: true }
    ).lean();

    if (!record) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.updateOne(
      { _id: record.user },
      { $set: { passwordHash } }
    );

    // Best-effort cleanup of any other outstanding tokens for this user.
    await PasswordResetToken.updateMany(
      { user: record.user, usedAt: null },
      { $set: { usedAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
