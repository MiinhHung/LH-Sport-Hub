import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

/** Khung chờ cho một thẻ kèo: badge, tiêu đề, dải đối đầu, dòng thông tin phụ. */
function TheKeoCho() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-24 rounded-lg" />
        <Skeleton className="h-3.5 w-14" />
      </div>
      <Skeleton className="mt-3 h-5 w-2/3" />
      <div className="mt-3.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-ink-850 px-3.5 py-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-10 bg-ink-800" />
          <Skeleton className="h-4 w-20 bg-ink-800" />
          <Skeleton className="size-8 rounded-full bg-ink-800" />
        </div>
        <Skeleton className="h-6 w-10 bg-ink-800" />
        <div className="flex flex-col items-end space-y-2">
          <Skeleton className="h-3 w-10 bg-ink-800" />
          <Skeleton className="h-4 w-20 bg-ink-800" />
          <Skeleton className="size-8 rounded-full bg-ink-800" />
        </div>
      </div>
      <Skeleton className="mt-3 h-3.5 w-3/4" />
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageIntroSkeleton />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
            <div className="flex gap-1.5">
              {[96, 92, 68, 60].map((w) => (
                <Skeleton
                  key={w}
                  className="h-10 rounded-full"
                  style={{ width: w }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              {[72, 92, 52].map((w) => (
                <Skeleton
                  key={w}
                  className="h-10 rounded-full"
                  style={{ width: w }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <TheKeoCho key={i} />
            ))}
          </div>
        </div>

        <div className="hidden space-y-4 lg:block">
          {[3, 2].map((n) => (
            <Card key={n} className="p-4">
              <Skeleton className="h-4 w-28" />
              <div className="mt-4 space-y-4">
                {Array.from({ length: n }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
