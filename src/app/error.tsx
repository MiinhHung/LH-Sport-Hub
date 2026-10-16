"use client";

import * as React from "react";

/**
 * Màn hình lỗi cho những trang NGOÀI khung app: trang giới thiệu, đăng
 * nhập, đăng ký.
 *
 * VIẾT BẰNG STYLE THUẦN, KHÔNG DÙNG LẠI BỘ UI. Hai lý do thật:
 *
 * 1. Nó phải chạy được cả khi chính bộ ui là thứ vừa ném lỗi. Một màn
 *    hình lỗi đi nhập lại đúng mô-đun đang hỏng thì hỏng theo.
 * 2. Nhánh này gồm cả trang giới thiệu nền trắng viết cứng lẫn hai trang
 *    đăng nhập nền navy. Lớp `.dark` thì đi theo lựa chọn của người dùng
 *    trong app. Dùng lớp tiện ích ở đây sẽ ra một màn hình lúc đọc được
 *    lúc không, tuỳ người dùng vừa ở đâu sang.
 *
 * Nền navy đặc là mẫu số chung an toàn: cả hai nhánh đều có navy trong
 * bảng màu, và chữ trắng trên navy thì luôn đọc được.
 */
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  React.useEffect(() => {
    console.error("[trang công khai] lỗi:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1.25rem",
        background: "#00112e",
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "26rem" }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#dcae42",
          }}
        >
          LH Sport Hub
        </p>

        {/*
          MÀU CHỮ PHẢI KHAI TẬN NƠI, KHÔNG ĐƯỢC TRÔNG CHỜ KẾ THỪA.

          globals.css có `h1, h2, h3 { color: var(--color-ink-100) }` —
          một quy tắc đặt THẲNG lên thẻ, nên nó thắng màu trắng kế thừa
          từ thẻ bọc. Mà `--color-ink-100` ở nền sáng chính là navy
          #001a4a, gần như trùng nền #00112e của trang này: đo ra tương
          phản 1,11 trên 1, tức là chữ biến mất.

          Lỗi này đã xảy ra thật và phải chụp màn hình mới thấy. Ghi chú
          ở đầu tệp có cảnh giác đúng chuyện đó với LỚP TIỆN ÍCH, nhưng
          bỏ sót rằng quy tắc cho thẻ gốc cũng làm y hệt. Trang lỗi thì
          càng không được phép hỏng, vì nó là thứ duy nhất còn lại khi
          mọi thứ khác đã hỏng.
        */}
        <h1
          style={{
            marginTop: "1rem",
            fontSize: "26px",
            lineHeight: 1.2,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Trang này đang trục trặc
        </h1>

        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "14.5px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Thử tải lại xem sao. Nếu vẫn vậy thì đợi khoảng một phút rồi vào lại,
          có khi máy chủ vừa ngủ dậy.
        </p>

        <div
          style={{
            marginTop: "1.75rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <button
            type="button"
            onClick={() => retry()}
            style={{
              height: "2.75rem",
              padding: "0 1.5rem",
              borderRadius: "8px",
              border: "none",
              background: "#dcae42",
              color: "#001a4a",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Thử lại
          </button>
          {/*
            Thẻ <a> thuần, KHÔNG dùng next/link — cố ý, xem ghi chú đầu tệp.
            next/link kéo theo router của Next, mà router hoàn toàn có thể
            chính là thứ vừa ném lỗi đưa người dùng tới đây. Màn hình lỗi mà
            phụ thuộc vào thứ đang hỏng thì hỏng theo.

            Đổi lại là mất điều hướng phía client ở đúng một nút, trên đúng
            một màn hình mà ai cũng muốn rời đi càng nhanh càng tốt.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            Về trang chủ
          </a>
        </div>

        {error.digest && (
          <p
            style={{
              marginTop: "2rem",
              fontSize: "11.5px",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Mã lỗi <code>{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
