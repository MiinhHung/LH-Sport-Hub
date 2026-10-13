import { Card, CardSkeleton, Skeleton } from "@/components/ui";
import { DaiDauHoSoSkeleton } from "@/components/ho-so/dai-dau";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DaiDauHoSoSkeleton hanhDong />

      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        {[0, 1].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <Card>
        <div className="border-b border-ink-800 px-4 py-4 sm:px-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-3 w-64 max-w-full" />
        </div>
        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
