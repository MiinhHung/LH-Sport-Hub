import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

/* Khớp page.tsx: thẻ ba con số, rồi hai cột (danh sách thành viên + nhật ký). */
export default function Loading() {
  const rong = [44, 36, 52, 40, 48, 32];
  return (
    <div className="space-y-6">
      <PageIntroSkeleton />

      <Card>
        <div className="grid grid-cols-3 divide-x divide-ink-800">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3.5 sm:px-5 sm:py-4"
            >
              <Skeleton className="hidden size-10 shrink-0 rounded-lg sm:block" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <div className="border-b border-ink-800 px-4 py-3.5 sm:px-5">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="divide-y divide-ink-800">
            {rong.map((w, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4" style={{ width: `${w}%` }} />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="hidden h-8 w-24 rounded-lg sm:block" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="px-4 pt-4 pb-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-4 h-3 w-16" />
          <div className="mt-3 space-y-3.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5 pt-px">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
