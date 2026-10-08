import type { Metadata } from "next";
import Image from "next/image";

import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/**
 * Trang 404.
 *
 * HAI THẺ LOGO Ở ĐÂY TỪNG LÀM NẶNG MỌI TRANG CỦA APP, KHÔNG RIÊNG TRANG
 * NÀY. Trước đây chúng là `<img>` thô trỏ thẳng vào tệp gốc. React phát
 * ra `<link rel="preload" as="image">` cho ảnh trong cây, mà `not-found`
 * thì nằm trong payload của MỌI route — nên hai thẻ preload ấy rơi vào
 * HTML của mọi trang.
 *
 * Đo trên bản dựng, màn 390px, trang đăng nhập:
 *
 *   /logo.png         335 KB
 *   /logo-light.png   144 KB
 *
 * 479KB tải về ở mỗi lần mở trang, để vẽ một logo 64px trên một trang
 * gần như không ai nhìn thấy. Qua `next/image` thì cùng chỗ đó còn vài
 * KB, vì nó phục vụ đúng cỡ hiển thị.
 *
 * Ngay trên hai thẻ cũ có dòng tắt luật `@next/next/no-img-element` —
 * đúng cái luật lẽ ra đã bắt được chuyện này.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      {/* Hai bản logo — xem ghi chú ở (app)/layout.tsx: mix-blend-multiply
          trên nền tối làm logo biến mất hẳn. */}
      <Image
        src="/logo.png"
        alt=""
        aria-hidden
        width={64}
        height={64}
        sizes="64px"
        className="h-16 w-16 object-contain opacity-60 mix-blend-multiply dark:hidden"
        style={{ objectPosition: "center 28%" }}
      />
      <Image
        src="/logo-light.png"
        alt=""
        aria-hidden
        width={656}
        height={562}
        sizes="80px"
        className="hidden h-16 w-auto object-contain opacity-70 dark:block"
      />
      <p className="mt-6 text-[11px] font-bold tracking-[0.2em] text-gold-700 dark:text-gold-300 uppercase">
        Lỗi 404
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold text-ink-100">
        Không có gì ở đây cả
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
        Trang bạn tìm không tồn tại, hoặc kèo này đã bị xoá.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <LinkButton href="/keo" variant="primary">
          Về trang Kèo
        </LinkButton>
        <LinkButton href="/buoi-tap" variant="secondary">
          Xem lịch tập
        </LinkButton>
      </div>
    </main>
  );
}
