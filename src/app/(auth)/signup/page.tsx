"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowRight,
  AlertCircle,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialButtons } from "@/components/auth/social-buttons";
import { FormField } from "@/components/auth/form-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const perks = [
  "Free for teams of up to 5",
  "Unlimited AI assistant runs in trial",
  "Cancel any time, no questions",
];

interface FieldErrors {
  first?: string;
  last?: string;
  email?: string;
  password?: string;
  workspace?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [workspace, setWorkspace] = React.useState("");

  // Auto-derive workspace slug from first name as user types,
  // unless the user has already edited the workspace field.
  const userEditedWorkspace = React.useRef(false);
  React.useEffect(() => {
    if (!userEditedWorkspace.current && first) {
      const slug = `${first}${last ? "-" + last : ""}`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      setWorkspace(slug);
    }
  }, [first, last]);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!first.trim()) errs.first = "Required";
    if (!last.trim()) errs.last = "Required";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (password.length < 8) errs.password = "Min 8 characters";
    if (!/^[a-z0-9-]{2,40}$/.test(workspace))
      errs.workspace = "Lowercase letters, numbers, dashes only";
    return errs;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: first,
          lastName: last,
          email,
          password,
          workspaceSlug: workspace,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setFormError(data.error || "Something went wrong. Try again.");
        return;
      }

      const signed = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (!signed || signed.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setLoading(false);
      setFormError("Network error. Please try again.");
    }
  }

  return (
    <AuthLayout
      title="Create your workspace."
      subtitle="Get a free 14-day Pro trial. No credit card required."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <SocialButtons callbackUrl="/dashboard" />

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
            or with email
          </span>
        </div>

        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First name"
            icon={UserIcon}
            name="first"
            value={first}
            onChange={(e) => {
              setFirst(e.target.value);
              setFieldErrors((f) => ({ ...f, first: undefined }));
            }}
            error={fieldErrors.first}
            placeholder=" "
            required
          />
          <FormField
            label="Last name"
            name="last"
            value={last}
            onChange={(e) => {
              setLast(e.target.value);
              setFieldErrors((f) => ({ ...f, last: undefined }));
            }}
            error={fieldErrors.last}
            placeholder=" "
            required
          />
        </div>

        <FormField
          label="Work email"
          icon={Mail}
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          error={fieldErrors.email}
          autoComplete="email"
          placeholder=" "
          required
        />

        {/* Workspace slug with live preview */}
        <div className="space-y-1.5">
          <WorkspaceField
            value={workspace}
            error={fieldErrors.workspace}
            onChange={(v) => {
              userEditedWorkspace.current = true;
              setWorkspace(v);
              setFieldErrors((f) => ({ ...f, workspace: undefined }));
            }}
          />
        </div>

        <div className="space-y-3">
          <FormField
            label="Password"
            icon={Lock}
            type={show ? "text" : "password"}
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            error={fieldErrors.password}
            autoComplete="new-password"
            placeholder=" "
            minLength={8}
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
        </div>

        <ul className="space-y-1.5">
          {perks.map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Check className="size-3.5 text-emerald-400" />
              {p}
            </li>
          ))}
        </ul>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating your workspace…" : "Create workspace"}
          {!loading && <ArrowRight className="size-4" />}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function WorkspaceField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div className="space-y-1.5">
      <motion.div
        animate={
          error
            ? { x: [0, -4, 4, -3, 3, -1, 1, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.35 }}
        className={cn(
          "group flex h-12 items-center rounded-xl border bg-white/[0.025] transition-all",
          error
            ? "border-rose-500/40 ring-4 ring-rose-500/10"
            : focused
              ? "border-violet-500/40 ring-4 ring-violet-500/10 bg-white/[0.05]"
              : "border-white/[0.08] hover:border-white/[0.14]"
        )}
      >
        <span className="pl-3.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          /
        </span>
        <input
          name="workspace"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="acme"
          required
          pattern="[a-z0-9-]+"
          minLength={2}
          maxLength={40}
          className="h-full flex-1 bg-transparent pl-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <span className="mr-3 border-l border-white/10 pl-3 font-mono text-[10px] text-muted-foreground">
          .novaflow.app
        </span>
      </motion.div>
      <p className="px-1 text-[10px] text-muted-foreground">
        Your team's workspace URL.
        {value && !error && (
          <span className="ml-1 font-mono text-foreground/80">
            {value}.novaflow.app
          </span>
        )}
      </p>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 px-1 text-[11px] text-rose-300"
          >
            <AlertCircle className="size-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
