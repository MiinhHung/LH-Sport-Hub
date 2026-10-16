import type { ReactNode } from "react";

import { Check } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Một bước trong biểu mẫu dài.
 *
 * DỰNG THÀNH MỘT DÒNG THỜI GIAN DỌC. Bản trước mỗi bước là một thẻ có
 * thanh tiêu đề kẻ ngang; bốn, năm thẻ y hệt chồng lên nhau nên cả trang
 * thành một bức tường hộp xám, mắt không biết nhìn vào đâu. Giờ số thứ
 * tự nằm trên một đường ray bên trái nối các bước với nhau, tiêu đề to
 * rõ, còn các ô nằm trong một khung nhẹ — đọc như một trình tự chứ không
 * phải một đống thẻ.
 *
 * Số thứ tự KHÔNG phải nút bấm được và không có trạng thái "đã xong":
 * đây là một tờ khai một trang, không phải trình thuật sĩ nhiều trang.
 */
export function Khoi({
  so,
  tieuDe,
  moTa,
  cuoi,
  children,
}: {
  so: number;
  tieuDe: string;
  /** Một câu nói rõ nhóm ô này để làm gì. Bỏ qua nếu tiêu đề đã đủ. */
  moTa?: string;
  /** Khối cuối: không vẽ đoạn ray nối xuống bước sau. */
  cuoi?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 pb-8 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-5">
      {/* Ray: số thứ tự + đoạn nối xuống bước sau */}
      <div aria-hidden className="relative flex flex-col items-center">
        <span className="font-display tabular relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-navy-950 text-[15px] font-bold text-gold-300 ring-1 ring-gold-400/50 shadow-[0_0_0_5px_var(--color-ink-950),0_0_18px_rgba(220,174,66,0.25)] sm:size-11 sm:text-[17px]">
          {so}
        </span>
        {!cuoi && (
          <span className="mt-2 w-px flex-1 bg-gradient-to-b from-gold-400/40 via-ink-700 to-ink-800" />
        )}
      </div>

      <div className="min-w-0">
        <header className="pt-1 sm:pt-1.5">
          <h2 className="font-display text-[19px] leading-tight font-bold text-ink-100 sm:text-[22px]">
            {tieuDe}
          </h2>
          {moTa && (
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
              {moTa}
            </p>
          )}
        </header>
        <div className="mt-4 space-y-6 rounded-2xl border border-ink-800 bg-ink-900/70 p-4 sm:p-6">
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * Nút chọn một trong nhiều.
 *
 * Đang chọn: viền vàng phát sáng, nền ánh vàng và một dấu tích ở góc —
 * nhìn lướt là biết ô nào đang bật, kể cả với người không phân biệt tốt
 * màu (dấu tích không dựa vào màu).
 *
 * `doc`: xếp dọc (icon to ở trên, chữ ở dưới) cho các ô dạng thẻ như
 * phần thưởng; mặc định xếp ngang như một nút thường.
 */
export function Chip({
  active,
  children,
  onClick,
  className,
  doc,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
  doc?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-[14px] font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-gold-400/50 active:scale-[0.98] [&_svg]:size-[18px]",
        doc && "min-h-[86px] flex-col gap-2 [&_svg]:size-6",
        active
          ? "border-gold-400 bg-gradient-to-b from-gold-400/15 to-gold-400/5 text-gold-700 shadow-[0_0_0_1px_var(--color-gold-400),0_8px_24px_-12px_rgba(220,174,66,0.6)] dark:text-gold-300"
          : "border-ink-700/80 bg-ink-850/60 text-ink-400 hover:-translate-y-px hover:border-ink-600 hover:bg-ink-850 hover:text-ink-100",
        className,
      )}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-gold-400 text-navy-950 shadow-sm [&_svg]:!size-3"
        >
          <Check strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/**
 * Thanh gửi dính đáy màn hình: tóm tắt ngắn những gì đang chọn bên trái,
 * hai nút bên phải. Biểu mẫu dài, cuộn tới đâu cũng thấy nút Tạo, và thấy
 * luôn mình sắp tạo cái gì.
 *
 * Trên điện thoại nâng lên trên thanh điều hướng đáy (cao ~4.5rem).
 */
export function ThanhGui({
  tomTat,
  children,
}: {
  tomTat: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-2 lg:bottom-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-ink-700/80 bg-ink-900/90 p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:pl-5">
        <div className="min-w-0 text-[13px] leading-snug text-ink-400">
          {tomTat}
        </div>
        <div className="flex shrink-0 flex-row-reverse gap-2 sm:flex-row">
          {children}
        </div>
      </div>
    </div>
  );
}
