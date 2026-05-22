"use client";

import { Star } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reveal } from "@/components/effects/reveal";

const reviews = [
  {
    quote:
      "NovaFlow replaced four of our tools in a single week. The AI is genuinely useful — not a gimmick.",
    name: "Sara Patel",
    role: "Head of Product · Lumen Labs",
    seed: "Sara",
  },
  {
    quote:
      "It feels like Linear and Notion had a baby — and that baby learned to think. We ship 2x faster.",
    name: "Daniel Park",
    role: "Engineering Lead · Northwind",
    seed: "Daniel",
  },
  {
    quote:
      "Our design team finally has a single source of truth. The handoffs are seamless and beautiful.",
    name: "Maya Okonkwo",
    role: "Design Director · Halcyon",
    seed: "Maya",
  },
  {
    quote:
      "The cinematic UI sells it internally. The reliability and speed keeps us here.",
    name: "Jordan Reyes",
    role: "VP Engineering · Vertex",
    seed: "Jordan",
  },
  {
    quote:
      "We measured a 38% reduction in meeting time after rolling out Nova Assistant company-wide.",
    name: "Aisha Khan",
    role: "Chief of Staff · Bracket",
    seed: "Aisha",
  },
  {
    quote:
      "Real-time multiplayer, sane permissions, sensible defaults. It just feels modern.",
    name: "Lucas Müller",
    role: "Staff PM · Atlas",
    seed: "Lucas",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
              Loved by modern teams
            </p>
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              The fastest path from{" "}
              <span className="text-gradient-nova">idea to impact</span>.
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.04}>
              <GlassCard className="h-full">
                <div className="flex h-full flex-col p-6">
                  <div className="flex gap-0.5 text-amber-300">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="size-4 fill-current"
                      />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/85">
                    "{r.quote}"
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.seed}`}
                      />
                      <AvatarFallback>{r.seed[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.role}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
