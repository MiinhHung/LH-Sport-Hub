"use client";

import { Check, Share2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

/**
 * Nút chia sẻ buổi tập.
 *
 * VÌ SAO CẦN, KHI MỖI BUỔI ĐÃ CÓ ĐƯỜNG DẪN RIÊNG. Đúng là `/buoi-tap/<id>`
 * đã tồn tại, nhưng muốn gửi cho anh em thì phải tự chép từ thanh địa
 * chỉ — trên điện thoại là thao tác lằng nhằng, mà điện thoại mới là nơi
 * người ta rủ nhau đi đánh.
 *
 * HAI ĐƯỜNG, TUỲ THIẾT BỊ:
 *
 *  · Điện thoại có `navigator.share` thì gọi bảng chia sẻ của hệ điều
 *    hành — Zalo, Messenger, tin nhắn hiện ngay ở đó. Đây là đường
 *    chính, vì đúng thói quen rủ nhau của team.
 *  · Máy tính (và máy nào không hỗ trợ) thì chép link vào bộ nhớ tạm,
 *    kèm một nhịp báo "Đã chép" để người bấm biết là đã xong — không có
 *    phản hồi thì họ bấm lại mấy lần mà không chắc được gì.
 *
 * NGƯỜI CHƯA ĐĂNG NHẬP BẤM LINK VẪN TỚI ĐÚNG BUỔI. Đã kiểm: app đá sang
 * trang đăng nhập kèm `?next=`, đăng nhập xong quay lại đúng trang vừa
 * bấm. Nên không cần làm gì thêm cho luồng đó.
 */
export function NutChiaSe({
  tieuDe,
  moTa,
}: {
  tieuDe: string;
  /** Dòng phụ gửi kèm, ví dụ giờ và sân. */
  moTa?: string;
}) {
  const [daChep, setDaChep] = React.useState(false);

  /*
    Lấy địa chỉ từ `window`, KHÔNG dựng từ biến môi trường.

    `NEXT_PUBLIC_SITE_URL` hiện vẫn rơi về localhost:3000 (chưa đặt sau
    khi deploy), nên dựng link từ nó là gửi cho cả team một đường dẫn
    trỏ về máy người gửi. `window.location.href` luôn là địa chỉ thật
    mà người dùng đang mở.
  */
  const chiaSe = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: tieuDe, text: moTa, url });
        return;
      } catch {
        // Người dùng bấm huỷ bảng chia sẻ — không phải lỗi, cũng không
        // nên âm thầm chép link thay thế. Dừng ở đây.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setDaChep(true);
      setTimeout(() => setDaChep(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard (thường do trang không chạy HTTPS).
      // Bôi đen sẵn địa chỉ để người dùng tự Ctrl+C còn hơn là im lặng.
      window.prompt("Chép đường dẫn này:", url);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={chiaSe}
      aria-label={`Chia sẻ buổi tập ${tieuDe}`}
    >
      {daChep ? (
        <>
          <Check className="size-4" strokeWidth={2.5} />
          Đã chép link
        </>
      ) : (
        <>
          {/*
            MỘT BIỂU TƯỢNG CHO CẢ HAI ĐƯỜNG. Có nghĩ tới chuyện đổi hình
            theo việc nút sắp làm (bảng chia sẻ hay chép link), nhưng
            `navigator.share` chỉ biết được ở trình duyệt — muốn vậy phải
            đặt state trong effect, thêm một vòng render và lint cũng kêu.
            Mà nhãn đã nói rõ kết quả rồi: bấm xong nó đổi thành "Đã chép
            link" nếu là đường chép.
          */}
          <Share2 className="size-4" />
          Chia sẻ
        </>
      )}
    </Button>
  );
}
