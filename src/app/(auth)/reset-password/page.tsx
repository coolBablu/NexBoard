"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FormField } from "@/components/auth/form-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { AuthSuccess } from "@/components/auth/auth-success";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set a new password."
      subtitle="Choose a strong password — you'll use it to sign in from now on."
    >
      <React.Suspense fallback={<ResetFallback />}>
        <ResetPasswordForm />
      </React.Suspense>
    </AuthLayout>
  );
}

function ResetFallback() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading…
    </div>
  );
}

type TokenState =
  | { status: "checking" }
  | { status: "valid" }
  | { status: "invalid"; reason: "expired" | "used" | "not_found" | "missing" | "invalid" };

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [tokenState, setTokenState] = React.useState<TokenState>({
    status: "checking",
  });
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  // Validate token on mount
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setTokenState({ status: "invalid", reason: "missing" });
        return;
      }
      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.valid) setTokenState({ status: "valid" });
        else
          setTokenState({
            status: "invalid",
            reason: data.reason || "invalid",
          });
      } catch {
        if (!cancelled) setTokenState({ status: "invalid", reason: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not reset your password. Try again.");
        setLoading(false);
        return;
      }

      setDone(true);

      // Best-effort auto-redirect to /login after a beat
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 2200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (tokenState.status === "checking") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-violet-300" />
        Verifying your reset link…
      </div>
    );
  }

  if (tokenState.status === "invalid") {
    return <InvalidTokenState reason={tokenState.reason} />;
  }

  if (done) {
    return (
      <AuthSuccess
        title="Password updated"
        description={
          <>
            Your password was changed successfully. We're redirecting you to
            sign in…
          </>
        }
        actions={
          <Button asChild className="w-full">
            <Link href="/login">Sign in now</Link>
          </Button>
        }
      />
    );
  }

  const passwordsMatch =
    password.length > 0 && confirm.length > 0 && password === confirm;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200">
        <ShieldCheck className="size-3.5" />
        Verified reset link
        <span className="ml-auto font-mono text-[10px] text-emerald-300/80">
          Single-use
        </span>
      </div>

      <FormField
        label="New password"
        icon={Lock}
        type={show ? "text" : "password"}
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        placeholder=" "
        required
        trailing={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        }
      />

      <PasswordStrength password={password} />

      <FormField
        label="Confirm new password"
        icon={Lock}
        type={show ? "text" : "password"}
        name="confirm"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        success={passwordsMatch}
        error={
          confirm.length > 0 && password !== confirm
            ? "Passwords don't match"
            : null
        }
        autoComplete="new-password"
        placeholder=" "
        required
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? "Updating password…" : "Update password"}
        {!loading && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}

function InvalidTokenState({
  reason,
}: {
  reason: "expired" | "used" | "not_found" | "missing" | "invalid";
}) {
  const map: Record<
    "expired" | "used" | "not_found" | "missing" | "invalid",
    { title: string; body: string }
  > = {
    missing: {
      title: "No reset token",
      body: "This URL doesn't contain a reset token. Request a new link to continue.",
    },
    invalid: {
      title: "Invalid reset link",
      body: "This link doesn't look right. Request a new one to continue.",
    },
    not_found: {
      title: "Link not found",
      body: "We couldn't find this reset link. It may have been used or revoked.",
    },
    used: {
      title: "Link already used",
      body: "This reset link has already been used. Request a new one for a fresh reset.",
    },
    expired: {
      title: "Link expired",
      body: "Reset links expire after 30 minutes for security. Please request a new one.",
    },
  };
  const m = map[reason];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5 text-center"
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-300">
        <ShieldAlert className="size-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold">{m.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
      <div className="mt-5 flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </motion.div>
  );
}
