import { SportIcon, StakeIcon } from "@/components/domain-icons";
import Link from "next/link";

import { VersusRow, type VersusTeam } from "@/components/VersusRow";
import { Badge, Card, MetaLine, type Tone } from "@/components/ui";
import {
  CHALLENGE_STATUS_META,
  teamCounts,
  type ParticipantLike,
} from "@/lib/challenge-logic";
import {
  CHALLENGE_FORMATS,
  formatStake,
  type ChallengeFormatKey,
  type SportKey,
  type StakeKey,
} from "@/lib/constants";
import type { ChallengeDetail } from "@/lib/queries";
import { cn, formatDateTime, timeAgo, timeUntil } from "@/lib/utils";

/**
 * Màu trạng thái kèo, dùng chung cho thẻ kèo và trang chi tiết.
 *
 * Đúng bốn nghĩa màu của DESIGN.md: vàng = đang mở / chờ ai đó làm gì,
 * lục = đã chốt, đỏ = tranh chấp, xám = đã xong hoặc đã đóng.
 */
const STATUS_TONE: Record<keyof typeof CHALLENGE_STATUS_META, Tone> = {
  open: "lime",
  locked: "emerald",
  pending_confirm: "amber",
  disputed: "rose",
  completed: "slate",
  declined: "slate",
  cancelled: "slate",
};

export function trangThaiKeo(status: keyof typeof CHALLENGE_STATUS_META) {
  return { label: CHALLENGE_STATUS_META[status].label, tone: STATUS_TONE[status] };
}

export function ChallengeCard({
  challenge,
  currentUserId,
  href,
}: {
  challenge: ChallengeDetail;
  currentUserId: string;
  href?: string;
}) {
  const format = challenge.format as ChallengeFormatKey;
  const stakeKey = challenge.stakeType as StakeKey;
  const status = trangThaiKeo(challenge.status);

  const participants = challenge.participants as unknown as ParticipantLike[];
  const counts = teamCounts(format, participants);

  const held = (team: "A" | "B") =>
    challenge.participants
      .filter(
        (p) =>
          p.team === team && (p.status === "accepted" || p.status === "invited"),
      )
      .map((p) => ({
        id: p.userId,
        fullName: p.user.fullName,
        avatarUrl: p.user.avatarUrl,
        status: p.status as "accepted" | "invited",
      }));

  const myTeam = challenge.participants.find(
    (p) =>
      p.userId === currentUserId &&
      (p.status === "accepted" || p.status === "invited"),
  )?.team;

  const winner =
    challenge.result?.status === "confirmed"
      ? (challenge.result.winningTeam as "A" | "B")
      : null;

  const openSlots = counts.A.free + counts.B.free;
  const isClosed =
    challenge.status === "cancelled" || challenge.status === "declined";

  const scoreA = winner ? (challenge.result?.scoreA ?? null) : null;
  const scoreB = winner ? (challenge.result?.scoreB ?? null) : null;

  const teamA: VersusTeam = {
    members: held("A"),
    capacity: counts.A.capacity,
    isMine: myTeam === "A",
    isWinner: winner === "A",
    score: scoreA,
    emptyLabel: "Chưa có ai",
  };
  const teamB: VersusTeam = {
    members: held("B"),
    capacity: counts.B.capacity,
    isMine: myTeam === "B",
    isWinner: winner === "B",
    score: scoreB,
    emptyLabel: "Chưa có ai",
  };

  const body = (
    <>
      {/* Dòng nhận dạng: một badge trạng thái, giờ đăng ở mép phải */}
      <div className="flex items-center justify-between gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="shrink-0 text-[12.5px] text-ink-500">
          {timeAgo(challenge.createdAt)}
        </span>
      </div>

      <h3 className="mt-2.5 text-[17px] leading-snug font-bold text-ink-100 transition-colors group-hover:text-link">
        {challenge.title}
      </h3>
      {challenge.description && (
        <p className="mt-1 line-clamp-1 text-[13.5px] leading-relaxed text-ink-500">
          {challenge.description}
        </p>
      )}

      {/* Đối đầu: tên hai bên và tỉ số là thứ nổi nhất thẻ */}
      <VersusRow teamA={teamA} teamB={teamB} className="mt-3.5" />

      {/* Thông tin phụ gói trong một dòng */}
      <MetaLine
        className="mt-3"
        items={[
          <span key="mon" className="flex items-center gap-1.5">
            <SportIcon sport={challenge.sport as SportKey} className="size-3.5" />
            {CHALLENGE_FORMATS[format].label}
            {challenge.pointsTarget ? `, ${challenge.pointsTarget} điểm` : ""}
            {challenge.kind === "direct" ? ", thách đích danh" : ""}
          </span>,
          <span
            key="cuoc"
            className="flex items-center gap-1.5 font-semibold text-ink-200"
          >
            <StakeIcon
              stake={stakeKey}
              className="size-3.5 text-gold-700 dark:text-gold-300"
            />
            {formatStake(stakeKey, challenge.stakeQty, challenge.stakeNote)}
          </span>,
          challenge.status === "open" && openSlots > 0 ? (
            <span
              key="cho"
              className="font-semibold text-gold-700 dark:text-gold-300"
            >
              Còn {openSlots} chỗ
            </span>
          ) : null,
          challenge.session ? (
            <span key="buoi" className="min-w-0 truncate">
              {challenge.session.title}
            </span>
          ) : null,
          challenge.playDeadline ? (
            <span key="han">
              Hạn {formatDateTime(challenge.playDeadline)},{" "}
              <span className="font-semibold text-gold-700 dark:text-gold-300">
                {timeUntil(challenge.playDeadline)}
              </span>
            </span>
          ) : null,
          !challenge.session && !challenge.playDeadline ? (
            <span key="luc">Đánh lúc nào cũng được</span>
          ) : null,
        ]}
      />
    </>
  );

  const shell = cn("group block p-4 sm:p-5", isClosed && "opacity-60");

  if (!href) {
    return <Card className={shell}>{body}</Card>;
  }

  return (
    <Card interactive className="overflow-hidden">
      <Link href={href} className={shell}>
        {body}
      </Link>
    </Card>
  );
}
