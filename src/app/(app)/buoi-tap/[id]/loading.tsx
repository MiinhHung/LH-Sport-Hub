import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Skeleton className="h-4 w-28" />
      <PageIntroSkeleton lead={false} />

      <Card className="p-5">
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </Card>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-12" />
          </Card>
        ))}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-xl border border-ink-800 p-3"
          >
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
