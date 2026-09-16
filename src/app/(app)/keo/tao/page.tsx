import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ChallengeForm } from "@/components/forms/challenge-form";
import { PageHeader } from "@/components/ui";
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
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tất cả kèo
      </Link>

      <PageHeader
        title="Tạo kèo"
        description="Chốt thể thức, chốt điểm, chốt ăn gì. Xong là có kèo."
      />

      <ChallengeForm members={others} sessions={sessions} />
    </div>
  );
}
