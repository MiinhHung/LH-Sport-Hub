import { MessagesSquare } from "@/components/icons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tin nhắn" };

/**
 * Nửa phải khi chưa chọn ai.
 *
 * `hidden md:flex` — trên điện thoại nửa này KHÔNG hiện, vì ở đó
 * `/tin-nhan` là chính cái danh sách, và màn hình chỉ đủ chỗ cho một
 * cột. Hiện ra thì người dùng phải cuộn qua một ô trống mới tới danh
 * sách thật.
 *
 * Toàn bộ dữ liệu của trang nằm ở layout, nên tệp này chỉ còn đúng việc
 * lấp chỗ trống bên phải.
 */
export default function MessagesIndexPage() {
  return (
    <div className="hidden h-full flex-col items-center justify-center bg-ink-850/40 px-6 text-center md:flex">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-lg bg-navy-900 text-gold-300 dark:bg-ink-800"
      >
        <MessagesSquare className="size-6" />
      </span>

      <h2 className="mt-4 text-[16px] font-semibold text-ink-100">
        Chọn một người để bắt đầu
      </h2>
      <p className="mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-500">
        Nhắn riêng cho từng người trong team. Chỉ hai người trong cuộc trò
        chuyện đọc được.
      </p>
    </div>
  );
}
