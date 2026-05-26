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
      const role = (auth?.user as { role?: string } | undefined)?.role;
      const accountStatus = (auth?.user as { accountStatus?: string } | undefined)
        ?.accountStatus;

      const isOnApp =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/workspace") ||
        nextUrl.pathname.startsWith("/projects") ||
        nextUrl.pathname.startsWith("/team") ||
        nextUrl.pathname.startsWith("/inbox") ||
        nextUrl.pathname.startsWith("/calendar") ||
        nextUrl.pathname.startsWith("/analytics") ||
        nextUrl.pathname.startsWith("/assistant") ||
        nextUrl.pathname.startsWith("/settings") ||
        nextUrl.pathname.startsWith("/admin");
      const isOnAuth =
        nextUrl.pathname === "/login" ||
        nextUrl.pathname === "/signup" ||
        nextUrl.pathname === "/forgot-password" ||
        nextUrl.pathname.startsWith("/reset-password");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAwaiting = nextUrl.pathname.startsWith("/awaiting-approval");

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        if (role !== "super_admin") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Pending users: only the awaiting-approval screen is reachable.
      if (isLoggedIn && accountStatus === "pending" && isOnApp && !isOnAwaiting) {
        return Response.redirect(new URL("/awaiting-approval", nextUrl));
      }

      if (isOnApp) return isLoggedIn;
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
        token.role = (user as { role?: string }).role as
          | "super_admin"
          | "admin"
          | "member"
          | undefined;
        token.accountStatus = (user as { accountStatus?: string })
          .accountStatus as "pending" | "active" | "suspended" | undefined;
      }
      // Allow client-triggered session refresh (`update()`) to pull
      // fresh role/status after the admin approves/promotes someone.
      if (trigger === "update" && session) {
        const s = session as { role?: string; accountStatus?: string };
        if (s.role) {
          token.role = s.role as "super_admin" | "admin" | "member";
        }
        if (s.accountStatus) {
          token.accountStatus = s.accountStatus as
            | "pending"
            | "active"
            | "suspended";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          id?: string;
          role?: string;
          accountStatus?: string;
        };
        if (token.id) u.id = token.id as string;
        u.role = (token.role as string) || "member";
        u.accountStatus = (token.accountStatus as string) || "active";
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
