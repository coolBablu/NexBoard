"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RefreshCcw, ArrowLeft, AlertTriangle, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * In-app error screen — keeps the user inside the shell so they can
 * recover (retry, dashboard, support) without losing their session.
 */
export default function AppError({ error, reset }: AppErrorProps) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="relative grid min-h-[70vh] place-items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 text-center backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-rose-500/25 blur-3xl"
        />
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          That didn&apos;t work
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message
            ? error.message
            : "An unexpected error broke this view. Try again — most issues are transient."}
        </p>
        {error?.digest && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Bug className="size-3" />
            ref · {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()}>
            <RefreshCcw className="size-4" />
            Retry
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
