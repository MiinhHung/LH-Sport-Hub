import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ChallengeForm } from "@/components/forms/challenge-form";
import { PageIntro } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { listMembers, listSelectableSessions } from "@/lib/queries";

export const metadata: Metadata = { title: "Tạo kèo" };

export default async function CreateChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ doi?: string }>;
}) {
  const profile = await requireProfile();
  const { doi } = await searchParams;
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

  /*
    `?doi=<id>` đến từ nút "Thách luôn" ở trang cá nhân. Không tin
    thẳng con số trên thanh địa chỉ: chỉ nhận khi nó đúng là một thành
    viên đang hoạt động và không phải chính mình. Sai thì lặng lẽ bỏ
    qua, biểu mẫu mở ra như bình thường — người ta vào đây để tạo kèo
    chứ không phải để đọc thông báo lỗi về một tham số họ chưa từng gõ.
  */
  const doiThuSan = doi && others.some((m) => m.id === doi) ? doi : null;

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
        doiThuSan={doiThuSan}
      />
    </div>
  );
}
