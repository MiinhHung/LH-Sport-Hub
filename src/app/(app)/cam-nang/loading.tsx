import { Card, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Trang cẩm nang mở đầu bằng một dải cao 290-340px chứ không phải
          PageIntro, nên khung chờ phải giữ đúng chiều cao đó. */}
      <Skeleton className="h-[290px] w-full rounded-2xl sm:h-[340px]" />

      <Skeleton className="aspect-[21/9] w-full rounded-2xl" />

      <div className="flex gap-2 overflow-hidden">
        {[72, 88, 64, 96, 70].map((w, i) => (
          <Skeleton
            key={i}
            className="h-8 shrink-0 rounded-full"
            style={{ width: w }}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
