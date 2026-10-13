import { Card, Skeleton } from "@/components/ui";

function CotDoiCho({ guong }: { guong?: boolean }) {
  return (
    <div className={guong ? "p-4 sm:flex sm:flex-col sm:items-end sm:p-5" : "p-4 sm:p-5"}>
      <Skeleton className="h-4 w-16" />
      <div className="mt-3.5 space-y-2.5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={guong ? "flex items-center gap-2.5 sm:flex-row-reverse" : "flex items-center gap-2.5"}
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />

      <div className="space-y-3">
        <Skeleton className="h-5 w-24 rounded-lg" />
        <Skeleton className="h-8 w-3/4" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Bảng tỉ số: dải navy, hai cột đội, giữa là tỉ số, chân là phần thưởng */}
        <Card className="overflow-hidden">
          <div className="h-[38px] bg-navy-900" />
          <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <CotDoiCho />
            <div className="flex min-w-36 flex-col items-center justify-center gap-2 border-y border-ink-800 px-5 py-6 sm:border-x sm:border-y-0">
              <Skeleton className="h-11 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <CotDoiCho guong />
          </div>
          <div className="flex items-center gap-3.5 border-t border-ink-800 px-4 py-3.5 sm:px-5">
            <Skeleton className="size-11 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Skeleton className="h-4 w-24" />
          <div className="mt-4 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
