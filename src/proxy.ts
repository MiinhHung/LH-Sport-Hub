import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Bỏ qua file tĩnh; chạy trên mọi route còn lại để phiên đăng nhập
     * luôn được làm mới.
     *
     * PHẢI KỂ CẢ VIDEO, KHÔNG CHỈ ẢNH. Danh sách cũ chỉ liệt kê mấy đuôi
     * ảnh, nên mọi yêu cầu .mp4 đều chui qua lớp kiểm tra đăng nhập. Mà
     * trang giới thiệu là trang công khai: khách chưa đăng nhập mở lên,
     * trình duyệt xin đoạn phim và nhận về một cú chuyển hướng 307 sang
     * trang đăng nhập thay vì dữ liệu video — nên video đứng im ở khung
     * ảnh bìa. Đã đo: /videos/video.mp4 trả 307, còn ảnh bìa .webp trả
     * 200, đúng vì .webp có trong danh sách còn .mp4 thì không.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|mov)$).*)",
  ],
};
