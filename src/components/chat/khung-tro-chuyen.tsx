"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Nửa phải của phần tin nhắn.
 *
 * TỒN TẠI CHỈ ĐỂ ẨN ĐI TRÊN ĐIỆN THOẠI. Khung hai cột đặt ở layout, mà
 * layout là Server Component nên không biết đang ở đường dẫn nào. Cột
 * trái đã tự ẩn khi mở một cuộc (nó là Client Component, đọc được
 * `usePathname`); nửa phải thì chưa có ai làm việc ngược lại.
 *
 * Hậu quả: ở trang danh sách `/tin-nhan` trên điện thoại, khung trò
 * chuyện rỗng vẫn chiếm `flex-1`, ép danh sách co lại còn 188px trên
 * màn 390 và để lại một mảng trắng bên phải chẳng chứa gì.
 *
 * Từ `md` trở lên thì giữ nguyên hai cột như cũ — ở đó khung rỗng là có
 * ích, nó nói "chọn một người đi".
 */
export function KhungTroChuyen({ children }: { children: React.ReactNode }) {
  const duongDan = usePathname();
  const dangMoMotCuoc = duongDan !== "/tin-nhan";

  return (
    <section
      className={cn("min-w-0 flex-1", !dangMoMotCuoc && "hidden md:block")}
    >
      {children}
    </section>
  );
}
