import { Card, Skeleton } from "@/components/ui";

/** Giữ đúng dáng trang chi tiết: thẻ đầu trang có ô ngày, rồi hai cột
 *  (điểm danh + người đi bên trái, người tổ chức + chi phí bên phải). */
export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-20" />

      <Card>
        <div className="flex gap-4 p-4 sm:gap-5 sm:p-6">
          <Skeleton className="h-[84px] w-16 shrink-0 rounded-xl sm:w-[72px]" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-lg" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-4 w-44 max-w-full" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-4 sm:p-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
            <Skeleton className="mt-4 h-11 w-full rounded-lg" />
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 pt-4 pb-2 sm:px-5">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid gap-0.5 px-2 pb-2 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4">
            <Skeleton className="h-4 w-28" />
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-3 h-4 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
