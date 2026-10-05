import {
  Card,
  ListSkeleton,
  PageIntroSkeleton,
  Skeleton,
} from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageIntroSkeleton />

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-10" />
          </Card>
        ))}
      </div>

      <ListSkeleton rows={6} />

      <Card className="p-5">
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
