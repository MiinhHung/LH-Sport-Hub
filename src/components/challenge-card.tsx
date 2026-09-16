import { CalendarClock, Clock, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

import { Avatar, Badge, Card, Dot } from "@/components/ui";
import {
  CHALLENGE_STATUS_META,
  teamCounts,
  type ParticipantLike,
} from "@/lib/challenge-logic";
import {
  CHALLENGE_FORMATS,
  SPORTS,
  STAKES,
  formatStake,
  type ChallengeFormatKey,
  type SportKey,
  type StakeKey,
} from "@/lib/constants";
import type { ChallengeDetail } from "@/lib/queries";
import { cn, formatDateTime, timeAgo, timeUntil } from "@/lib/utils";

function firstName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] || full;
}

/** Một phía của trận: avatar người đã có + ô trống cho chỗ chưa ai nhận. */
function TeamSide({
  members,
  capacity,
  isMine,
  isWinner,
  align,
}: {
  members: ChallengeDetail["participants"];
  capacity: number;
  isMine: boolean;
  isWinner: boolean;
  align: "left" | "right";
}) {
  const empty = Math.max(0, capacity - members.length);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1.5",
        align === "right" && "items-end",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          align === "right" && "flex-row-reverse",
        )}
      >
        {members.map((p) => (
          <Avatar
            key={p.userId}
            name={p.user.fullName}
            src={p.user.avatarUrl}
            seed={p.userId}
            size="sm"
            className={cn(
              p.status === "invited" && "opacity-45 grayscale",
              isWinner && "ring-2 ring-gold-400",
            )}
          />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <span
            key={i}
            aria-label="Còn trống"
            className="grid size-8 place-items-center rounded-[9px] border border-dashed border-ink-700 text-ink-600"
          >
            +
          </span>
        ))}
      </div>

      <p
        className={cn(
          "w-full truncate text-[11.5px] leading-tight",
          align === "right" && "text-right",
          isMine ? "font-bold text-navy-900" : "font-medium text-ink-500",
        )}
      >
        {members.length === 0
          ? "Chưa có ai"
          : members
              .map(
                (p) =>
                  firstName(p.user.fullName) +
                  (p.status === "invited" ? " (chờ)" : ""),
              )
              .join(", ")}
      </p>
    </div>
  );
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
  const sport = SPORTS[challenge.sport as SportKey];
  const stakeKey = challenge.stakeType as StakeKey;
  const stake = STAKES[stakeKey];
  const statusMeta = CHALLENGE_STATUS_META[challenge.status];

  const participants = challenge.participants as unknown as ParticipantLike[];
  const counts = teamCounts(format, participants);

  const held = (team: "A" | "B") =>
    challenge.participants.filter(
      (p) => p.team === team && (p.status === "accepted" || p.status === "invited"),
    );

  const teamA = held("A");
  const teamB = held("B");

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

  const body = (
    <>
      {/* Hàng trạng thái */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={statusMeta.tone}>
          <Dot tone={statusMeta.tone} />
          {statusMeta.label}
        </Badge>
        <Badge tone="slate">
          {sport.icon} {CHALLENGE_FORMATS[format].label}
        </Badge>
        {challenge.pointsTarget && (
          <Badge tone="slate" className="tabular">
            {challenge.pointsTarget} điểm
          </Badge>
        )}
        {challenge.kind === "direct" && <Badge tone="violet">Thách đấu</Badge>}
        {myTeam && <Badge tone="navy">Có bạn</Badge>}
        <span className="ml-auto shrink-0 text-[11px] text-ink-500">
          {timeAgo(challenge.createdAt)}
        </span>
      </div>

      {/* Tiêu đề */}
      <h3 className="mt-2.5 text-[17px] leading-snug font-bold text-ink-100 transition-colors group-hover:text-navy-700">
        {challenge.title}
      </h3>
      {challenge.description && (
        <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-500">
          {challenge.description}
        </p>
      )}

      {/* Phần thưởng — thứ quan trọng nhất của một cái kèo */}
      <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-50 px-3.5 py-2.5">
        <span className="text-xl leading-none" aria-hidden>
          {stake.icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold tracking-[0.08em] text-gold-600 uppercase">
            Đội thua bao đội thắng
          </p>
          <p className="truncate text-[14.5px] font-bold text-gold-700">
            {formatStake(stakeKey, challenge.stakeQty, challenge.stakeNote)}
          </p>
        </div>
      </div>

      {/* Đối đầu */}
      <div className="mt-3.5 flex items-center gap-3 rounded-xl bg-ink-850 px-3.5 py-3">
        <TeamSide
          members={teamA}
          capacity={counts.A.capacity}
          isMine={myTeam === "A"}
          isWinner={winner === "A"}
          align="left"
        />

        <div className="flex shrink-0 flex-col items-center gap-0.5">
          {challenge.result?.status === "confirmed" &&
          challenge.result.scoreA !== null &&
          challenge.result.scoreB !== null ? (
            <span className="tabular text-[15px] leading-none font-extrabold text-navy-900">
              {challenge.result.scoreA}–{challenge.result.scoreB}
            </span>
          ) : (
            <span className="text-[10px] leading-none font-extrabold tracking-[0.1em] text-ink-600">
              VS
            </span>
          )}
          {winner && (
            <Trophy className="size-3.5 text-gold-500" aria-label="Có đội thắng" />
          )}
        </div>

        <TeamSide
          members={teamB}
          capacity={counts.B.capacity}
          isMine={myTeam === "B"}
          isWinner={winner === "B"}
          align="right"
        />
      </div>

      {/* Chân thẻ */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] text-ink-500">
        {challenge.session ? (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{challenge.session.title}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            Đánh lúc nào cũng được
          </span>
        )}
        {challenge.playDeadline && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            Hạn {formatDateTime(challenge.playDeadline)} ·{" "}
            {timeUntil(challenge.playDeadline)}
          </span>
        )}
        {challenge.status === "open" && openSlots > 0 && (
          <span className="ml-auto font-bold text-gold-700">
            Còn {openSlots} chỗ
          </span>
        )}
      </div>
    </>
  );

  const shell = cn(
    "group relative block overflow-hidden p-4 sm:p-[18px]",
    isClosed && "opacity-60",
  );

  // Dải màu mảnh bên trái để quét mắt nhanh theo trạng thái.
  const accent = (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-0 w-[3px]",
        challenge.status === "open" && "bg-gold-400",
        challenge.status === "locked" && "bg-sky-400",
        challenge.status === "pending_confirm" && "bg-violet-400",
        challenge.status === "disputed" && "bg-rose-400",
        challenge.status === "completed" && "bg-emerald-400",
        isClosed && "bg-ink-700",
      )}
    />
  );

  if (!href) {
    return (
      <Card className={shell}>
        {accent}
        {body}
      </Card>
    );
  }

  return (
    <Card interactive className="overflow-hidden">
      <Link href={href} className={shell}>
        {accent}
        {body}
      </Link>
    </Card>
  );
}
