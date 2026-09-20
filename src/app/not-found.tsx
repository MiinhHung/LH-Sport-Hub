import type { Metadata } from "next";
import Link from "next/link";

import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      {/* Hai bản logo — xem ghi chú ở (app)/layout.tsx: mix-blend-multiply
          trên nền tối làm logo biến mất hẳn. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden
        className="h-16 w-16 object-contain opacity-60 mix-blend-multiply dark:hidden"
        style={{ objectPosition: "center 28%" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.png"
        alt=""
        aria-hidden
        className="hidden h-16 w-auto object-contain opacity-70 dark:block"
      />
      <p className="mt-6 text-[11px] font-bold tracking-[0.2em] text-gold-600 dark:text-gold-300 uppercase">
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
