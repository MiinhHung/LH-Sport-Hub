import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageIntroSkeleton />

      {/* Ô tìm + hàng lọc trình độ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full rounded-lg sm:w-72" />
        <div className="flex gap-2">
          {[52, 64, 84, 48, 44].map((w, i) => (
            <Skeleton
              key={i}
              className="h-9 shrink-0 rounded-full"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="mb-3 h-4 w-32" />
        <Card className="overflow-hidden">
          <ul className="divide-y divide-ink-800">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40 max-w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
            </li>
          ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
