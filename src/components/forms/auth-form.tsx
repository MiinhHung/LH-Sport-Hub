"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { signInAction, signUpAction } from "@/actions/auth";
import { idleState } from "@/actions/types";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-[28px] leading-tight font-bold text-ink-100">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">{sub}</p>
    </div>
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

        <Field
          label="Email công ty"
          htmlFor="email"
          required
          error={state.errors?.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={domainHint ? `ten.ban${domainHint}` : "ban@congty.com"}
          />
        </Field>

        <Field
          label="Mật khẩu"
          htmlFor="password"
          required
          error={state.errors?.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        {state.status === "error" && state.message && (
          <Alert tone="rose">{state.message}</Alert>
        )}

        <SubmitButton
          variant="primary"
          size="lg"
          className="w-full"
          pendingText="Đang đăng nhập…"
        >
          Đăng nhập
        </SubmitButton>

        <p className="pt-1 text-center text-sm text-ink-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/dang-ky"
            className="font-semibold text-navy-800 underline-offset-2 hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </form>
    </>
  );
}

export function SignUpForm({ domainHint }: { domainHint: string | null }) {
  const [state, formAction] = useActionState(signUpAction, idleState);

  return (
    <>
      <Heading
        title="Tạo tài khoản"
        sub={
          domainHint
            ? `Dùng email ${domainHint} của công ty.`
            : "Dùng email công ty của bạn."
        }
      />

      <form action={formAction} className="space-y-4">
        <Field
          label="Họ và tên"
          htmlFor="fullName"
          required
          error={state.errors?.fullName}
        >
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            maxLength={80}
            placeholder="Nguyễn Minh Hưng"
          />
        </Field>

        <Field
          label="Email công ty"
          htmlFor="email"
          required
          error={state.errors?.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={domainHint ? `ten.ban${domainHint}` : "ban@congty.com"}
          />
        </Field>

        <Field
          label="Mật khẩu"
          htmlFor="password"
          required
          error={state.errors?.password}
          hint="Tối thiểu 8 ký tự."
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>

        {state.status === "error" && state.message && (
          <Alert tone="rose">{state.message}</Alert>
        )}
        {state.status === "success" && state.message && (
          <Alert tone="emerald">{state.message}</Alert>
        )}

        <SubmitButton
          variant="primary"
          size="lg"
          className="w-full"
          pendingText="Đang tạo tài khoản…"
        >
          Tạo tài khoản
        </SubmitButton>

        <p className="pt-1 text-center text-sm text-ink-500">
          Đã có tài khoản?{" "}
          <Link
            href="/dang-nhap"
            className="font-semibold text-navy-800 underline-offset-2 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </>
  );
}
