import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/forms/auth-form";
import { allowedEmailDomains } from "@/lib/env";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function SignInPage() {
  const domains = allowedEmailDomains();
  const hint = domains.length ? `@${domains[0]}` : null;

  return (
    <Suspense fallback={<div className="h-72" />}>
      <SignInForm domainHint={hint} />
    </Suspense>
  );
}
