import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config (no DB / Node modules).
 * Used by middleware for route protection.
 * The full config in `auth.ts` extends this with adapter + providers
 * that require Node runtime.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // populated in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnApp =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/workspace") ||
        nextUrl.pathname.startsWith("/analytics") ||
        nextUrl.pathname.startsWith("/assistant") ||
        nextUrl.pathname.startsWith("/settings");
      const isOnAuth =
        nextUrl.pathname === "/login" ||
        nextUrl.pathname === "/signup" ||
        nextUrl.pathname === "/forgot-password" ||
        nextUrl.pathname.startsWith("/reset-password");

      if (isOnApp) return isLoggedIn;
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
