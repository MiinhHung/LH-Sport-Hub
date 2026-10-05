import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Skeleton className="h-4 w-24" />

      <div className="space-y-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-9 w-3/4" />
      </div>

      {/* Dải đối đầu: hai cột đội, giữa là tỉ số, chân là tiền cược */}
      <div className="overflow-hidden rounded-2xl border border-ink-800">
        <div className="grid sm:grid-cols-[1fr_auto_1fr]">
          <div className="p-5">
            <Skeleton className="h-3 w-14" />
            <div className="mt-3 space-y-2.5">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="size-8 shrink-0 rounded-[9px]" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 border-y border-ink-800 px-5 py-6 sm:border-x sm:border-y-0">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>

          <div className="p-5">
            <Skeleton className="h-3 w-14" />
            <div className="mt-3 space-y-2.5">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="size-8 shrink-0 rounded-[9px]" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 border-t border-ink-800 px-4 py-3.5">
          <Skeleton className="size-7 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      <div className="grid divide-y divide-ink-800 rounded-2xl border border-ink-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 px-4 py-3.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
