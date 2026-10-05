import { dangHoatDong } from "@/lib/hoat-dong";
import { cn } from "@/lib/utils";

const CO = {
  sm: "size-2.5 ring-2",
  md: "size-3 ring-2",
  lg: "size-4 ring-[3px]",
} as const;

/**
 * Chấm xanh góc ảnh đại diện.
 *
 * ĐẶT TRONG MỘT THẺ BỌC `relative`. Chấm neo theo góc dưới phải của thẻ
 * bọc chứ không theo ảnh, vì nhiều chỗ ảnh đã bị bọc trong một liên kết
 * rồi — neo theo ảnh thì phải sửa cả nắm chỗ khác nhau.
 *
 * VÒNG VIỀN KHÔNG PHẢI ĐỒ TRANG TRÍ. Thiếu nó thì chấm xanh đặt lên một
 * tấm ảnh có vùng sáng màu lục sẽ biến mất. Màu vòng phải khớp nền của
 * chỗ đang đặt, nên `ringClass` để truyền vào từng nơi.
 *
 * KHÔNG VẼ GÌ KHI NGƯỜI ĐÓ KHÔNG HOẠT ĐỘNG. Một cái chấm xám để chỉ
 * trạng thái "offline" chỉ thêm nhiễu: trên một lưới hai mươi người thì
 * hai mươi chấm xám làm mắt phải lọc, trong khi thứ cần tìm là vài chấm
 * xanh.
 */
export function ChamHoatDong({
  lastActiveAt,
  co = "md",
  ringClass = "ring-ink-900",
  className,
}: {
  lastActiveAt: Date | string | null;
  co?: keyof typeof CO;
  /** Màu vòng viền, phải khớp nền phía sau. */
  ringClass?: string;
  className?: string;
}) {
  if (!dangHoatDong(lastActiveAt)) return null;

  return (
    <span
      role="img"
      aria-label="Đang hoạt động"
      title="Đang hoạt động"
      className={cn(
        "absolute right-0 bottom-0 block rounded-full bg-emerald-500",
        CO[co],
        ringClass,
        className,
      )}
    />
  );
}
