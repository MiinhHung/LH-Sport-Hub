import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Route nhận chuyển hướng từ Supabase Auth sau khi bấm link xác nhận email
 * hoặc đặt lại mật khẩu:
 *   GET /auth/callback?code=...&next=...
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") ?? "/";

  // Chống Open Redirect
  let next = "/";
  if (
    typeof rawNext === "string" &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !/[\\\s]/.test(rawNext)
  ) {
    try {
      const u = new URL(rawNext, requestUrl.origin);
      if (u.origin === requestUrl.origin) {
        next = u.pathname + u.search;
      }
    } catch {
      next = "/";
    }
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Đổi code thất bại hoặc mã hết hạn => chuyển về trang đăng nhập với thông báo lỗi
  return NextResponse.redirect(
    new URL("/dang-nhap?error=auth_callback_failed", requestUrl.origin),
  );
}
