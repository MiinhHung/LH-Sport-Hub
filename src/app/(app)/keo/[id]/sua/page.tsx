import { ArrowLeft } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  ChallengeForm,
  type KeoDangSua,
} from "@/components/forms/challenge-form";
import { PageIntro } from "@/components/ui";
import { isModerator, requireProfile } from "@/lib/auth";
import {
  getChallengeDetail,
  listMembers,
  listSelectableSessions,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Sửa kèo" };

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await requireProfile();
  const challenge = await getChallengeDetail(id);
  if (!challenge) notFound();

  // Chặn ở đây CHỨ KHÔNG CHỈ ẩn nút "Sửa" ở trang kèo — và action cũng
  // kiểm lại lần nữa. Ba chỗ nghe thừa, nhưng ẩn nút chỉ giấu đường đi,
  // còn gõ thẳng /keo/<id>/sua thì vẫn vào được.
  const laChu = challenge.creatorId === profile.id || isModerator(profile);
  if (!laChu) redirect(`/keo/${id}`);

  // Cùng luật với `updateChallengeAction`.
  if (
    challenge.result ||
    challenge.status === "cancelled" ||
    challenge.status === "declined"
  ) {
    redirect(`/keo/${id}`);
  }

  const [members, sessions] = await Promise.all([
    listMembers(),
    listSelectableSessions(),
  ]);

  /*
    Buổi tập đang gắn phải luôn có trong danh sách, kể cả khi nó đã qua
    giờ — `listSelectableSessions` chỉ trả về buổi còn mở và chưa kết
    thúc. Thiếu vế này thì ô chọn không khớp giá trị nào, trình duyệt
    hiện "Đánh lúc nào cũng được", và chỉ cần bấm Lưu là kèo bị gỡ
    khỏi buổi tập mà người sửa không hề biết.
  */
  const daCo = sessions.some((s) => s.id === challenge.sessionId);
  const danhSachBuoi =
    challenge.session && !daCo
      ? [
          {
            id: challenge.session.id,
            title: challenge.session.title,
            startsAt: challenge.session.startsAt,
            venueName: challenge.session.venueName,
          },
          ...sessions,
        ]
      : sessions;

  const ben = (team: "A" | "B") =>
    challenge.participants
      .filter(
        (p) =>
          p.team === team && (p.status === "accepted" || p.status === "invited"),
      )
      .map((p) => ({
        id: p.user.id,
        fullName: p.user.fullName,
        avatarUrl: p.user.avatarUrl,
        department: p.user.department,
      }));

  const keo: KeoDangSua = {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    sport: challenge.sport,
    format: challenge.format,
    kind: challenge.kind as "open" | "direct",
    pointsTarget: challenge.pointsTarget,
    stakeType: challenge.stakeType,
    stakeQty: challenge.stakeQty,
    stakeNote: challenge.stakeNote,
    sessionId: challenge.sessionId,
    playDeadline: challenge.playDeadline,
    doiA: ben("A"),
    doiB: ben("B"),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/keo/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại kèo
      </Link>

      <PageIntro
        title="Sửa kèo"
        lead="Đổi tên, đổi điểm, đổi phần thưởng. Người trong kèo sẽ được báo nếu điều khoản thay đổi."
      />

      <ChallengeForm
        members={members.filter((m) => m.id !== profile.id)}
        sessions={danhSachBuoi}
        nguoiTao={{
          id: profile.id,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          department: profile.department,
        }}
        keo={keo}
      />
    </div>
  );
}
