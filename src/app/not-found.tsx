import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AuroraBackground />
      <div className="container flex items-center justify-between py-6">
        <Logo size="sm" />
      </div>
      <div className="container flex flex-1 flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="size-3 text-violet-300" />
          Error 404
        </div>
        <h1 className="mt-6 font-display text-6xl font-semibold tracking-tight sm:text-7xl">
          We lost <span className="text-gradient-nova">that thread</span>.
        </h1>
        <p className="mt-4 max-w-md text-balance text-muted-foreground">
          The page you were looking for doesn't exist — or it has moved
          somewhere more interesting.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to NovaFlow
          </Link>
        </Button>
      </div>
    </div>
  );
}
