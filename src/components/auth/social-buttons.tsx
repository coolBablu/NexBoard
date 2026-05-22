"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4 fill-foreground">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.16-.02-2.1-3.2.69-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.17-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.17 1.84 1.17 3.1 0 4.41-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

interface SocialButtonsProps {
  callbackUrl?: string;
}

type Provider = "google" | "github";
type ProviderState = "idle" | "loading";

/**
 * Animated OAuth buttons. The providers list is statically declared
 * (Google + GitHub); the server-side auth.ts conditionally registers them
 * based on env vars. If a button is clicked but the provider isn't
 * registered, NextAuth will simply 404 — we surface that with a small
 * inline note. In demo mode without configured OAuth, both buttons are
 * disabled and clearly labelled.
 */
export function SocialButtons({
  callbackUrl = "/dashboard",
}: SocialButtonsProps) {
  const [state, setState] = React.useState<Record<Provider, ProviderState>>({
    google: "idle",
    github: "idle",
  });
  const [providersAvailable, setProvidersAvailable] = React.useState<
    Record<Provider, boolean> | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/providers");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as Record<
          string,
          { id: string } | undefined
        >;
        if (cancelled) return;
        setProvidersAvailable({
          google: !!data?.google,
          github: !!data?.github,
        });
      } catch {
        if (!cancelled)
          setProvidersAvailable({ google: false, github: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleClick(p: Provider) {
    setState((s) => ({ ...s, [p]: "loading" }));
    try {
      await signIn(p, { callbackUrl });
    } finally {
      setState((s) => ({ ...s, [p]: "idle" }));
    }
  }

  const anyEnabled =
    providersAvailable === null ||
    providersAvailable.google ||
    providersAvailable.github;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <ProviderButton
          label="Google"
          icon={<GoogleIcon />}
          loading={state.google === "loading"}
          enabled={providersAvailable === null || providersAvailable.google}
          onClick={() => handleClick("google")}
        />
        <ProviderButton
          label="GitHub"
          icon={<GitHubIcon />}
          loading={state.github === "loading"}
          enabled={providersAvailable === null || providersAvailable.github}
          onClick={() => handleClick("github")}
        />
      </div>
      {!anyEnabled && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[10px] text-muted-foreground"
        >
          Social login is not configured in this demo. Add{" "}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono">
            AUTH_GOOGLE_ID
          </code>{" "}
          /{" "}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono">
            AUTH_GITHUB_ID
          </code>{" "}
          to{" "}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono">
            .env.local
          </code>
          .
        </motion.p>
      )}
    </div>
  );
}

function ProviderButton({
  label,
  icon,
  loading,
  enabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={enabled && !loading ? { y: -1 } : {}}
      whileTap={enabled && !loading ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      onClick={enabled ? onClick : undefined}
      disabled={!enabled || loading}
      title={!enabled ? `${label} sign-in is not configured` : `Continue with ${label}`}
      className={cn(
        "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl border bg-white/[0.025] text-sm font-medium transition-all",
        enabled
          ? "border-white/[0.08] text-foreground hover:border-white/[0.18] hover:bg-white/[0.05]"
          : "cursor-not-allowed border-white/[0.06] text-muted-foreground/60",
        loading && "pointer-events-none"
      )}
    >
      {/* hover gradient sweep */}
      {enabled && (
        <motion.span
          aria-hidden
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-y-0 -inset-x-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
        />
      )}
      <span className="relative">
        {loading ? (
          <Loader2 className="size-4 animate-spin text-violet-300" />
        ) : (
          icon
        )}
      </span>
      <span className="relative">{label}</span>
      {!enabled && (
        <span className="relative font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
          off
        </span>
      )}
    </motion.button>
  );
}
