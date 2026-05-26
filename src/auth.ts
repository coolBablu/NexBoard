import NextAuth, { type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import clientPromise from "@/lib/mongodb-client";
import { dbConnect } from "@/lib/mongodb";
import { User, type AccountStatus, type UserRole } from "@/models/User";
import { ensureDemoSuperAdmin } from "@/lib/admin";
import { authConfig } from "@/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      accountStatus: AccountStatus;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Conditionally enable OAuth providers based on env vars so the app
// works out-of-the-box with just credentials.
const providers: Provider[] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      await dbConnect();

      // One-shot RBAC bootstrap. Idempotent. Promotes the demo
      // account (or, on Atlas, the earliest registered user) to
      // super_admin if no super_admin exists yet — this is the
      // upgrade path for workspaces that signed up before RBAC
      // shipped, so the workspace owner doesn't get permanently
      // locked out of /admin.
      try {
        await ensureDemoSuperAdmin();
      } catch (err) {
        console.warn("[auth] ensureSuperAdmin bootstrap failed", err);
      }

      const user = await User.findOne({ email })
        .select("+passwordHash name email image role status")
        .lean();
      if (!user?.passwordHash) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      // Block suspended accounts hard. Pending accounts CAN log in
      // (we surface an "awaiting approval" screen client-side) so
      // they can see they've signed up successfully and the super
      // admin can find them via /admin.
      if (user.status === "suspended") {
        throw new Error("Your account has been suspended. Contact your admin.");
      }

      return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        role: (user.role ?? "member") as UserRole,
        accountStatus: (user.status ?? "active") as AccountStatus,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB || "novaflow",
  }),
  providers,
});
