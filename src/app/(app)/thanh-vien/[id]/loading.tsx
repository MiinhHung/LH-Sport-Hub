import { Card, CardSkeleton, Skeleton } from "@/components/ui";
import { DaiDauHoSoSkeleton } from "@/components/ho-so/dai-dau";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-4 w-28" />
      <DaiDauHoSoSkeleton hanhDong />

      {/* Đối đầu */}
      <Card className="overflow-hidden pb-4">
        <div className="px-4 pt-4 pb-3 sm:px-5">
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="mx-3 h-[92px] rounded-xl sm:mx-4" />
        <Skeleton className="mx-auto mt-3 h-4 w-44" />
      </Card>

      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        {[0, 1].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
