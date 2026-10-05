import { ListSkeleton, PageIntroSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageIntroSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
