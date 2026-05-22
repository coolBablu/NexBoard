"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail, Copy, Check } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FormField } from "@/components/auth/form-field";
import { AuthSuccess } from "@/components/auth/auth-success";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries — enter your email and we'll send you a secure link to set a new one."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [emailErr, setEmailErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [demoUrl, setDemoUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailErr(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailErr("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setSent(true);
      if (data?.__demoResetUrl) setDemoUrl(data.__demoResetUrl);
    } catch {
      setEmailErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!demoUrl) return;
    await navigator.clipboard.writeText(demoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!sent ? (
        <motion.form
          key="form"
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <FormField
            label="Email"
            icon={Mail}
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailErr(null);
            }}
            error={emailErr}
            autoComplete="email"
            placeholder=" "
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending link…" : "Send reset link"}
            {!loading && <ArrowRight className="size-4" />}
          </Button>

          <Link
            href="/login"
            className="group flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to sign in
          </Link>
        </motion.form>
      ) : (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          <AuthSuccess
            title="Check your inbox"
            description={
              <>
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>,
                we've sent a secure reset link. It expires in{" "}
                <span className="font-medium text-foreground">30 minutes</span>.
              </>
            }
            actions={
              <>
                {demoUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-200">
                        Demo mode
                      </span>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                      >
                        {copied ? (
                          <>
                            <Check className="size-3 text-emerald-300" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      No SMTP is wired in demo mode — use this one-time link to
                      reset your password directly:
                    </p>
                    <p className="mt-2 break-all font-mono text-[10px] text-foreground/85">
                      {demoUrl}
                    </p>
                    <Link
                      href={demoUrl.replace(/^https?:\/\/[^/]+/, "")}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-violet-300 hover:text-violet-200"
                    >
                      Open reset page
                      <ArrowRight className="size-3" />
                    </Link>
                  </motion.div>
                )}
                <Button
                  asChild
                  variant="secondary"
                  className="mt-1 w-full"
                >
                  <Link href="/login">Back to sign in</Link>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setDemoUrl(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Use a different email
                </button>
              </>
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
