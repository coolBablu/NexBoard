"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Mail } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";

/**
 * Public sign-up has been disabled — new accounts are admin-invited
 * only. The original public form lived here; we keep the route so any
 * bookmarked / pasted /signup URL lands somewhere helpful instead of
 * 404'ing, and the user is told exactly what to do.
 */
export default function SignupDisabledPage() {
  return (
    <AuthLayout
      title="By invitation only."
      subtitle="NexBoard is admin-managed. Your workspace owner adds new members from the Admin panel."
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5"
      >
        <div className="flex items-start gap-3 rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-200">
            <Lock className="size-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium">Self-serve sign-up is off.</p>
            <p className="mt-1 text-muted-foreground">
              To keep the workspace secure, only the super admin can add new
              members. Ask your admin to invite you from{" "}
              <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-foreground/90">
                /admin
              </span>
              .
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            For super admins
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in with your super-admin account and use{" "}
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-foreground/90">
              Add member
            </span>{" "}
            on the Admin page to issue new credentials.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Got invited?
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-3.5" />
            Use the email + temporary password your admin shared with you.
          </p>
        </div>

        <Link href="/login" className="block">
          <Button size="lg" className="w-full">
            Go to sign in
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </motion.div>
    </AuthLayout>
  );
}
