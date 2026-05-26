"use client";

import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Clock, Sparkles, LogOut, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function AwaitingApprovalPage() {
  const { data: session, update } = useSession();
  const name = session?.user?.name ?? "there";
  const email = session?.user?.email ?? "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="aurora pointer-events-none absolute -inset-32 -z-10 opacity-40" />
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <Logo size="md" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-xl"
        >
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-nova-gradient/20 text-violet-700 dark:text-violet-200">
            <Clock className="size-6" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">
            Hi {name.split(" ")[0]}, you&apos;re in the queue.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account{" "}
            <span className="font-medium text-foreground">{email}</span> is
            waiting for a super admin to approve it. You&apos;ll get an email
            once you&apos;re in — usually within a few minutes.
          </p>

          <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3 text-left text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="size-3.5 text-violet-500" />
              While you wait
            </div>
            <p className="mt-1.5 text-muted-foreground">
              Tell your admin to head to{" "}
              <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-foreground/90">
                /admin → Pending
              </span>{" "}
              and tap Approve.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" onClick={() => update()}>
              <RefreshCw className="size-3.5" />
              Check again
            </Button>
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
