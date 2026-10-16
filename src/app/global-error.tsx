"use client";

import * as React from "react";

/**
 * Bắt lỗi nghiêm trọng ở tầng Root Layout.
 * Bắt buộc phải có thẻ <html> và <body> riêng.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  React.useEffect(() => {
    console.error("[global error]:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "2rem 1.25rem",
          background: "#00112e",
          color: "#ffffff",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#dcae42" }}>
            LH Sport Hub
          </p>
          <h1
            style={{
              marginTop: "0.5rem",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            Đã xảy ra sự cố hệ thống
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            Ứng dụng gặp sự cố không mong muốn ở tầng gốc. Bạn có thể thử tải lại trang.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "rgba(255, 255, 255, 0.4)",
              }}
            >
              Mã lỗi: {error.digest}
            </p>
          )}
          <div style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "#dcae42",
                color: "#00112e",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
