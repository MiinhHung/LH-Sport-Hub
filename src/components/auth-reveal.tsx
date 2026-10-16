import { cn } from "@/lib/utils";

/**
 * Khung form đăng nhập/đăng ký hiện dần lên.
 *
 * DÙNG CSS, KHÔNG DÙNG motion. Bản trước là `motion.div` với
 * `initial={{ opacity: 0 }}`: HTML từ server ra với opacity 0, nên máy
 * tắt JS (hoặc JS tải chậm/lỗi) nhìn thấy một trang đăng nhập TRỐNG. Lại
 * thêm `useReducedMotion` cho kết quả khác nhau giữa server và trình
 * duyệt, sinh lỗi hydrate. Hoạt ảnh CSS chạy ngay trên HTML tĩnh, và
 * `prefers-reduced-motion` đã được globals.css tắt sẵn.
 */
export function AuthReveal({ children }: { children: React.ReactNode }) {
  return <div className={cn("animate-rise w-full max-w-[400px]")}>{children}</div>;
}
