import {
  ArrowLeft,
  CalendarClock,
  Clock,
  MapPin,
  ShieldAlert,
  Target,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, Badge, Card, CardBody, Dot, Well } from "@/components/ui";
import { isModerator, requireProfile } from "@/lib/auth";
import {
  CHALLENGE_STATUS_META,
  canCancel,
  canConfirmResult,
  canJoin,
  canLeave,
  canRespondToInvite,
  canSubmitResult,
  type ChallengeLike,
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
import { getChallengeDetail } from "@/lib/queries";
import { cn, formatDateTime, timeUntil } from "@/lib/utils";

import {
  CancelChallengeForm,
  ConfirmResultActions,
  DeleteChallengeForm,
  JoinChallengeForm,
  LeaveChallengeForm,
  RespondInviteForm,
  SubmitResultForm,
} from "./client-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const challenge = await getChallengeDetail(id);
  return { title: challenge?.title ?? "Kèo" };
}

function TeamColumn({
  team,
  members,
  capacity,
  isWinner,
  myTeam,
  joinSlot,
}: {
  team: "A" | "B";
  members: NonNullable<Awaited<ReturnType<typeof getChallengeDetail>>>["participants"];
  capacity: number;
  isWinner: boolean;
  myTeam: string | undefined;
  joinSlot?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-4 transition-colors",
        isWinner
          ? "border-gold-300 bg-gold-50"
          : myTeam === team
            ? "border-navy-100 bg-navy-50"
            : "border-ink-800 bg-ink-850/60",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase">
          Đội {team}
        </span>
        {isWinner && (
          <Badge tone="lime">
            <Trophy className="size-3" aria-hidden />
            Thắng
          </Badge>
        )}
        {myTeam === team && !isWinner && <Badge tone="navy">Đội bạn</Badge>}
      </div>

      <ul className="flex-1 space-y-2.5">
        {members.map((p) => (
          <li key={p.userId} className="flex items-center gap-2.5">
            <Avatar
              name={p.user.fullName}
              src={p.user.avatarUrl}
              seed={p.userId}
              size="sm"
              className={cn(p.status === "invited" && "opacity-50 grayscale")}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-ink-200">
                {p.user.fullName}
              </p>
              {p.status === "invited" && (
                <p className="text-[11px] text-ink-500">Chưa trả lời</p>
              )}
              {p.isCreator && p.status !== "invited" && (
                <p className="text-[11px] text-ink-500">Người tạo kèo</p>
              )}
            </div>
          </li>
        ))}

        {Array.from({ length: Math.max(0, capacity - members.length) }).map(
          (_, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-[9px] border border-dashed border-ink-700 text-sm text-ink-600">
                ?
              </span>
              <span className="text-[13.5px] text-ink-500">Còn trống</span>
            </li>
          ),
        )}
      </ul>

      {joinSlot && <div className="mt-3.5">{joinSlot}</div>}
    </div>
  );
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await requireProfile();
  const challenge = await getChallengeDetail(id);
  if (!challenge) notFound();

  const isMod = isModerator(user);
  const asLogic = challenge as unknown as ChallengeLike;
  const asParticipants = challenge.participants as unknown as ParticipantLike[];

  const joinA = canJoin(asLogic, asParticipants, user.id, "A");
  const joinB = canJoin(asLogic, asParticipants, user.id, "B");
  const leaveDec = canLeave(asLogic, asParticipants, user.id);
  const respondDec = canRespondToInvite(asLogic, asParticipants, user.id);
  const cancelDec = canCancel(asLogic, user.id, isMod);
  const submitDec = canSubmitResult(asLogic, asParticipants, user.id, isMod);
  const confirmDec = challenge.result
    ? canConfirmResult(
        asLogic,
        asParticipants,
        challenge.result.submittedBy,
        user.id,
        isMod,
      )
    : { ok: false as const, reason: "" };

  const statusMeta = CHALLENGE_STATUS_META[challenge.status];
  const format = challenge.format as ChallengeFormatKey;
  const formatSpec = CHALLENGE_FORMATS[format];
  const sport = SPORTS[challenge.sport as SportKey];
  const stakeKey = challenge.stakeType as StakeKey;

  const held = (team: "A" | "B") =>
    challenge.participants.filter(
      (p) =>
        p.team === team && (p.status === "accepted" || p.status === "invited"),
    );

  const teamA = held("A");
  const teamB = held("B");

  const myTeam = challenge.participants.find(
    (p) =>
      p.userId === user.id &&
      (p.status === "accepted" || p.status === "invited"),
  )?.team;

  // Xoá hẳn chỉ mở khi chưa phát sinh kết quả/nợ — khớp với luật ở server.
  const canDelete =
    (challenge.creatorId === user.id || isMod) &&
    challenge.result?.status !== "confirmed";

  const winner =
    challenge.result?.status === "confirmed"
      ? (challenge.result.winningTeam as "A" | "B")
      : null;

  const hasScore =
    challenge.result?.scoreA !== null &&
    challenge.result?.scoreA !== undefined &&
    challenge.result?.scoreB !== null &&
    challenge.result?.scoreB !== undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/keo"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tất cả kèo
      </Link>

      {/* Tiêu đề */}
      <header>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={statusMeta.tone}>
            <Dot tone={statusMeta.tone} />
            {statusMeta.label}
          </Badge>
          <Badge tone="slate">
            {sport.icon} {formatSpec.label}
          </Badge>
          {challenge.kind === "direct" && <Badge tone="violet">Thách đấu</Badge>}
        </div>

        <h1 className="font-display mt-3 text-[28px] leading-[1.15] font-bold text-ink-100 sm:text-[34px]">
          {challenge.title}
        </h1>

        {challenge.description && (
          <p className="mt-2.5 max-w-prose leading-relaxed text-ink-400">
            {challenge.description}
          </p>
        )}
      </header>

      {/* Phần thưởng — luôn nổi bật nhất */}
      <div className="flex items-center gap-4 rounded-2xl border border-gold-200 bg-gold-50 p-4">
        <span className="text-3xl leading-none" aria-hidden>
          {STAKES[stakeKey].icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold tracking-[0.1em] text-gold-600 uppercase">
            Cả đội thua bao cả đội thắng
          </p>
          <p className="mt-0.5 text-xl leading-tight font-bold text-gold-700">
            {formatStake(stakeKey, challenge.stakeQty, challenge.stakeNote)}
          </p>
        </div>
      </div>

      {/* Lời mời đang chờ bạn */}
      {respondDec.ok && (
        <Card className="border-violet-200 bg-violet-50">
          <CardBody>
            <h2 className="mb-1 text-base font-bold text-violet-800">
              Bạn bị thách kèo này
            </h2>
            <p className="mb-4 text-[13.5px] text-violet-700/80">
              Nhận hay né? Nhận rồi thì nhớ đánh, thua phải bao đấy.
            </p>
            <RespondInviteForm challengeId={challenge.id} />
          </CardBody>
        </Card>
      )}

      {/* Bảng đối đầu */}
      <section aria-label="Hai đội">
        <div className="grid grid-cols-2 gap-3">
          <TeamColumn
            team="A"
            members={teamA}
            capacity={formatSpec.playersPerTeam}
            isWinner={winner === "A"}
            myTeam={myTeam}
            joinSlot={
              joinA.ok ? (
                <JoinChallengeForm challengeId={challenge.id} team="A" />
              ) : undefined
            }
          />
          <TeamColumn
            team="B"
            members={teamB}
            capacity={formatSpec.playersPerTeam}
            isWinner={winner === "B"}
            myTeam={myTeam}
            joinSlot={
              joinB.ok ? (
                <JoinChallengeForm challengeId={challenge.id} team="B" />
              ) : undefined
            }
          />
        </div>
      </section>

      {/* Kết quả */}
      {challenge.result && (
        <Card
          className={cn(
            challenge.status === "disputed" && "border-rose-200",
            challenge.status === "pending_confirm" && "border-violet-200",
          )}
        >
          <CardBody>
            <h2 className="text-[13px] font-semibold text-ink-400">
              {challenge.result.status === "confirmed"
                ? "Kết quả chính thức"
                : challenge.result.status === "disputed"
                  ? "Kết quả đang tranh chấp"
                  : "Kết quả chờ xác nhận"}
            </h2>

            <div className="py-5 text-center">
              {hasScore ? (
                <p className="tabular font-display text-5xl leading-none font-bold text-ink-100">
                  {challenge.result.scoreA}
                  <span className="mx-3 text-ink-600">–</span>
                  {challenge.result.scoreB}
                </p>
              ) : (
                <p className="font-display text-3xl font-bold text-ink-100">
                  Đội {challenge.result.winningTeam} thắng
                </p>
              )}
              <p className="mt-2 text-[13px] font-semibold text-gold-700">
                Đội {challenge.result.winningTeam} thắng
                {challenge.result.autoConfirmed && " · tự động xác nhận"}
              </p>
              {challenge.result.notes && (
                <p className="mt-3 text-sm text-ink-500 italic">
                  “{challenge.result.notes}”
                </p>
              )}
            </div>

            {challenge.status === "disputed" &&
              challenge.result.disputeReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                  <p className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-rose-700">
                    <ShieldAlert className="size-4" aria-hidden />
                    Lý do phản đối
                  </p>
                  <p className="text-[13.5px] text-rose-800/80">
                    {challenge.result.disputeReason}
                  </p>
                </div>
              )}

            {confirmDec.ok && <ConfirmResultActions challengeId={challenge.id} />}
          </CardBody>
        </Card>
      )}

      {/* Nhập kết quả */}
      {submitDec.ok && (
        <SubmitResultForm
          challengeId={challenge.id}
          isFreeFormat={challenge.format === "free"}
          pointsTarget={challenge.pointsTarget}
        />
      )}

      {/* Thông tin kèo */}
      <section aria-label="Chi tiết kèo" className="grid gap-2.5 sm:grid-cols-2">
        {challenge.pointsTarget && (
          <Well className="flex items-center gap-3">
            <Target className="size-4 shrink-0 text-ink-500" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold text-ink-500">Thể thức</p>
              <p className="text-[13.5px] font-semibold text-ink-200">
                Đánh tới {challenge.pointsTarget} điểm
              </p>
            </div>
          </Well>
        )}

        {challenge.playDeadline && (
          <Well className="flex items-center gap-3">
            <Clock className="size-4 shrink-0 text-ink-500" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold text-ink-500">Hạn đánh</p>
              <p className="text-[13.5px] font-semibold text-ink-200">
                {formatDateTime(challenge.playDeadline)} ·{" "}
                {timeUntil(challenge.playDeadline)}
              </p>
            </div>
          </Well>
        )}

        {challenge.session ? (
          <Well className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 text-ink-500" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink-500">Buổi tập</p>
              <Link
                href={`/buoi-tap/${challenge.session.id}`}
                className="block truncate text-[13.5px] font-semibold text-navy-700 hover:underline"
              >
                {challenge.session.title}
              </Link>
            </div>
          </Well>
        ) : (
          <Well className="flex items-center gap-3">
            <CalendarClock
              className="size-4 shrink-0 text-ink-500"
              aria-hidden
            />
            <div>
              <p className="text-[11px] font-semibold text-ink-500">Thời gian</p>
              <p className="text-[13.5px] font-semibold text-ink-200">
                Đánh lúc nào cũng được
              </p>
            </div>
          </Well>
        )}
      </section>

      {challenge.status === "cancelled" && challenge.cancellationReason && (
        <Well className="border border-ink-800">
          <p className="text-[11px] font-semibold text-ink-500">Lý do huỷ</p>
          <p className="mt-0.5 text-[13.5px] text-ink-300">
            {challenge.cancellationReason}
          </p>
        </Well>
      )}

      {/* Chân trang */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 pt-5">
        <div className="flex items-center gap-2.5">
          <Avatar
            name={challenge.creator.fullName}
            src={challenge.creator.avatarUrl}
            seed={challenge.creator.id}
            size="sm"
          />
          <div className="text-[12.5px]">
            <p className="font-semibold text-ink-300">
              {challenge.creator.fullName}
            </p>
            <p className="text-ink-500">
              tạo {formatDateTime(challenge.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {leaveDec.ok && <LeaveChallengeForm challengeId={challenge.id} />}
          {cancelDec.ok && <CancelChallengeForm challengeId={challenge.id} />}
          {canDelete && <DeleteChallengeForm challengeId={challenge.id} />}
        </div>
      </footer>
    </div>
  );
}
