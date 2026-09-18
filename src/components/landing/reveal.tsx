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
 * HAI LỚP ĐỠ, KHÔNG PHẢI BA — và chỗ này từng sai.
 * 
 * Bản đầu có thêm một hẹn giờ 2,5 giây tự hiện nội dung, đề phòng bộ theo
 * dõi tầm nhìn im lặng. Nhưng nó chạy VÔ ĐIỀU KIỆN: ai cuộn xuống chậm hơn
 * 2,5 giây — tức gần như mọi người — thì hiệu ứng đã chạy hết từ lúc họ còn
 * đang đọc phần trên, và không bao giờ thấy nó. Cái lưới an toàn vô hiệu hoá
 * đúng thứ nó đang bảo vệ.
 * 
 * Hai lớp còn lại đã đủ cho những kiểu hỏng có thật: HTML dựng từ máy chủ đã
 * hiện sẵn nên không có JavaScript vẫn đọc được, và trình duyệt không hỗ trợ
 * IntersectionObserver thì hiện luôn. Còn nếu bộ theo dõi có chạy mà phần tử
 * không bao giờ vào tầm nhìn thì nó bị ẩn cũng chẳng ai thấy.
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

    return () => {
      io.disconnect();
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
