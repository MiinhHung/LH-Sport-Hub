"use client";

import { RotateCcw, TriangleAlert } from "@/components/icons";
import * as React from "react";

import { Button, LinkButton } from "@/components/ui/button";

/**
 * Màn hình lỗi cho mọi trang trong app.
 *
 * Trước đây toàn repo KHÔNG có `error.tsx` nào. Một truy vấn hỏng là
 * người dùng rơi thẳng vào màn hình lỗi mặc định của Next: nền trắng,
 * chữ tiếng Anh, không có thanh điều hướng, không có đường quay lại. Với
 * một app nội bộ thì đó là lúc người ta nhắn hỏi "web sập rồi à".
 *
 * ĐẶT TRONG NHÓM `(app)`, KHÔNG PHẢI Ở GỐC. Đặt ở đây thì khung app vẫn
 * còn: thanh trên, thanh dưới, nút tài khoản đều nguyên vẹn, nên người
 * dùng đi tiếp được sang chỗ khác thay vì cụt đường. Một `error.tsx` ở
 * gốc sẽ nuốt luôn cả khung đó.
 *
 * KHÔNG IN `error.message` RA MÀN HÌNH. Thông điệp lỗi từ máy chủ hay
 * mang theo chi tiết hệ thống (tên bảng, câu truy vấn, đường dẫn tệp).
 * Next đã che phần lớn ở bản chạy thật, nhưng dựa vào đó là dựa vào may
 * rủi. Chỉ hiện `digest` — đúng cái mã để tra log máy chủ, và tự nó
 * không nói gì cho người ngoài.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  React.useEffect(() => {
    // Ghi ra console trình duyệt để lúc gỡ lỗi còn có chỗ mà nhìn.
    console.error("[app] trang lỗi:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300"
      >
        <TriangleAlert className="size-6" />
      </span>

      <h1 className="font-display mt-5 text-[26px] leading-tight font-bold text-ink-100">
        Trang này đang trục trặc
      </h1>

      <p className="mt-2.5 text-[15px] leading-relaxed text-ink-400">
        Thử tải lại xem sao. Nếu vẫn vậy thì nhắn cho người quản trị, có khi máy
        chủ vừa ngủ dậy và cần thêm một phút.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => retry()}>
          <RotateCcw className="size-4" aria-hidden />
          Thử lại
        </Button>
        <LinkButton href="/bang-tin" variant="ghost">
          Về bảng tin
        </LinkButton>
      </div>

      {error.digest && (
        <p className="mt-8 text-[11.5px] text-ink-500">
          Mã lỗi <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
