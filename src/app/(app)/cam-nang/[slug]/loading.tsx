import { Skeleton } from "@/components/ui";

/** Khung chờ trang bài: cột chữ bên trái, mục lục dính bên phải trên màn rộng. */
export default function Loading() {
  return (
    <div className="mx-auto grid max-w-[60rem] grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_200px] xl:gap-14">
      <div className="min-w-0">
        <Skeleton className="h-4 w-24" />

        <div className="space-y-3 pt-6">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-full max-w-[60ch]" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <Skeleton className="mt-7 aspect-[16/9] w-full rounded-xl" />

        {/* Dòng cuối mỗi đoạn ngắn hơn, như chữ thật */}
        <div className="max-w-[65ch] space-y-6 pt-7">
          {[0, 1, 2].map((d) => (
            <div key={d} className="space-y-2.5">
              {[100, 100, 94, 62].map((w, i) => (
                <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden space-y-3 pt-[52px] lg:block">
        <Skeleton className="h-3 w-24" />
        {[80, 64, 72].map((w, i) => (
          <Skeleton key={i} className="h-3.5" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
