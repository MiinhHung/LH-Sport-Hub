"use client";

import { TriangleAlert } from "@/components/icons";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Hộp thoại hỏi lại trước khi làm việc không lùi được.
 *
 * THAY CHO `window.confirm`. Hộp thoại mặc định của trình duyệt có ba
 * chỗ hỏng mà không sửa được bằng cách nào:
 *
 *  1. Nó in nguyên dòng "localhost:3000 says" ở trên cùng. Người dùng
 *     thấy tên máy chủ chứ không thấy tên app — trông như một cảnh báo
 *     lạ chen vào giữa, không phải một câu hỏi của chính app.
 *  2. Hai nút là "OK" và "Cancel", tiếng Anh, KHÔNG đổi được. Cả app
 *     tiếng Việt mà đúng chỗ nguy hiểm nhất lại hỏi bằng tiếng Anh.
 *  3. Không phân biệt được việc xoá hẳn với việc thường: hỏi xoá bình
 *     luận hay hỏi lưu nháp đều cùng một cái hộp xám như nhau.
 *
 * DÙNG THẺ `<dialog>` THẬT, không dựng bằng `div`. Trình duyệt cho sẵn
 * ba thứ mà hộp thoại tự dựng phải làm lại bằng tay và hay làm sai: giữ
 * tiêu điểm bên trong, đóng bằng Esc, và nằm ở lớp trên cùng nên không
 * bao giờ bị thứ khác đè lên — kể cả cái menu tài khoản đang để z-70.
 *
 * API cố ý giống `window.confirm` để thay thế từng chỗ cho dễ:
 *
 *   const { hoi, hopThoai } = useHoiLai();
 *   if (!(await hoi({ tieuDe: "Xoá bình luận này?" }))) return;
 *   ...
 *   return <>{nutCuaBan}{hopThoai}</>;
 */

type NoiDung = {
  tieuDe: string;
  moTa?: string;
  /** Chữ trên nút đồng ý. Mặc định "Xoá". */
  nhanDongY?: string;
  /** Việc này xoá hẳn dữ liệu: nút đồng ý chuyển sang màu cảnh báo. */
  nguyHiem?: boolean;
};

/**
 * Tách một câu nhắc dài thành tiêu đề và mô tả.
 *
 * Mấy chỗ gọi cũ truyền nguyên một chuỗi kiểu "Xoá bài này? Không khôi
 * phục lại được." Dồn hết vào tiêu đề thì câu hỏi và lời cảnh báo nằm
 * cùng một dòng đậm, đọc ra một khối chữ chứ không ra một câu hỏi có
 * kèm hậu quả. Cắt ở dấu chấm hỏi hoặc dấu chấm đầu tiên: vế đầu thành
 * câu hỏi, phần còn lại thành dòng giải thích nhạt hơn ở dưới.
 */
export function tachCau(chu: string): { tieuDe: string; moTa?: string } {
  const m = /^(.*?[?.!])\s+(.+)$/s.exec(chu.trim());
  if (!m) return { tieuDe: chu.trim() };
  return { tieuDe: m[1].trim(), moTa: m[2].trim() };
}

export function useHoiLai() {
  const ref = React.useRef<HTMLDialogElement>(null);
  const traLoi = React.useRef<((ok: boolean) => void) | null>(null);
  const [noiDung, setNoiDung] = React.useState<NoiDung | null>(null);

  const hoi = React.useCallback((n: NoiDung) => {
    // Đang hỏi dở mà hỏi tiếp: câu cũ coi như "Thôi", kẻo lời hứa cũ bị
    // ghi đè rồi treo mãi.
    traLoi.current?.(false);
    setNoiDung(n);
    return new Promise<boolean>((resolve) => {
      traLoi.current = resolve;
      // Đợi React vẽ xong nội dung rồi mới mở, nếu không lần đầu hộp
      // thoại mở ra trống trơn. Đang mở sẵn thì gọi lại showModal sẽ lỗi.
      requestAnimationFrame(() => {
        const d = ref.current;
        if (d && !d.open) d.showModal();
      });
    });
  }, []);

  // Gỡ component khi còn đang hỏi: trả "Thôi" để đoạn mã đang `await`
  // chạy tiếp được, không treo.
  React.useEffect(
    () => () => {
      traLoi.current?.(false);
      traLoi.current = null;
    },
    [],
  );

  const dong = React.useCallback((ok: boolean) => {
    ref.current?.close();
    traLoi.current?.(ok);
    traLoi.current = null;
  }, []);

  const hopThoai = (
    <dialog
      ref={ref}
      /*
       * `onCancel` bắt cả phím Esc lẫn cú bấm ra ngoài. Không bắt thì
       * lời hứa treo mãi: người dùng bấm Esc, hộp thoại biến mất, mà
       * đoạn mã đang `await` thì đứng đó không bao giờ chạy tiếp.
       */
      onCancel={(e) => {
        e.preventDefault();
        dong(false);
      }}
      onClick={(e) => {
        // Bấm vào chính thẻ dialog nghĩa là bấm trúng lớp phủ, vì phần
        // nội dung nằm trong một thẻ con.
        if (e.target === ref.current) dong(false);
      }}
      className={cn(
        "m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-ink-800 bg-ink-900 p-0 text-ink-200 shadow-[var(--shadow-pop)]",
        "backdrop:bg-navy-950/45 backdrop:backdrop-blur-[2px]",
      )}
    >
      {noiDung && (
        <div className="p-5">
          <div className="flex gap-3.5">
            {noiDung.nguyHiem && (
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <TriangleAlert className="size-5" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-[16.5px] leading-snug font-bold text-ink-100">
                {noiDung.tieuDe}
              </h2>
              {noiDung.moTa && (
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
                  {noiDung.moTa}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dong(false)}
            >
              Thôi
            </Button>
            <Button
              type="button"
              variant={noiDung.nguyHiem ? "danger" : "primary"}
              onClick={() => dong(true)}
              /* Nút đồng ý nhận tiêu điểm đầu tiên là sai ở đây: người
                 dùng gõ Enter theo quán tính sẽ xoá mất thứ họ chưa kịp
                 đọc. Để trình duyệt tự đặt tiêu điểm vào nút "Thôi". */
              autoFocus={false}
            >
              {noiDung.nhanDongY ?? "Xoá"}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );

  return { hoi, hopThoai };
}
