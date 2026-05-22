"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, HelpCircle } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const faqs: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "How is NovaFlow different from Linear, Notion, or Asana?",
    a: (
      <>
        NovaFlow combines docs, projects, dashboards, and AI assistance into a
        single, beautifully fast surface. Instead of bouncing between four
        tools, your team thinks, plans, and ships in one place. Nova AI sees
        the full context — every doc, task, and decision — so its suggestions
        are actually useful.
      </>
    ),
  },
  {
    q: "Does Nova AI use my data to train models?",
    a: (
      <>
        Never. Your data is your data. We use only retrieval (RAG) against the
        workspace you've authorized, never to train base models. Enterprise
        plans add customer-managed keys, regional residency, and BYO-LLM.
      </>
    ),
  },
  {
    q: "How fast can my team migrate from our current tools?",
    a: (
      <>
        Most teams are fully migrated in under 10 minutes. We ship one-click
        importers for Linear, Notion, Jira, Asana, Trello, and ClickUp — they
        preserve hierarchies, mentions, attachments, and history. White-glove
        migration is included on Pro and Enterprise.
      </>
    ),
  },
  {
    q: "What does the AI assistant actually do?",
    a: (
      <>
        Summarize threads, draft PRDs, generate tasks from a transcript,
        identify blockers, write status updates, propose roadmaps, query your
        data — all grounded in your workspace's context. It also automates
        recurring flows (incident response, weekly digests, sprint planning)
        end-to-end.
      </>
    ),
  },
  {
    q: "Is there a free tier?",
    a: (
      <>
        Yes — Starter is free forever for teams up to 5, with 50 AI runs per
        month. Pro is $14/user/mo (billed yearly) with unlimited AI, advanced
        analytics, integrations, and priority support.
      </>
    ),
  },
  {
    q: "What about security and compliance?",
    a: (
      <>
        SOC 2 Type II, ISO 27001, GDPR, CCPA. Enterprise adds SAML SSO + SCIM,
        audit logs, customer-managed keys, regional data residency (US, EU,
        APAC), and a 99.99% uptime SLA.
      </>
    ),
  },
  {
    q: "Can we self-host?",
    a: (
      <>
        Self-hosting is available as part of the Enterprise tier — Kubernetes
        Helm charts, single-tenant VPC deployments, and air-gapped options
        for government and regulated industries.
      </>
    ),
  },
  {
    q: "What if my team doesn't love it?",
    a: (
      <>
        We offer a no-questions-asked refund within the first 30 days. Most
        teams that try NovaFlow keep it — but if it's not for you, we'll
        return your money and help you export every byte.
      </>
    ),
  },
];

export function FAQ() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mx-auto gap-2 border-white/10 bg-white/[0.03]"
            >
              <HelpCircle className="size-3 text-violet-300" />
              <span className="text-xs">FAQ</span>
            </Badge>
            <h2 className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Questions, <span className="text-gradient-nova">answered</span>.
            </h2>
            <p className="mt-5 text-balance text-muted-foreground">
              Still curious? We answer live questions every Thursday — or just
              message us anytime. Real humans, sub-2-hour responses.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-14 max-w-3xl">
          <ul className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={f.q} delay={i * 0.04}>
                  <li
                    className={cn(
                      "relative overflow-hidden rounded-2xl border bg-white/[0.02] backdrop-blur-xl transition-all",
                      isOpen
                        ? "border-white/[0.12] shadow-[0_20px_60px_-20px_rgba(139,92,246,0.35)]"
                        : "border-white/[0.07] hover:border-white/[0.12]"
                    )}
                  >
                    {/* Subtle gradient on open */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          aria-hidden
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_70%)]"
                        />
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                    >
                      <span
                        className={cn(
                          "font-display text-base font-medium tracking-tight sm:text-lg",
                          isOpen ? "text-foreground" : "text-foreground/90"
                        )}
                      >
                        {f.q}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 240,
                          damping: 18,
                        }}
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors",
                          isOpen
                            ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                            : "border-white/10 bg-white/[0.04] text-muted-foreground"
                        )}
                      >
                        <Plus className="size-4" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.4,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:pb-6">
                            {f.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                </Reveal>
              );
            })}
          </ul>

          <Reveal delay={0.3}>
            <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Still have questions? Talk to a human —{" "}
                <a
                  href="mailto:hello@novaflow.app"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  hello@novaflow.app
                </a>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
