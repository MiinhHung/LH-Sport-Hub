import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

/** Khung chờ giữ đúng dáng trang: đầu trang, hàng lọc, bài nổi bật, hai thẻ vừa, hàng gọn. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageIntroSkeleton />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-hidden">
            {[72, 88, 72, 64, 80, 84].map((w, i) => (
              <Skeleton
                key={i}
                className="h-9 shrink-0 rounded-full"
                style={{ width: w }}
              />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-lg md:w-64" />
        </div>

        <Card className="grid grid-cols-[minmax(0,1fr)] overflow-hidden md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Skeleton className="aspect-[16/9] w-full rounded-none md:aspect-auto md:min-h-[300px]" />
          <div className="space-y-3 p-5 sm:p-7 md:self-center">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </Card>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-2 p-4 sm:p-5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Card className="grid grid-cols-[minmax(0,1fr)] gap-x-2 p-2 md:grid-cols-2">
            {[70, 56, 82, 64, 76, 60].map((w, i) => (
              <div key={i} className="flex items-center gap-3.5 p-2">
                <Skeleton className="aspect-[4/3] w-20 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4" style={{ width: `${w}%` }} />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
