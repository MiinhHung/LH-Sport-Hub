/**
 * Thẻ biểu mẫu của hai trang đăng nhập / đăng ký.
 *
 * Tên cũ còn giữ cho khỏi đổi chỗ import, nhưng giờ là một thẻ đặc, yên:
 * không còn mặt kính mờ, lưới chéo hay vệt sáng chạy viền. Đây là chỗ
 * người ta gõ mật khẩu, nên nó cần trông chắc chắn hơn là trông ấn tượng.
 *
 * Hai trang này có nền navy cố định, không theo chế độ sáng/tối, nên màu
 * viết thẳng bằng navy và trắng chứ không dùng thang `ink-*`.
 */
export function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/15 bg-navy-900 p-6 sm:p-8">
      {children}
    </div>
  );
}
