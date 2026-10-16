import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Route nhận chuyển hướng từ Supabase Auth sau khi bấm link xác nhận email
 * hoặc đặt lại mật khẩu. Nhận hai kiểu link:
 *
 *   GET /auth/callback?token_hash=...&type=email&next=...   (khuyên dùng)
 *   GET /auth/callback?code=...&next=...                    (kiểu mặc định)
 *
 * `token_hash` dùng được TRÊN MỌI THIẾT BỊ: đăng ký trên máy tính, bấm
 * link trong Gmail ở điện thoại vẫn vào thẳng. `code` (PKCE) cần một mã
 * lưu trong trình duyệt lúc đăng ký, nên mở ở trình duyệt khác là hỏng —
 * dù email đã được xác nhận xong ở phía Supabase. Muốn dùng kiểu
 * `token_hash` thì sửa mẫu email "Confirm signup" trên Supabase (xem
 * DEPLOY.md).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const sp = requestUrl.searchParams;
  const code = sp.get("code");
  const tokenHash = sp.get("token_hash");
  const type = sp.get("type") as EmailOtpType | null;
  const rawNext = sp.get("next") ?? "/";

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

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
    console.error("[auth/callback] verifyOtp thất bại:", error.message);
    return NextResponse.redirect(
      new URL("/dang-nhap?error=link_het_han", requestUrl.origin),
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
    /*
     * Tới được đây với `code` nghĩa là Supabase ĐÃ xác nhận email rồi mới
     * chuyển về; hỏng chỉ ở bước tự đăng nhập (thường do mở link ở trình
     * duyệt khác). Báo đúng như vậy: đăng nhập bằng mật khẩu là vào được.
     */
    console.error("[auth/callback] đổi code thất bại:", error.message);
    return NextResponse.redirect(
      new URL("/dang-nhap?error=da_xac_nhan", requestUrl.origin),
    );
  }

  // Supabase gửi kèm lỗi (link hết hạn, đã dùng rồi…), hoặc thiếu mã.
  return NextResponse.redirect(
    new URL("/dang-nhap?error=link_het_han", requestUrl.origin),
  );
}
