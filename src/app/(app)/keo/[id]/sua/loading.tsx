import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

/** Khung chờ biểu mẫu kèo: các thẻ bước bên trái, thẻ xem trước bên phải. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-4 w-24" />
      <PageIntroSkeleton />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {[3, 2, 2].map((n, k) => (
            <Card key={k} className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-ink-800 px-4 py-3.5 sm:px-5">
                <Skeleton className="size-7 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
              </div>
              <div className="space-y-5 p-4 sm:p-5">
                {Array.from({ length: n }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="hidden lg:block">
          <Skeleton className="mb-2.5 h-3 w-36" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
