import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageIntroSkeleton />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* Bục 2 - 1 - 3 */}
          <Card className="overflow-hidden px-3 pt-6 sm:px-8 sm:pt-8">
            <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
              {(["h-16 sm:h-20", "h-24 sm:h-28", "h-11 sm:h-14"] as const).map(
                (cao, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Skeleton
                      className={i === 1 ? "size-16 rounded-full" : "size-10 rounded-full"}
                    />
                    <Skeleton className="mt-2.5 h-4 w-20 max-w-full" />
                    <Skeleton className="mt-2 h-8 w-12" />
                    <Skeleton className={`mt-3 w-full rounded-t-xl rounded-b-none ${cao}`} />
                  </div>
                ),
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 pt-4 pb-3 sm:px-5">
              <Skeleton className="h-4 w-24" />
            </div>
            <ul className="divide-y divide-ink-800 border-t border-ink-800">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Skeleton className="h-4 w-5 shrink-0" />
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="hidden h-4 w-10 sm:block" />
                  <Skeleton className="hidden h-4 w-10 sm:block" />
                  <Skeleton className="hidden h-4 w-10 sm:block" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <ul className="divide-y divide-ink-800 border-t border-ink-800">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
