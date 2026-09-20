import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ChallengeForm } from "@/components/forms/challenge-form";
import { PageIntro } from "@/components/ui";
import { BeamFrame } from "@/components/ui/beam-frame";
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
    <div className="mx-auto max-w-2xl space-y-5">
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

      {/* Biểu mẫu này là năm thẻ xếp chồng chứ không phải một khối, nên
          vệt sáng chạy quanh cả cụm. Không nghiêng — xem ghi chú trong
          BeamFrame. */}
      <BeamFrame tilt={false} spread={3}>
        <ChallengeForm members={others} sessions={sessions} />
      </BeamFrame>
    </div>
  );
}
