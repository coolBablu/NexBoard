"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCcw, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary. Shown when an uncaught error escapes any
 * top-level page or layout. Keeps the brand visible and gives the
 * user two clear exits (retry, go home).
 */
export default function GlobalError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Surface to the console for ops; replace with Sentry / Logflare later.
    // eslint-disable-next-line no-console
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
      >
        <div className="absolute -top-20 left-1/4 h-[420px] w-[420px] rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-3xl" />
      </div>
      <div className="container flex items-center justify-between py-6">
        <Logo size="sm" />
      </div>
      <div className="container flex flex-1 flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 backdrop-blur">
          <AlertOctagon className="size-3" />
          Unexpected error
        </div>
        <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Something <span className="text-gradient-nova">went sideways</span>.
        </h1>
        <p className="mt-4 max-w-md text-balance text-muted-foreground">
          Don&apos;t worry — your data is safe. Try again, or head back home.
          The team has been notified.
        </p>
        {error?.digest && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            digest · {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => reset()}>
            <RefreshCcw className="size-4" />
            Try again
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
