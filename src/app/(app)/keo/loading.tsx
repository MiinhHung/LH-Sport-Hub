import { CardSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex gap-1.5">
        {[68, 90, 72, 66].map((w) => (
          <Skeleton key={w} className="h-9" style={{ width: w }} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
