import type { Metadata } from "next";

import { signOutAction } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = { title: "Tài khoản bị khoá" };

export default function SuspendedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-4xl">🚫</div>
      <h1 className="text-xl font-bold">Tài khoản đang bị tạm khoá</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        Liên hệ ban quản trị của team để được mở lại.
      </p>
      <form action={signOutAction} className="mt-6">
        <SubmitButton variant="secondary">Đăng xuất</SubmitButton>
      </form>
    </div>
  );
}
