"use client";

import { Marquee } from "@/components/effects/marquee";

const brands = [
  "Linear",
  "Figma",
  "Notion",
  "Vercel",
  "Stripe",
  "Loom",
  "Framer",
  "Arc",
  "Raycast",
  "Cursor",
];

export function LogoCloud() {
  return (
    <section className="relative py-16">
      <div className="container">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by ambitious teams at
        </p>
        <div className="mt-8">
          <Marquee speed="slow">
            {brands.map((b) => (
              <span
                key={b}
                className="select-none font-display text-2xl font-semibold tracking-tight text-foreground/30 transition-colors hover:text-foreground/70"
              >
                {b}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
