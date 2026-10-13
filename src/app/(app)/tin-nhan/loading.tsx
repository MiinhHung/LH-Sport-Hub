import { Skeleton } from "@/components/ui";

/*
 * Tệp này nằm DƯỚI layout của tin nhắn, nên nó chỉ lấp nửa phải; cột
 * danh sách đã do layout dựng. Khung chờ vì thế giữ đúng dáng ô "chọn
 * một người" của page.tsx, và cũng ẩn trên điện thoại như ô đó.
 */
export default function Loading() {
  return (
    <div className="hidden h-full flex-col items-center justify-center bg-ink-850/40 px-6 md:flex">
      <Skeleton className="size-12 rounded-lg" />
      <Skeleton className="mt-4 h-5 w-52" />
      <Skeleton className="mt-2 h-3.5 w-64" />
      <Skeleton className="mt-1.5 h-3.5 w-44" />
    </div>
  );
}
