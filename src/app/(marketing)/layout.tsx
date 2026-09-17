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
  return <div className="min-h-dvh bg-white">{children}</div>;
}
