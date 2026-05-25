import { Skeleton, SkeletonStat, SkeletonCard } from "@/components/ui/skeleton";

/**
 * Loading skeleton shown while any `/(app)/*` page resolves on a fresh
 * navigation. Mirrors the dashboard layout so the swap to real content
 * is visually stable (no layout shift).
 */
export default function AppLoading() {
  return (
    <div className="relative px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[60vh] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(94, 106, 210,0.12),transparent)]"
      />
      {/* Greeting hero */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Metric tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      {/* Two-column main area */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-24" />
            </div>
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
        <SkeletonCard />
      </div>
    </div>
  );
}
