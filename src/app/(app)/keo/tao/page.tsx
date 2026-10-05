import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ChallengeForm } from "@/components/forms/challenge-form";
import { PageIntro } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { listMembers, listSelectableSessions } from "@/lib/queries";

export const metadata: Metadata = { title: "Tạo kèo" };

export default async function CreateChallengePage() {
  const profile = await requireProfile();
  const [members, sessions] = await Promise.all([
    listMembers(),
    listSelectableSessions(),
  ]);

  const others = members
    .filter((m) => m.id !== profile.id)
    .map((m) => ({
      id: m.id,
      fullName: m.fullName,
      avatarUrl: m.avatarUrl,
      department: m.department,
    }));

  return (
    /* max-w-5xl chứ không 2xl: biểu mẫu giờ có thêm cột xem trước bên
       phải, 2xl (672px) thì hai cột chen nhau còn 350px mỗi bên. */
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/keo"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tất cả kèo
      </Link>

      <PageIntro
        eyebrow="Thách đấu"
        title="Tạo kèo"
        lead="Chốt thể thức, chốt điểm, chốt ăn gì. Xong là có kèo."
      />

      <ChallengeForm
        members={others}
        sessions={sessions}
        nguoiTao={{
          id: profile.id,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          department: profile.department,
        }}
      />
    </div>
  );
}
