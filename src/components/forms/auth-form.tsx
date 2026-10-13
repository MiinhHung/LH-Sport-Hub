"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction, signUpAction } from "@/actions/auth";
import { idleState } from "@/actions/types";
import { AuthField, AuthInput, AuthSubmit } from "@/components/auth/dark-field";

/**
 * Biểu mẫu đăng nhập / đăng ký.
 *
 * Phần logic không đổi: vẫn là server action, vẫn `useActionState` để nhận
 * lỗi từng trường và thông điệp chung từ máy chủ. Chỉ có lớp hiển thị
 * dùng bảng màu nền navy cho hợp thẻ bao ngoài.
 */

/**
 * Gợi ý trong ô email — chỉ hiện khi có khai domain công ty.
 *
 * KHÔNG CÓ GỢI Ý MẶC ĐỊNH. Trước đây chỗ này rơi về "ban@congty.com"
 * mỗi khi `ALLOWED_EMAIL_DOMAINS` để trống. Mà app đang để đăng ký tự
 * do, mail nào cũng dùng được — nên một gợi ý mang chữ "congty" lại nói
 * ngược với sự thật, khiến người dùng Gmail tưởng mình không đăng ký
 * được. Để trống thì nhãn "Email" phía trên đã đủ rõ.
 *
 * Khi nào khai domain thì gợi ý tự hiện lại, và lúc đó nó nói đúng.
 *
 * Gom vào một hàm vì cả ô đăng nhập lẫn ô đăng ký đều dùng — trước đây
 * là hai dòng chép tay giống hệt, sửa một chỗ thì quên chỗ kia.
 */
function goiYEmail(domainHint: string | null) {
  return domainHint ? `ten.ban${domainHint}` : undefined;
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[26px] leading-tight font-bold text-white">
        {title}
      </h1>
      {sub && <p className="mt-1.5 text-[14px] text-white/75">{sub}</p>}
    </div>
  );
}

/** Báo lỗi chung từ máy chủ, bản cho nền tối. */
function AuthAlert({ tone, children }: { tone: "loi" | "xong"; children: string }) {
  const mau =
    tone === "loi"
      ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  return (
    <div
      role="status"
      className={`rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed ${mau}`}
    >
      {children}
    </div>
  );
}

/**
 * `useFormStatus` chỉ đọc được trạng thái khi nằm TRONG thẻ `form`, nên nút
 * phải là một component riêng — để ngay trong thân biểu mẫu thì nó đọc ra
 * một biểu mẫu khác ở ngoài, tức là luôn báo rảnh.
 */
function Nut({
  pendingText,
  children,
}: {
  pendingText: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <AuthSubmit pending={pending} pendingText={pendingText}>
      {children}
    </AuthSubmit>
  );
}

function ChanTrang({
  hoi,
  chu,
  href,
}: {
  hoi: string;
  chu: string;
  href: string;
}) {
  return (
    <p className="mt-6! border-t border-white/10 pt-5 text-center text-[13.5px] text-white/75">
      {hoi}{" "}
      <Link
        href={href}
        className="font-semibold text-gold-300 underline-offset-4 transition-colors hover:text-gold-200 hover:underline"
      >
        {chu}
      </Link>
    </p>
  );
}

export function SignInForm({ domainHint }: { domainHint: string | null }) {
  const [state, formAction] = useActionState(signInAction, idleState);
  const params = useSearchParams();
  const next = params.get("next") ?? "";

  return (
    <>
      <Heading title="Đăng nhập" sub="Vào xem ai đang thách kèo bạn." />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <AuthField
          label="Email"
          htmlFor="email"
          required
          error={state.errors?.email}
        >
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={goiYEmail(domainHint)}
          />
        </AuthField>

        <AuthField
          label="Mật khẩu"
          htmlFor="password"
          required
          error={state.errors?.password}
        >
          <AuthInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </AuthField>

        {state.status === "error" && state.message && (
          <AuthAlert tone="loi">{state.message}</AuthAlert>
        )}

        <Nut pendingText="Đang đăng nhập…">Đăng nhập</Nut>

        <ChanTrang hoi="Chưa có tài khoản?" chu="Đăng ký" href="/dang-ky" />
      </form>
    </>
  );
}

export function SignUpForm({ domainHint }: { domainHint: string | null }) {
  const [state, formAction] = useActionState(signUpAction, idleState);

  return (
    <>
      <Heading title="Tạo tài khoản" sub="Chỉ cần họ tên, email và mật khẩu." />

      <form action={formAction} className="space-y-4">
        <AuthField
          label="Họ và tên"
          htmlFor="fullName"
          required
          error={state.errors?.fullName}
        >
          <AuthInput
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            maxLength={80}
            placeholder="Nguyễn Minh Hưng"
          />
        </AuthField>

        <AuthField
          label="Email"
          htmlFor="email"
          required
          error={state.errors?.email}
        >
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={goiYEmail(domainHint)}
          />
        </AuthField>

        <AuthField
          label="Mật khẩu"
          htmlFor="password"
          required
          error={state.errors?.password}
          hint="Tối thiểu 8 ký tự."
        >
          <AuthInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="••••••••"
          />
        </AuthField>

        {state.status === "error" && state.message && (
          <AuthAlert tone="loi">{state.message}</AuthAlert>
        )}
        {state.status === "success" && state.message && (
          <AuthAlert tone="xong">{state.message}</AuthAlert>
        )}

        <Nut pendingText="Đang tạo tài khoản…">Tạo tài khoản</Nut>

        <ChanTrang hoi="Đã có tài khoản?" chu="Đăng nhập" href="/dang-nhap" />
      </form>
    </>
  );
}
