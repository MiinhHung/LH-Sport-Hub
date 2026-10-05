import { PageIntroSkeleton, Skeleton } from "@/components/ui";

/** Giữ đúng dáng mới của trang lịch: nhóm theo tuần, mỗi buổi một dòng
 *  có ô ngày bên trái và nút báo đi bên phải. */
export default function Loading() {
  return (
    <div className="space-y-8">
      <PageIntroSkeleton />

      <div className="space-y-7">
        {[3, 2].map((soDong, nhom) => (
          <section key={nhom}>
            <Skeleton className="h-3 w-28" />

            <ul className="mt-2 divide-y divide-ink-800 overflow-hidden rounded-2xl border border-ink-800">
              {Array.from({ length: soDong }).map((_, i) => (
                <li key={i} className="flex gap-3 px-3 py-3.5 sm:gap-4 sm:px-4">
                  <Skeleton className="h-[62px] w-[58px] shrink-0 rounded-xl" />

                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-5 w-48 max-w-full" />
                      <Skeleton className="h-3 w-40" />
                    </div>

                    <div className="flex items-center gap-2 sm:w-[150px] sm:shrink-0">
                      <Skeleton className="h-7 w-20 rounded-full" />
                      <Skeleton className="h-4 w-8" />
                    </div>

                    <div className="flex gap-1.5 sm:w-[132px] sm:shrink-0">
                      <Skeleton className="h-9 flex-1 rounded-xl" />
                      <Skeleton className="h-9 flex-1 rounded-xl" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
