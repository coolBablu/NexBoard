import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongodb";

export type ApiSession = {
  user: { id: string; email: string; name?: string | null; image?: string | null };
};

/**
 * Guard for API routes — ensures DB is connected and user is logged in.
 * Returns either { session } or a 401 NextResponse.
 */
export async function requireSession(): Promise<
  { session: ApiSession } | { error: NextResponse }
> {
  await dbConnect();
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return {
    session: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    },
  };
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status: 400 }
  );
}

export function serverError(err: unknown) {
  // eslint-disable-next-line no-console
  console.error("[api]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
