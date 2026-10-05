import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Trang này tự viết đầu trang riêng, chữ to hơn các trang khác, nên
          khung chờ bám theo đúng cỡ đó chứ không dùng PageIntroSkeleton. */}
      <div className="space-y-2.5">
        <Skeleton className="h-11 w-52 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex w-20 shrink-0 flex-col items-center gap-2"
          >
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>

      <ul className="divide-y divide-ink-800 border-y border-ink-800">
        {[72, 58, 84, 64, 76].map((w, i) => (
          <li key={i} className="flex items-center gap-3 py-4">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3" style={{ width: `${w}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
