"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/effects/reveal";

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-500/15 p-10 text-center sm:p-16">
            <div className="aurora absolute -inset-10 -z-10 opacity-70" />
            <div className="bg-grid absolute inset-0 -z-10 opacity-40" />

            <Sparkles className="mx-auto size-6 text-violet-300" />
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Bring NovaFlow to your team{" "}
              <span className="text-gradient-nova">today</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
              14-day Pro trial. No credit card. Migrate from Linear, Notion,
              or Jira in under 10 minutes — we'll do the heavy lifting.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" className="w-full sm:w-auto">
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="xl"
                className="w-full sm:w-auto"
              >
                <Link href="#">Book a demo</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
