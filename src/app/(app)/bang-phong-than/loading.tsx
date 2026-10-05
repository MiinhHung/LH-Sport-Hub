import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageIntroSkeleton />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-5 w-28" />
            <Skeleton className="mt-2 h-3 w-16" />
          </Card>
        ))}
      </div>

      <Card>
        <div className="border-b border-ink-800 p-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <ul className="divide-y divide-ink-800">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-10 sm:block" />
              <Skeleton className="hidden h-4 w-10 sm:block" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
