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

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-5 w-36" />
      </div>

      <div className="space-y-3 pt-4">
        {BONG.map((b, i) => (
          <div
            key={i}
            className={b.ben === "phai" ? "flex justify-end" : "flex"}
          >
            <Skeleton
              className="h-10 rounded-2xl"
              style={{ width: `${b.w}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
