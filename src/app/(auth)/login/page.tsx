"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Mail,
  Lock,
  Sparkles,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialButtons } from "@/components/auth/social-buttons";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to your NovaFlow workspace and pick up where you left off."
    >
      <React.Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </React.Suspense>
    </AuthLayout>
  );
}

function LoginFormFallback() {
  return (
    <div className="h-[420px] animate-pulse rounded-2xl bg-white/[0.02]" />
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const error = params.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(
    error ? "Sign-in failed. Please try again." : null
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setFormError("Wrong email or password. Try again.");
      toast.error("Sign-in failed", {
        description: "Double-check your email and password.",
      });
      return;
    }

    toast.success("Welcome back", {
      description: "Loading your workspace…",
    });
    router.push(callbackUrl);
    router.refresh();
  }

  function fillDemo() {
    setEmail("demo@novaflow.app");
    setPassword("novaflow123");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <SocialButtons callbackUrl={callbackUrl} />

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
          or with email
        </span>
      </div>

      <AnimatePresence>
        {formError && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FormField
        label="Email"
        icon={Mail}
        type="email"
        name="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setFormError(null);
        }}
        autoComplete="email"
        placeholder=" "
        required
      />

      <FormField
        label="Password"
        icon={Lock}
        type={show ? "text" : "password"}
        name="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setFormError(null);
        }}
        autoComplete="current-password"
        minLength={8}
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

      <div className="flex items-center justify-between text-xs">
        <label className="inline-flex select-none items-center gap-2 text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="size-3.5 rounded border-white/15 bg-white/[0.03] text-violet-500 focus:ring-violet-500/20"
          />
          Keep me signed in
        </label>
        <Link
          href="/forgot-password"
          className="font-medium text-muted-foreground transition-colors hover:text-violet-300"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Signing you in…" : "Sign in"}
        {!loading && <ArrowRight className="size-4" />}
      </Button>

      <button
        type="button"
        onClick={fillDemo}
        className="group flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-500/25 bg-gradient-to-r from-violet-500/10 to-cyan-500/5 px-3 py-2 text-xs text-violet-200 transition-colors hover:from-violet-500/15 hover:to-cyan-500/10"
      >
        <Sparkles className="size-3" />
        Try the demo account
        <span className="font-mono text-[10px] text-violet-300/80">
          demo@novaflow.app
        </span>
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
