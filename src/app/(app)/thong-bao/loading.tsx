import { Card, PageIntroSkeleton, Skeleton } from "@/components/ui";

/* Khung chờ khớp bố cục thật: tiêu đề mốc thời gian + một thẻ chia dòng. */
export default function Loading() {
  const rong = [72, 58, 84, 64, 76, 52];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageIntroSkeleton />
      {[4, 3].map((so, nhom) => (
        <div key={nhom}>
          <Skeleton className="mb-3 h-4 w-20" />
          <Card className="divide-y divide-ink-800 overflow-hidden">
            {Array.from({ length: so }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 px-4 py-3.5 sm:px-5"
              >
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <Skeleton
                    className="h-4"
                    style={{ width: `${rong[(i + nhom * 2) % rong.length]}%` }}
                  />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}
