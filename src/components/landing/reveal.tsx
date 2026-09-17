"use client";

import * as React from "react";

/**
 * Hiện dần khi cuộn tới.
 *
 * AN TOÀN KHI KHÔNG CÓ GÌ CHẠY — đây là điểm quan trọng nhất.
 *
 * Trước đây khối ảnh của team dùng `whileInView` của motion: nội dung bắt
 * đầu ở opacity 0 rồi chờ bộ theo dõi tầm nhìn báo về. Khi bộ theo dõi
 * không kịp chạy thì cả dải nằm vô hình và trang trông như bị trống — lỗi
 * đó chỉ lộ ra khi chụp ảnh toàn trang.
 *
 * Nên ở đây có ba lớp đỡ:
 *
 *  1. HTML dựng ra từ máy chủ đã hiện sẵn. Không có JavaScript thì vẫn đọc
 *     được bình thường.
 *  2. Trình duyệt không hỗ trợ IntersectionObserver thì hiện luôn.
 *  3. Có hẹn giờ 2,5 giây: dù bộ theo dõi im lặng vì bất cứ lý do gì, nội
 *     dung cũng tự hiện ra.
 *
 * Dùng CSS transition chứ không phải thư viện animation: chỉ chạm tới
 * `opacity` và `transform`, hai thứ trình duyệt xử lý trên compositor.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  /** Trễ, tính bằng mili giây — để xếp so le các mục trong một hàng. */
  delay?: number;
  className?: string;
  /** Kiểu của người gọi; kiểu hiệu ứng bên dưới ghi đè lên. */
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") return;

    // Đã nằm trong tầm nhìn ngay lúc mount thì đừng giấu đi rồi hiện lại —
    // như vậy chỉ tạo ra một cái nháy vô nghĩa.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) return;

    setHidden(true);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);

    const safety = setTimeout(() => {
      setHidden(false);
      io.disconnect();
    }, 2500);

    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(22px)" : "none",
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
