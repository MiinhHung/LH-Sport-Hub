import { ChuyenTrang } from "@/components/chuyen-trang";

/**
 * Khung riêng cho trang giới thiệu công khai.
 *
 * Cố ý KHÔNG dùng khung của app: không thanh điều hướng, không thanh dưới,
 * không gọi `requireProfile`. Người chưa đăng nhập phải xem được trang này,
 * mà khung app thì luôn cần hồ sơ người dùng.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `theme-sang` ghim bảng màu về bản nền sáng cho cả nhánh này — trang
    // giới thiệu có nền trắng viết cứng, mà lớp `.dark` thì đi theo người
    // dùng từ trong app sang. Xem ghi chú trong globals.css.
    <div className="theme-sang min-h-dvh bg-white">
      <ChuyenTrang>{children}</ChuyenTrang>
    </div>
  );
}
