"use client";

import { Check, X } from "@/components/icons";
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
 * trong app (nói "tôi đi" hay "tôi bận") tốn một lần tải trang. Với
 * một đội đánh hàng tuần thì đó là thao tác lặp đi lặp lại nhiều nhất.
 *
 * KHÔNG LỒNG NÚT TRONG THẺ LIÊN KẾT. Đó là lý do thẻ buổi tập phải tách
 * đôi: phần chữ là liên kết, phần nút nằm riêng bên ngoài. Nhét
 * \`<button>\` vào trong \`<a>\` là HTML sai, và trình duyệt sẽ xử lý cú
 * bấm theo kiểu khó đoán: có nơi chạy action, có nơi nhảy luôn sang
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
        "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold outline-none transition-[background-color,border-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-gold-400/40 active:scale-[0.98] disabled:opacity-60",
        active &&
          tone === "gold" &&
          "border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300",
        active &&
          tone === "rose" &&
          "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
        !active &&
          "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:text-ink-100",
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
      {/* Hai nút cạnh nhau. Bên đang chọn có viền đậm, chữ đổi màu và
          hiện dấu, nên không chỉ dựa vào màu. */}
      <div role="group" aria-label="Báo đi buổi này" className="flex gap-1.5">
        {!(daDayNguoi && !isGoing) && (
          <Nut value="going" active={isGoing} tone="gold">
            {isGoing && <Check className="size-3.5" aria-hidden />}
            {isGoing ? "Có đi" : "Đi"}
          </Nut>
        )}
        <Nut value="not_going" active={isNotGoing} tone="rose">
          {isNotGoing && <X className="size-3.5" aria-hidden />}
          Bận
        </Nut>
      </div>

      {/*
        Lỗi hiện ngay dưới hai cái nút, không dùng hộp Alert như trang chi
        tiết. Ở danh sách thì mỗi dòng chỉ cao chừng này, chen một hộp
        viền vào sẽ đẩy cả danh sách nhảy một nhịp.
      */}
      {state.status === "error" && state.message && (
        <p className="mt-1.5 text-[12px] font-medium text-rose-600 dark:text-rose-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
