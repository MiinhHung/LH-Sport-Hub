import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SessionForm } from "@/components/forms/session-form";
import { Card, CardBody, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Tạo buổi tập" };

export default function CreateSessionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/buoi-tap"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Lịch tập
      </Link>

      <PageHeader
        title="Tạo buổi tập"
        description="Chốt sân, chốt giờ. Mặc định là thứ 7 tuần này 19h–21h."
      />

      <Card>
        <CardBody className="sm:p-6">
          <SessionForm />
        </CardBody>
      </Card>
    </div>
  );
}
