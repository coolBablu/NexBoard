import { NextResponse } from "next/server";

import { requireSuperAdmin, resolveInviteDomain } from "@/lib/admin";
import { serverError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/config
 *
 * Lightweight admin-only configuration used by the /admin UI to decide
 * what hints / validation to render in the invite form. Currently
 * exposes the enforced email domain (if any).
 */
export async function GET() {
  const guard = await requireSuperAdmin();
  if ("error" in guard) return guard.error;
  const { actor } = guard;

  try {
    const inviteDomain = resolveInviteDomain(actor.email);
    return NextResponse.json({
      inviteDomain,
      enforcedBy: process.env.INVITE_EMAIL_DOMAIN
        ? "env"
        : inviteDomain
          ? "admin-email"
          : null,
    });
  } catch (err) {
    return serverError(err);
  }
}
