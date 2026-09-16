import type { Metadata } from "next";

import { SignUpForm } from "@/components/forms/auth-form";
import { allowedEmailDomains } from "@/lib/env";

export const metadata: Metadata = { title: "Đăng ký" };

export default function SignUpPage() {
  const domains = allowedEmailDomains();
  const hint = domains.length ? `@${domains[0]}` : null;

  return <SignUpForm domainHint={hint} />;
}
