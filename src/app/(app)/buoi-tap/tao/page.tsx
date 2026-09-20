import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SessionForm } from "@/components/forms/session-form";
import { Card, CardBody, PageIntro } from "@/components/ui";

export const metadata: Metadata = { title: "Tạo buổi tập" };

export default function CreateSessionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/buoi-tap"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Lịch tập
      </Link>

      <PageIntro
        eyebrow="Lịch"
        title="Tạo buổi tập"
        lead="Chốt sân, chốt giờ. Mặc định là sáng thứ 7 tuần này, 7h–9h."
      />

      <Card>
        <CardBody className="sm:p-6">
          <SessionForm />
        </CardBody>
      </Card>
    </div>
  );
}
