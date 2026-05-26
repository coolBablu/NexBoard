"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/effects/reveal";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    description: "For individuals and tiny teams just getting started.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "Up to 5 members",
      "Unlimited public docs",
      "Basic AI assistant (50 runs/mo)",
      "Community support",
    ],
  },
  {
    name: "Pro",
    description: "Beautifully fast collaboration for growing teams.",
    monthly: 18,
    yearly: 14,
    cta: "Start 14-day trial",
    highlight: true,
    features: [
      "Unlimited members",
      "Unlimited AI assistant runs",
      "Real-time analytics & forecasts",
      "Integrations: GitHub, Slack, Linear, Figma",
      "Custom workflows & automations",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    description: "Security, scale, and customization for the largest teams.",
    monthly: null,
    yearly: null,
    cta: "Talk to sales",
    features: [
      "SAML SSO + SCIM provisioning",
      "Audit logs & customer-managed keys",
      "Regional data residency",
      "Dedicated success manager",
      "99.99% uptime SLA",
      "Custom AI fine-tuning",
    ],
  },
];

export function Pricing() {
  const [yearly, setYearly] = React.useState(true);

  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-300/80">
              Pricing
            </p>
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Simple, scalable, <span className="text-gradient-nova">fair</span>.
            </h2>
            <p className="mt-5 text-balance text-muted-foreground">
              Start free forever. Upgrade when your team is ready. Cancel
              any time, no hard feelings.
            </p>

            <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button
                onClick={() => setYearly(false)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                  !yearly
                    ? "bg-white text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                  yearly
                    ? "bg-white text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  −22%
                </span>
              </button>
            </div>
          </div>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <PricingCard tier={t} yearly={yearly} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  tier,
  yearly,
}: {
  tier: (typeof tiers)[number];
  yearly: boolean;
}) {
  const price =
    tier.monthly === null
      ? null
      : yearly
        ? tier.yearly
        : tier.monthly;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border p-6",
        tier.highlight
          ? "border-transparent bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 shadow-glow"
          : "border-white/[0.08] bg-white/[0.02]"
      )}
    >
      {tier.highlight && (
        <>
          <div className="absolute inset-0 -z-10 rounded-2xl border-gradient" />
          <Badge
            variant="gradient"
            className="absolute -top-3 left-1/2 -translate-x-1/2"
          >
            Most popular
          </Badge>
        </>
      )}

      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl font-semibold">{tier.name}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>

      <div className="mt-6 flex items-baseline gap-1">
        {price === null ? (
          <span className="font-display text-4xl font-semibold">Custom</span>
        ) : (
          <>
            <span className="font-display text-5xl font-semibold tracking-tight">
              ${price}
            </span>
            <span className="text-sm text-muted-foreground">
              /user{yearly ? "/mo, billed yearly" : "/mo"}
            </span>
          </>
        )}
      </div>

      <Button
        asChild
        variant={tier.highlight ? "default" : "secondary"}
        size="lg"
        className="mt-6"
      >
        <Link href={tier.monthly === null ? "#" : "/login"}>{tier.cta}</Link>
      </Button>

      <ul className="mt-8 space-y-3">
        {tier.features.map((f, i) => (
          <motion.li
            key={f}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.04 }}
            className="flex items-start gap-2.5 text-sm text-foreground/85"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-300">
              <Check className="size-3" />
            </span>
            {f}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
