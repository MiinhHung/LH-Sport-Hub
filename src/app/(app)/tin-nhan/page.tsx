import { MessagesSquare } from "lucide-react";
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
    <div className="hidden h-full flex-col items-center justify-center px-6 text-center md:flex">
      <span
        aria-hidden
        className="grid size-14 place-items-center rounded-2xl border border-ink-800 bg-ink-850 text-ink-500"
      >
        <MessagesSquare className="size-6" />
      </span>

      <h2 className="font-display mt-5 text-[22px] font-bold text-ink-100">
        Chọn một người để bắt đầu
      </h2>
      <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-500">
        Nhắn riêng cho từng người trong team. Chỉ hai người trong cuộc trò
        chuyện đọc được.
      </p>
    </div>
  );
}
