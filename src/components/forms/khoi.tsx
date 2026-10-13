import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Một bước trong biểu mẫu dài.
 *
 * Mỗi bước là một thẻ riêng: đầu thẻ có số thứ tự, tiêu đề và một câu
 * nói rõ nhóm ô này để làm gì; thân thẻ là các ô, nhãn nằm trên ô. Người
 * mở lần đầu biết ngay mình đang ở đoạn nào và còn mấy đoạn nữa.
 *
 * Số thứ tự KHÔNG phải nút bấm được và không có trạng thái "đã xong":
 * đây là một tờ khai một trang, không phải trình thuật sĩ nhiều trang.
 * Vẽ ra cái vòng tròn có dấu tích thì hứa một thứ mà biểu mẫu không làm.
 */
export function Khoi({
  so,
  tieuDe,
  moTa,
  children,
}: {
  so: number;
  tieuDe: string;
  /** Một câu nói rõ nhóm ô này để làm gì. Bỏ qua nếu tiêu đề đã đủ. */
  moTa?: string;
  /**
   * Khối cuối. Giữ lại cho tương thích: bản cũ dùng để ngắt đường ray
   * nối các số, giờ mỗi khối là một thẻ riêng nên không cần nữa.
   */
  cuoi?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-ink-800 bg-ink-900">
      <header className="flex items-start gap-3 border-b border-ink-800 px-4 py-3.5 sm:px-5">
        <span
          aria-hidden
          className="tabular grid size-7 shrink-0 place-items-center rounded-lg bg-navy-900 text-[13px] font-bold text-gold-300"
        >
          {so}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-[15px] leading-tight font-semibold text-ink-100">
            {tieuDe}
          </h2>
          {moTa && (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              {moTa}
            </p>
          )}
        </div>
      </header>
      <div className="space-y-5 p-4 sm:p-5">{children}</div>
    </section>
  );
}

/**
 * Nút chọn một trong nhiều.
 *
 * Tách ra khỏi `challenge-form` để `session-form` dùng chung — trước
 * đây chỉ trang tạo kèo có, nên trang tạo buổi tập phải dùng `<select>`
 * cho môn thể thao dù chỉ có ba lựa chọn. Ba lựa chọn mà bắt bấm mở
 * danh sách thả xuống là bắt thêm một cú chạm không cần thiết, nhất là
 * trên điện thoại.
 */
export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 rounded-lg border px-3 py-2 text-[14px] font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-gold-400/40 active:scale-[0.98]",
        active
          ? "border-gold-500 bg-gold-50 text-gold-700 ring-1 ring-gold-500 dark:bg-gold-400/10 dark:text-gold-300"
          : "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:bg-ink-850 hover:text-ink-100",
        className,
      )}
    >
      {children}
    </button>
  );
}
