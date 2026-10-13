import type { Metadata } from "next";

import { Search } from "@/components/icons";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Không tìm thấy nội dung" };

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-5 text-center">
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
        Không tìm thấy trang hoặc nội dung
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-500">
        Nội dung này có thể không tồn tại, bạn không có quyền truy cập hoặc đã bị xoá.
      </p>
      <LinkButton href="/bang-tin" className="mt-7">
        Về bảng tin
      </LinkButton>
    </div>
  );
}
