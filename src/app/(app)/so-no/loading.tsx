import { CardSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
