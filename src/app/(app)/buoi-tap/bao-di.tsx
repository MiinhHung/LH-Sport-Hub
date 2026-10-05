"use client";

import { Check, X } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { setAttendanceAction } from "@/actions/sessions";
import { idleState } from "@/actions/types";
import { cn } from "@/lib/utils";

/**
 * Hai nút báo đi, dùng ngay trên danh sách lịch.
 *
 * TRƯỚC ĐÂY PHẢI MỞ THÊM MỘT TRANG MỚI BÁO ĐƯỢC. Cả cái thẻ buổi tập là
 * một thẻ liên kết sang trang chi tiết, nên việc người ta làm nhiều nhất
 * trong app — nói "tôi đi" hay "tôi bận" — tốn một lần tải trang. Với
 * một đội đánh hàng tuần thì đó là thao tác lặp đi lặp lại nhiều nhất.
 *
 * KHÔNG LỒNG NÚT TRONG THẺ LIÊN KẾT. Đó là lý do thẻ buổi tập phải tách
 * đôi: phần chữ là liên kết, phần nút nằm riêng bên ngoài. Nhét
 * \`<button>\` vào trong \`<a>\` là HTML sai, và trình duyệt sẽ xử lý cú
 * bấm theo kiểu khó đoán — có nơi chạy action, có nơi nhảy luôn sang
 * trang kia.
 *
 * Dùng lại nguyên \`setAttendanceAction\` của trang chi tiết, không viết
 * action mới: mọi luật (buổi đã đóng, đã kết thúc, đã đủ người) chỉ có
 * một chỗ để đúng hoặc sai. Action đó đã gọi \`revalidatePath("/buoi-tap")\`
 * nên danh sách tự cập nhật sau khi bấm.
 */

function Nut({
  value,
  active,
  tone,
  children,
}: {
  value: "going" | "not_going";
  active: boolean;
  tone: "gold" | "rose";
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="answer"
      value={value}
      disabled={pending}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[12.5px] font-bold transition-all duration-200 disabled:opacity-60 sm:flex-none",
        active &&
          tone === "gold" &&
          "border-gold-300 bg-gold-100 text-gold-700 dark:bg-gold-400/20 dark:text-gold-300",
        active &&
          tone === "rose" &&
          "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-300",
        !active &&
          "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:bg-ink-850 hover:text-ink-200 active:translate-y-px",
      )}
    >
      {children}
    </button>
  );
}

export function BaoDi({
  sessionId,
  isGoing,
  isNotGoing,
  daDayNguoi,
}: {
  sessionId: string;
  isGoing: boolean;
  isNotGoing: boolean;
  /** Đã đủ người và mình chưa nhận đi: không cho bấm "Đi" nữa. */
  daDayNguoi: boolean;
}) {
  const [state, action] = useActionState(setAttendanceAction, idleState);

  return (
    <form action={action} className="min-w-0">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="flex gap-1.5">
        {!(daDayNguoi && !isGoing) && (
          <Nut value="going" active={isGoing} tone="gold">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
            {isGoing ? "Có đi" : "Đi"}
          </Nut>
        )}
        <Nut value="not_going" active={isNotGoing} tone="rose">
          <X className="size-3.5" strokeWidth={3} aria-hidden />
          Bận
        </Nut>
      </div>

      {/*
        Lỗi hiện ngay dưới hai cái nút, không dùng hộp Alert như trang chi
        tiết. Ở danh sách thì mỗi dòng chỉ cao chừng này, chen một hộp
        viền vào sẽ đẩy cả danh sách nhảy một nhịp.
      */}
      {state.status === "error" && state.message && (
        <p className="mt-1.5 text-[11.5px] font-medium text-rose-600 dark:text-rose-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
