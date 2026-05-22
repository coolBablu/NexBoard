import Link from "next/link";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const groups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Customers", href: "#testimonials" },
      { label: "Careers", href: "#" },
      { label: "Press kit", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API reference", href: "#" },
      { label: "Status", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "DPA", href: "#" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative mt-32 border-t border-white/[0.07]">
      <div className="absolute inset-x-0 top-0 -translate-y-1/2">
        <div className="mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      </div>
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[2fr_3fr]">
          <div>
            <Logo size="md" />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The AI-powered workspace where modern teams plan, build, and
              ship — together. Beautifully fast. Cinematically smooth.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {[
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Github, href: "#", label: "GitHub" },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
                { Icon: Mail, href: "#", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-foreground"
                >
                  <Icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {groups.map((g) => (
              <div key={g.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  {g.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NovaFlow Labs, Inc. All rights
            reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
