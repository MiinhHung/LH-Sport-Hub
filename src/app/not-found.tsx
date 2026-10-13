import type { Metadata } from "next";

import { Search } from "@/components/icons";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/**
 * Trang 404.
 *
 * KHÔNG ĐẶT ẢNH Ở ĐÂY. `not-found` nằm trong payload của MỌI route, và
 * React phát `<link rel="preload" as="image">` cho ảnh trong cây — nên
 * ảnh ở trang này rơi vào HTML của mọi trang. Đo trên bản dựng trước đây:
 * hai logo gốc thêm 479KB vào mỗi lần mở trang đăng nhập. Một ô biểu
 * tượng thì không tải gì cả.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-5 text-center">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-xl bg-navy-900 text-gold-300"
      >
        <Search className="size-6" />
      </span>
      <p className="mt-6 text-[13px] font-semibold text-gold-700 dark:text-gold-300">
        Lỗi 404
      </p>
      <h1 className="font-display mt-1.5 text-[28px] leading-tight font-bold text-ink-100 sm:text-[32px]">
        Không có gì ở đây cả
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-500">
        Trang bạn tìm không tồn tại, hoặc kèo này đã bị xoá.
      </p>
      <LinkButton href="/bang-tin" className="mt-7">
        Về bảng tin
      </LinkButton>
    </main>
  );
}
