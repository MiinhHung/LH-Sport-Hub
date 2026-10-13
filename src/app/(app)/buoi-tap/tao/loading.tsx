import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

/** Giữ đúng dáng biểu mẫu buổi tập: bốn thẻ bước đánh số (xem `Khoi`),
 *  nút lưu ở cuối. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-4 w-24" />
      <PageIntroSkeleton />

      <div className="space-y-6">
        {[2, 2, 3, 3].map((soO, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-ink-800 px-4 py-3.5 sm:px-5">
              <Skeleton className="size-7 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
            </div>
            <div className="space-y-5 p-4 sm:p-5">
              {Array.from({ length: soO }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t border-ink-800 pt-5">
        <Skeleton className="h-10 w-16 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
