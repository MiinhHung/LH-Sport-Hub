import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageIntroSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="mt-4 h-14 w-full rounded-xl" />
            <Skeleton className="mt-3 h-9 w-full rounded-xl" />
          </Card>
        ))}
      </div>
    </div>
  );
}
