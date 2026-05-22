import { Logo } from "@/components/ui/logo";

/**
 * Initial-boot splash. Shown by Next.js during the first server render
 * while React data is streaming in. Stays branded so the user never sees
 * a blank screen.
 */
export default function RootLoading() {
  return (
    <div className="relative grid min-h-screen place-items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[380px] w-[380px] rounded-full bg-cyan-500/15 blur-3xl" />
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <Logo size="md" withText={false} />
          <span
            aria-hidden
            className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-violet-500/30 blur-md"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block size-1.5 rounded-full bg-violet-300/70"
              style={{
                animation: `skeleton-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/80">
          loading workspace
        </p>
      </div>
    </div>
  );
}
