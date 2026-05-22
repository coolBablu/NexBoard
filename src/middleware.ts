import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match everything except API auth routes, Next assets, and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.svg|.*\\..*).*)"],
};
