import { Card, CardSkeleton, PageIntroSkeleton, Skeleton } from "@/components/ui";

/** Giữ đúng dáng trang thật, xem `page.tsx` cùng thư mục. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageIntroSkeleton />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {/* Ô soạn bài */}
          <Card className="p-4 sm:p-5">
            <div className="flex gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-14 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-14" />
                </div>
              </div>
            </div>
          </Card>
          {/* Thanh lọc */}
          <div className="flex gap-1.5">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
        {/* Cột phải chỉ hiện từ lg, nên khung chờ cũng phải ẩn y hệt. */}
        <div className="hidden space-y-4 lg:block">
          {[0, 1].map((i) => (
            <Card key={i} className="space-y-3 p-4">
              <Skeleton className="h-4 w-28" />
              {[0, 1].map((j) => (
                <div key={j} className="flex gap-3">
                  <Skeleton className="h-[58px] w-12 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
