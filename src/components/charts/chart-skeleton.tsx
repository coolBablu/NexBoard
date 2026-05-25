/**
 * Lightweight placeholder shown while Recharts (and the heavy chart
 * component itself) is fetched. Kept dependency-free so it can render
 * inside a `dynamic({ loading })` callback, which executes on the server
 * during SSR fallback as well as on the client during the first paint.
 */
export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02]"
      style={{ height }}
    >
      <div
        className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-500/[0.04] via-transparent to-cyan-500/[0.04]"
        aria-hidden
      />
      <svg
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-50"
        aria-hidden
      >
        <defs>
          <linearGradient id="cs-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(139,92,246,0.32)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,80 C40,70 80,55 120,60 C160,65 200,40 240,35 C280,30 320,50 360,40 L400,42 L400,100 L0,100 Z"
          fill="url(#cs-grad)"
        />
      </svg>
    </div>
  );
}

export function SparkSkeleton() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-white/[0.04] to-transparent" />
    </div>
  );
}
