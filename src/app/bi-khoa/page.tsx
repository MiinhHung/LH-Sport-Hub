import type { Metadata } from "next";

import { signOutAction } from "@/actions/auth";
import { Lock } from "@/components/icons";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = { title: "Tài khoản bị khoá" };

export default function SuspendedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-5 text-center">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-xl bg-navy-900 text-gold-300"
      >
        <Lock className="size-6" />
      </span>
      <h1 className="font-display mt-6 text-[26px] leading-tight font-bold text-ink-100 sm:text-[30px]">
        Tài khoản đang bị tạm khoá
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-500">
        Liên hệ ban quản trị của team để được mở lại.
      </p>
      <form action={signOutAction} className="mt-7">
        <SubmitButton pendingText="Đang đăng xuất…">Đăng xuất</SubmitButton>
      </form>
    </main>
  );
}
