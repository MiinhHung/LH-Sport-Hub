import { Card, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <Card className="p-5">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto mt-3 h-10 w-28" />
      </Card>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
