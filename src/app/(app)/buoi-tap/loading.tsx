import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

/** Giữ đúng dáng trang lịch: nhóm theo tuần, mỗi ngày một hàng có ô
 *  ngày bên trái, các buổi bên phải với cột sĩ số và nút báo đi. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-6">
        <PageIntroSkeleton />
        <Skeleton className="mb-1 h-10 w-40 shrink-0 rounded-lg" />
      </div>

      <Skeleton className="h-4 w-80 max-w-full" />

      <Card className="p-3 sm:p-4">
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-lg" />
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        {[2, 1].map((soNgay, nhom) => (
          <section key={nhom}>
            <div className="flex items-center gap-2 py-2.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>

            <Card className="mt-1 overflow-hidden">
              <ul className="divide-y divide-ink-800">
                {Array.from({ length: soNgay }).map((_, i) => (
                  <li key={i} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                    <Skeleton className="h-[62px] w-12 shrink-0 rounded-lg" />

                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-5 w-52 max-w-full" />
                        <Skeleton className="h-3 w-36" />
                        <div className="flex items-center gap-2 pt-1">
                          <Skeleton className="h-6 w-16 rounded-lg" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:w-[168px] sm:shrink-0">
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-1.5 w-full rounded-full" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
