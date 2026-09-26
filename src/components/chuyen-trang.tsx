"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/**
 * Chuyển trang kiểu vụt vợt: một lằn chéo quét ngang màn hình, trang mới
 * hiện ra phía sau lằn đó.
 *
 * DỰA TRÊN `<ViewTransition>` CỦA REACT, KHÔNG PHẢI THƯ VIỆN ĐỘNG.
 * Trình duyệt tự chụp ảnh trang cũ và trang mới rồi chuyển giữa hai ảnh
 * đó, nên không phải giữ trang cũ sống thêm một nhịp trong cây React —
 * thứ vốn hay làm hỏng cuộn trang và tiêu điểm bàn phím.
 *
 * `key={pathname}` MỚI LÀ THỨ KÍCH HOẠT. Chỉ đặt `name` thôi thì React coi
 * đây là cùng một khối nội dung được cập nhật tại chỗ, và không có cặp
 * cũ/mới nào để chuyển. Đổi khoá thì nó thành một khối ra và một khối vào.
 *
 * ĐẶT TRONG LAYOUT ĐƯỢC, vì dùng kiểu `share` chứ không phải `enter`/`exit`.
 * Tài liệu Next khuyên đặt ở từng `page.tsx` — nhưng lời khuyên đó dành cho
 * kiểu trượt theo hướng, nơi cần `enter`/`exit` mà layout thì không bao giờ
 * ra/vào. Ở đây khoá đổi ngay bên trong layout, nên cặp vẫn hình thành, và
 * đổi lại là không phải sửa hơn hai mươi trang.
 *
 * `default="none"` để khối này đứng yên trong những lần chuyển cảnh không
 * liên quan — nút quay lại của trình duyệt, `router.refresh()`, hay một
 * Suspense nào đó vừa tải xong.
 *
 * Trình duyệt không hỗ trợ View Transitions thì trang vẫn đổi bình thường,
 * chỉ là đổi thẳng không có hiệu ứng.
 */
export function ChuyenTrang({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition
      key={pathname}
      name="than-trang"
      share="vut-vot"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
