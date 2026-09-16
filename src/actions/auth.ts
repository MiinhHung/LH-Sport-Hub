"use server";

import { redirect } from "next/navigation";

import { allowedEmailDomains, isEmailDomainAllowed } from "@/lib/env";
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

/** Thông điệp của Supabase là tiếng Anh — dịch các trường hợp hay gặp. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (m.includes("email not confirmed")) {
    return "Email chưa được xác minh. Kiểm tra hộp thư của bạn.";
  }
  if (m.includes("user already registered")) {
    return "Email này đã có tài khoản. Hãy đăng nhập.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Bạn thử quá nhiều lần. Đợi một lát rồi thử lại.";
  }
  if (m.includes("password")) {
    return "Mật khẩu chưa đạt yêu cầu (tối thiểu 8 ký tự).";
  }
  return "Không đăng nhập được. Vui lòng thử lại.";
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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

    if (error) return failure(translateAuthError(error.message));

    const next = formData.get("next");
    if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
      target = next;
    }
    return success();
  });

  if (result.status === "success") redirect(target);
  return result;
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

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.fullName } },
    });

    if (error) return failure(translateAuthError(error.message));

    // Nếu Supabase bật xác minh email thì chưa có session ngay.
    if (!data.session) {
      return success(
        "Đã tạo tài khoản. Kiểm tra email để xác minh rồi quay lại đăng nhập.",
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
