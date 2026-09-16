import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Bỏ qua file tĩnh và ảnh; chạy trên mọi route còn lại
     * để phiên đăng nhập luôn được làm mới.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
