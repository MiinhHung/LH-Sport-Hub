import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Một bước trong biểu mẫu dài.
 *
 * TRƯỚC ĐÂY LÀ MẤY CÁI THẺ TRẮNG XẾP CHỒNG. Chụp trang "Tạo kèo" ở màn
 * 1440: bốn hộp trắng giống hệt nhau, không hộp nào có tiêu đề, cao
 * tổng cộng 1620px. Người mở lần đầu không biết mình đang ở đoạn nào,
 * còn sắp hết hay chưa, và vì sao mấy ô này lại nằm chung một hộp.
 *
 * Thay bằng một đường ray dọc có đánh số, giống hàng buổi tập ở trang
 * lịch. Ray trả lời đúng ba câu hỏi mà một biểu mẫu dài hay bị hỏi:
 * đang ở bước nào, còn mấy bước, và nhóm ô này là về cái gì.
 *
 * Số thứ tự KHÔNG phải nút bấm được và không có trạng thái "đã xong":
 * đây là một tờ khai một trang, không phải trình thuật sĩ nhiều trang.
 * Vẽ ra cái vòng tròn có dấu tích thì hứa một thứ mà biểu mẫu không làm.
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
  /** Khối cuối thì không kẻ ray xuống dưới nữa. */
  cuoi?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="relative pl-10 sm:pl-12">
      {/* Ray dọc nối các số với nhau. Vẽ trong từng khối chứ không vẽ
          một đường xuyên suốt ở ngoài: khối ẩn đi (ví dụ "Chọn người"
          chỉ hiện với kèo đích danh) thì ray tự ngắn lại theo. */}
      {!cuoi && (
        <span
          aria-hidden
          className="absolute top-9 bottom-0 left-[15px] w-px bg-ink-800 sm:left-[19px]"
        />
      )}

      <span
        aria-hidden
        className="font-display absolute top-0 left-0 grid size-8 place-items-center rounded-full border border-ink-800 bg-ink-900 text-[13px] font-bold text-ink-400 sm:size-10 sm:text-[15px]"
      >
        {so}
      </span>

      <div className="pb-8">
        <h2 className="font-display text-[17px] leading-tight font-bold text-ink-100 sm:text-[19px]">
          {tieuDe}
        </h2>
        {moTa && (
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
            {moTa}
          </p>
        )}
        <div className="mt-4 space-y-4">{children}</div>
      </div>
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
        "rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 active:translate-y-px",
        active
          ? "border-gold-400 bg-gold-50 font-bold text-gold-700 shadow-[var(--shadow-soft)] dark:bg-gold-400/10 dark:text-gold-300"
          : "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:bg-ink-850 hover:text-ink-200",
        className,
      )}
    >
      {children}
    </button>
  );
}
