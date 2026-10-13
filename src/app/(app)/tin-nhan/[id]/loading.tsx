import { Skeleton } from "@/components/ui";

/** Bong bóng so le hai bên, dài ngắn khác nhau. Một cột bong bóng đều
 *  tăm tắp không ra hình một cuộc trò chuyện. */
const BONG = [
  { ben: "trai", w: 58 },
  { ben: "phai", w: 42 },
  { ben: "trai", w: 70 },
  { ben: "phai", w: 36 },
  { ben: "trai", w: 50 },
];

/* Khớp page.tsx: đầu cột, vùng tin nhắn, ô soạn tin dưới đáy. */
export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-3 border-b border-ink-800 bg-ink-900 px-3 py-2.5 sm:px-4 md:px-5 md:py-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-4 py-5 sm:px-5">
        <div className="flex justify-center py-1">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        {BONG.map((b, i) => (
          <div
            key={i}
            className={b.ben === "phai" ? "flex justify-end" : "flex"}
          >
            <Skeleton
              className="h-10 rounded-xl"
              style={{ width: `${b.w}%` }}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-ink-800 bg-ink-900 px-3 py-3 sm:px-4">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
