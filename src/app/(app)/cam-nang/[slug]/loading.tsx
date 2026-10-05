import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />

      {/* Dòng cuối mỗi đoạn ngắn hơn, như chữ thật */}
      <div className="space-y-6 pt-2">
        {[0, 1, 2].map((d) => (
          <div key={d} className="space-y-2.5">
            {[100, 100, 94, 62].map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
            ))}
          </div>
        ))}
      </div>
    </article>
  );
}
