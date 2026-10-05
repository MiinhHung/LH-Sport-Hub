import { Card, CardSkeleton, PageIntroSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageIntroSkeleton />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {/* Ô soạn bài */}
          <Card className="p-5">
            <div className="flex gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <Skeleton className="h-20 flex-1 rounded-xl" />
            </div>
          </Card>
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        {/* Cột phải chỉ hiện từ lg, nên khung chờ cũng phải ẩn y hệt. Nếu
            không thì trên điện thoại hiện ra ba khối rồi lại biến mất. */}
        <div className="hidden space-y-4 lg:block">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
