import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Đường dẫn tới hồ sơ của một người.
 *
 * Hồ sơ của CHÍNH MÌNH đi về `/ho-so` chứ không phải `/thanh-vien/<id>`:
 * trang đó có thêm biểu mẫu chỉnh sửa, mà hai trang gần giống nhau mà
 * một cái sửa được còn cái kia không thì người ta sẽ loay hoay. Trang
 * `/thanh-vien/<id>` cũng tự chuyển hướng y như vậy nếu ai đó gõ tay —
 * ở đây chỉ là tránh một cú nhảy thừa.
 */
export function duongDanHoSo(id: string, nguoiXem: string) {
  return id === nguoiXem ? "/ho-so" : `/thanh-vien/${id}`;
}

/**
 * Bọc ảnh đại diện (hoặc tên) thành liên kết tới hồ sơ.
 *
 * CHỈ DÙNG Ở CHỖ KHÔNG NẰM TRONG MỘT LIÊN KẾT KHÁC. Thẻ kèo và hàng
 * buổi tập bọc cả thẻ trong một `<a>`, nhét thêm `<a>` vào trong là HTML
 * sai và trình duyệt sẽ xử lý cú bấm theo kiểu không đoán trước được.
 * Hai chỗ đó muốn bấm được ảnh thì phải dựng lại theo kiểu "liên kết phủ
 * nền" — việc riêng, chưa làm.
 */
export function LinkHoSo({
  id,
  nguoiXem,
  ten,
  className,
  children,
}: {
  id: string;
  nguoiXem: string;
  /** Tên người, dùng cho nhãn trợ năng. */
  ten: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={duongDanHoSo(id, nguoiXem)}
      aria-label={`Xem hồ sơ của ${ten}`}
      className={cn(
        "rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-gold-400/50",
        className,
      )}
    >
      {children}
    </Link>
  );
}
