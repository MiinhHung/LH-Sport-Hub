import {
  Card,
  CardSkeleton,
  PageIntroSkeleton,
  Skeleton,
} from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageIntroSkeleton />

      <div className="grid gap-2.5 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="mt-2 h-6 w-10" />
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {[0, 1].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
