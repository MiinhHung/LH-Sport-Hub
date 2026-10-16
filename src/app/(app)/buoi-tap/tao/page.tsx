import { ArrowLeft } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";

import { SessionForm } from "@/components/forms/session-form";
import { PageIntro } from "@/components/ui";

export const metadata: Metadata = { title: "Tạo buổi tập" };

export default function CreateSessionPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/buoi-tap"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Lịch tập
      </Link>

      <PageIntro
        title="Tạo buổi tập"
        lead="Chốt sân, chốt giờ. Mặc định là sáng thứ 7 tuần này, từ 7h đến 9h."
      />

      {/* Không bọc trong Card: mỗi bước của biểu mẫu đã là một thẻ riêng
          (xem `Khoi`), bọc thêm thì thành hộp trong hộp. */}
      <SessionForm />
    </div>
  );
}
