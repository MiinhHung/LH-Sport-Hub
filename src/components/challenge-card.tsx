import { CalendarClock, Clock, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

import { Avatar, Card, Dot, MetaLine } from "@/components/ui";
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
      {/* Dòng nhận dạng. Trước đây chỗ này là năm viên badge xếp ngang —
          một mảng màu tranh hết sự chú ý với tiêu đề. */}
      <div className="flex items-start justify-between gap-3">
        <MetaLine
          items={[
            <span
              key="status"
              className={cn(
                "flex items-center gap-1.5",
                challenge.status === "open" && "text-gold-700",
                challenge.status === "disputed" && "text-rose-600",
                challenge.status === "completed" && "text-emerald-700",
              )}
            >
              <Dot tone={statusMeta.tone} />
              {statusMeta.label}
            </span>,
            <span key="format">
              {sport.icon} {CHALLENGE_FORMATS[format].label}
            </span>,
            challenge.pointsTarget ? (
              <span key="points" className="tabular">
                {challenge.pointsTarget} điểm
              </span>
            ) : null,
            challenge.kind === "direct" ? (
              <span key="kind">Thách đấu</span>
            ) : null,
          ]}
        />
        <span className="shrink-0 text-[10.5px] tracking-wide text-ink-600">
          {timeAgo(challenge.createdAt)}
        </span>
      </div>

      {/* Tiêu đề — cỡ chữ lớn hơn và dùng font serif, để nó là thứ đập vào
          mắt đầu tiên thay vì hàng nhãn phía trên. */}
      <h3 className="font-display mt-2 text-[21px] leading-[1.15] font-bold text-ink-100 transition-colors group-hover:text-navy-700 sm:text-[23px]">
        {challenge.title}
      </h3>
      {challenge.description && (
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-500">
          {challenge.description}
        </p>
      )}

      {/* Đối đầu. Bỏ nền xám: một nét kẻ mảnh đủ để tách phần, mà không
          biến nó thành cái thẻ lồng trong thẻ. */}
      <div className="mt-4 flex items-center gap-3 border-t border-ink-800 pt-4">
        <TeamSide
          members={teamA}
          capacity={counts.A.capacity}
          isMine={myTeam === "A"}
          isWinner={winner === "A"}
          align="left"
        />

        <div className="flex shrink-0 flex-col items-center gap-1">
          {challenge.result?.status === "confirmed" &&
          challenge.result.scoreA !== null &&
          challenge.result.scoreB !== null ? (
            <span className="font-display tabular text-[19px] leading-none font-bold text-navy-900">
              {challenge.result.scoreA}–{challenge.result.scoreB}
            </span>
          ) : (
            <span className="font-display text-[13px] leading-none font-bold text-ink-600 italic">
              vs
            </span>
          )}
          {winner && (
            <Trophy
              className="size-3.5 text-gold-500"
              aria-label="Có đội thắng"
            />
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

      {/* Phần thưởng — thứ quan trọng nhất của một cái kèo, nên cho nó
          nguyên một dải riêng với gạch vàng dẫn mắt. */}
      <div className="mt-4 flex items-center gap-3 border-t-2 border-gold-300 pt-3.5">
        <span className="text-[22px] leading-none" aria-hidden>
          {stake.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] leading-tight font-bold text-gold-700">
            {formatStake(stakeKey, challenge.stakeQty, challenge.stakeNote)}
          </p>
          <p className="mt-0.5 text-[10.5px] font-semibold tracking-[0.12em] text-ink-500 uppercase">
            Đội thua bao đội thắng
          </p>
        </div>
        {challenge.status === "open" && openSlots > 0 && (
          <span className="shrink-0 text-right text-[11.5px] leading-tight font-bold text-gold-700">
            Còn {openSlots}
            <br />
            <span className="font-semibold text-ink-500">chỗ trống</span>
          </span>
        )}
      </div>

      {/* Chân thẻ */}
      {(challenge.session || challenge.playDeadline || myTeam) && (
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
          {myTeam && (
            <span className="ml-auto font-bold text-navy-800">Có bạn</span>
          )}
        </div>
      )}
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
