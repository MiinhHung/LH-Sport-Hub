"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  allowedEmailDomains,
  isEmailDomainAllowed,
  publicEnv,
} from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrors,
  formDataToObject,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";
import { failure, runAction, success, type ActionState } from "./types";

function domainHint(): string {
  const domains = allowedEmailDomains();
  if (domains.length === 0) return "";
  return ` Chỉ email ${domains.map((d) => `@${d}`).join(" hoặc ")} mới đăng ký được.`;
}

/**
 * Dịch lỗi của Supabase sang tiếng Việt.
 *
 * NHẬN CẢ ĐỐI TƯỢNG LỖI, KHÔNG CHỈ CHUỖI. Bản trước chỉ nhận `message`
 * rồi dò chữ trong đó. Nhưng Supabase có sẵn `code` và `status` — dò
 * chữ thì vừa mong manh (họ đổi câu chữ là hỏng) vừa bỏ mất thông tin
 * phân biệt được các trường hợp có cùng câu chữ.
 *
 * LUÔN GHI LẠI LỖI GỐC RA LOG MÁY CHỦ. Đây là bài học từ một lần gỡ lỗi
 * thật: người dùng báo "không đăng nhập được", màn hình chỉ hiện đúng
 * câu dự phòng "Vui lòng thử lại", và không còn manh mối nào khác —
 * phải dựng lại cả luồng mới lần ra. Câu dự phòng là nơi duy nhất ta
 * KHÔNG biết chuyện gì đã xảy ra, nên đúng ra nó phải là nơi ghi log kỹ
 * nhất. Log nằm ở máy chủ nên không lộ gì cho người ngoài.
 */
function translateAuthError(error: { message: string; code?: string; status?: number }): string {
  const m = error.message.toLowerCase();
  const code = error.code ?? "";

  if (code === "invalid_credentials" || m.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (code === "email_not_confirmed" || m.includes("email not confirmed")) {
    return "Email chưa được xác minh. Kiểm tra hộp thư của bạn.";
  }
  if (code === "user_already_exists" || m.includes("user already registered")) {
    return "Email này đã có tài khoản. Hãy đăng nhập.";
  }
  if (code === "over_request_rate_limit" || m.includes("rate limit") || m.includes("too many")) {
    return "Bạn thử quá nhiều lần. Đợi một lát rồi thử lại.";
  }

  /*
   * Máy chủ chưa dậy, hoặc mạng đứt.
   *
   * Gói Supabase miễn phí TẠM DỪNG dự án sau 7 ngày không ai truy cập.
   * Lần vào đầu tiên sau đó phải đợi nó khởi động, mất vài chục giây, và
   * trong lúc chờ thì mọi yêu cầu đều hỏng. Với một đội đánh cầu hàng
   * tuần thì nghỉ hơn một tuần là chuyện thường — nên đây sẽ là lỗi hay
   * gặp nhất, mà trước đây nó rơi vào đúng câu dự phòng vô nghĩa.
   *
   * `fetch failed` là câu của Node, `Failed to fetch` là của trình
   * duyệt; bắt cả hai vì server action có thể chạy ở cả hai nơi.
   */
  if (
    m.includes("fetch failed") ||
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("timeout") ||
    m.includes("econnrefused") ||
    m.includes("enotfound") ||
    error.status === 0 ||
    error.status === 502 ||
    error.status === 503 ||
    error.status === 504
  ) {
    return "Máy chủ chưa phản hồi, có thể nó vừa ngủ dậy. Đợi khoảng một phút rồi thử lại.";
  }

  if (m.includes("password")) {
    return "Mật khẩu chưa đạt yêu cầu (tối thiểu 8 ký tự).";
  }

  console.error("[auth] lỗi chưa có bản dịch:", {
    code: error.code,
    status: error.status,
    message: error.message,
  });
  return "Không đăng nhập được. Vui lòng thử lại.";
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Đăng nhập xong thì về trang chủ, không nhảy thẳng vào bảng tin — trừ
  // khi họ bấm một đường dẫn sâu rồi mới bị hỏi đăng nhập, lúc đó đưa họ
  // về đúng chỗ đang định tới mới phải.
  let target = "/";

  const result = await runAction(async () => {
    const parsed = signInSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Dữ liệu chưa hợp lệ.", fieldErrors(parsed.error));
    }

    if (!isEmailDomainAllowed(parsed.data.email)) {
      return failure(`Email không thuộc công ty.${domainHint()}`);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) return failure(translateAuthError(error));

    target = safeNext(formData.get("next"));
    return success();
  });

  if (result.status === "success") redirect(target);
  return result;
}

/** Đảm bảo URL chuyển hướng là đường dẫn nội bộ an toàn, chống Open Redirect. */
function safeNext(next: unknown): string {
  if (typeof next !== "string" || !next) return "/";
  if (/[\\\s\u0000-\u001f]/.test(next)) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  try {
    const u = new URL(next, "http://localhost");
    if (u.origin !== "http://localhost") return "/";
    return u.pathname + u.search + u.hash;
  } catch {
    return "/";
  }
}

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let shouldRedirect = false;

  const result = await runAction(async () => {
    const parsed = signUpSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Dữ liệu chưa hợp lệ.", fieldErrors(parsed.error));
    }

    if (!isEmailDomainAllowed(parsed.data.email)) {
      return failure(`Email không thuộc công ty.${domainHint()}`);
    }

    // Link xác nhận trong email dẫn về /auth/callback để đăng nhập luôn.
    // Origin lấy từ request để đúng cả bản preview lẫn bản thật; Supabase
    // chỉ chuyển hướng tới URL nằm trong danh sách Redirect URLs.
    const origin = (await headers()).get("origin") ?? publicEnv.siteUrl;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${origin}/auth/callback?next=/bang-tin`,
      },
    });

    if (error) return failure(translateAuthError(error));

    // Nếu Supabase bật xác minh email thì chưa có session ngay.
    if (!data.session) {
      return success(
        "Đã tạo tài khoản. Mở email và bấm link xác nhận là vào được ngay.",
      );
    }

    shouldRedirect = true;
    return success();
  });

  if (shouldRedirect) redirect("/");
  return result;
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/dang-nhap");
}
