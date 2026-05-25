import { Skeleton, SkeletonListRow } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <Skeleton className="mb-6 h-10 w-80 rounded-xl" />
      <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonListRow key={i} />
        ))}
      </div>
    </div>
  );
}
