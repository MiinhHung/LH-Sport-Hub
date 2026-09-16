import { CardSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
