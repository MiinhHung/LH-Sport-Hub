import {
  ArrowLeft,
  CalendarClock,
  Clock,
  MapPin,
  Pencil,
  ShieldAlert,
  Target,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, Badge, Card, CardBody, Dot } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
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

import { SoTiSo, VaoSan } from "./ban-ti-so";
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

/*
 * MỘT DẢI ĐỐI ĐẦU, KHÔNG PHẢI BẢY CÁI HỘP.
 *
 * Bản trước xếp dọc: dải tiền cược, hộp đội A, hộp đội B, thẻ kết quả,
 * bốn ô thông tin, hộp lý do huỷ — tất cả đều là "bo góc + viền + nền
 * nhạt", tám khối giống hệt nhau chồng lên nhau. Mắt không có chỗ nào để
 * bám, và thứ quan trọng nhất của trang (ai đánh với ai, thắng thua ra
 * sao) bị chia ra ba khối rời nhau, phải cuộn qua lại mới ghép lại được.
 *
 * Giờ gộp làm một: hai đội quay mặt vào nhau, tỉ số nằm chính giữa, tiền
 * cược vắt ngang chân dải. Đọc một lần là xong — đó cũng đúng là cách
 * người ta đọc một bảng tỉ số thật.
 *
 * Trên điện thoại thì xếp dọc A / tỉ số / B, và đường ngăn đổi từ dọc
 * sang ngang theo.
 */

function CotDoi({
  team,
  members,
  capacity,
  isWinner,
  isLoser,
  myTeam,
  joinSlot,
}: {
  team: "A" | "B";
  members: NonNullable<
    Awaited<ReturnType<typeof getChallengeDetail>>
  >["participants"];
  capacity: number;
  isWinner: boolean;
  isLoser: boolean;
  myTeam: string | undefined;
  joinSlot?: React.ReactNode;
}) {
  return (
    <VaoSan
      phia={team === "A" ? "trai" : "phai"}
      className={cn(
        "flex flex-col p-4 transition-colors sm:p-5",
        isWinner && "bg-gold-50 dark:bg-gold-400/10",
        isLoser && "opacity-60",
        !isWinner &&
          !isLoser &&
          myTeam === team &&
          "bg-navy-50 dark:bg-navy-600/15",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
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
    </VaoSan>
  );
}

/**
 * Giữa sân: tỉ số nếu đã có, còn không thì "VS" và thể thức.
 *
 * DẤU PHÂN CÁCH LÀ MỘT VẠCH, KHÔNG PHẢI MỘT GẠCH NGANG. Bản trước dùng
 * ký tự en-dash giữa hai con số. Nó trông gần giống dấu trừ, nên "21 – 18"
 * đọc thoáng qua dễ thành một phép tính; mà bản thân ký tự đó cũng rộng
 * hẹp khác nhau tuỳ phông. Một vạch dọc mảnh thì không mang nghĩa toán
 * học nào, và nằm đúng giữa hai số ở mọi cỡ chữ.
 */
function GiuaSan({
  hasScore,
  scoreA,
  scoreB,
  winner,
  trangThai,
  nhanTheThuc,
  ghiChu,
  tuDong,
}: {
  hasScore: boolean;
  scoreA: number | null | undefined;
  scoreB: number | null | undefined;
  winner: "A" | "B" | null;
  trangThai: string | null;
  nhanTheThuc: string;
  ghiChu: string | null;
  tuDong: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 border-y border-ink-800 px-5 py-6 text-center sm:border-x sm:border-y-0 sm:py-5">
      {trangThai && (
        <p className="text-[10.5px] font-bold tracking-[0.12em] text-ink-500 uppercase">
          {trangThai}
        </p>
      )}

      {hasScore ? (
        <p className="tabular font-display flex items-center gap-3 text-[40px] leading-none font-bold text-ink-100 sm:text-[44px]">
          <span className={cn(winner === "B" && "text-ink-500")}>
            <SoTiSo diem={scoreA as number} />
          </span>
          <span aria-hidden className="h-8 w-px bg-ink-700" />
          <span className={cn(winner === "A" && "text-ink-500")}>
            <SoTiSo diem={scoreB as number} />
          </span>
        </p>
      ) : winner ? (
        <p className="font-display text-2xl leading-tight font-bold text-ink-100">
          Đội {winner}
          <br />
          thắng
        </p>
      ) : (
        <p className="font-display text-3xl leading-none font-bold text-ink-600">
          VS
        </p>
      )}

      <p className="text-[11.5px] font-semibold text-ink-500">
        {hasScore && winner ? `Đội ${winner} thắng` : nhanTheThuc}
      </p>

      {tuDong && <p className="text-[11px] text-ink-500">Tự động xác nhận</p>}

      {ghiChu && (
        <p className="mt-1 max-w-[22ch] text-[12.5px] text-ink-500 italic">
          “{ghiChu}”
        </p>
      )}
    </div>
  );
}

/** Một dòng thông tin trong hàng chân trang, ngăn nhau bằng nét mảnh. */
function OThongTin({
  icon: Icon,
  nhan,
  children,
}: {
  icon: typeof Target;
  nhan: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="size-4 shrink-0 text-ink-500" aria-hidden />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold text-ink-500">{nhan}</dt>
        <dd className="truncate text-[13.5px] font-semibold text-ink-200">
          {children}
        </dd>
      </div>
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

  // Sửa chặt hơn xoá một bậc: hễ ĐÃ CÓ kết quả gửi lên là khoá, kể cả
  // khi còn đang chờ xác nhận. Đổi tiền cược lúc đã biết ai thắng thì
  // người thua phải trả một khoản họ chưa từng đồng ý.
  // `updateChallengeAction` kiểm y hệt.
  const canEdit =
    (challenge.creatorId === user.id || isMod) &&
    !challenge.result &&
    challenge.status !== "cancelled" &&
    challenge.status !== "declined";

  const winner =
    challenge.result?.status === "confirmed"
      ? (challenge.result.winningTeam as "A" | "B")
      : null;

  const hasScore =
    challenge.result?.scoreA !== null &&
    challenge.result?.scoreA !== undefined &&
    challenge.result?.scoreB !== null &&
    challenge.result?.scoreB !== undefined;

  const nhanKetQua = !challenge.result
    ? null
    : challenge.result.status === "confirmed"
      ? "Kết quả chính thức"
      : challenge.result.status === "disputed"
        ? "Đang tranh chấp"
        : "Chờ xác nhận";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/keo"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
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
          {challenge.kind === "direct" && (
            <Badge tone="violet">Thách đấu</Badge>
          )}
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

      {/* Lời mời đang chờ bạn. Đặt NGAY TRÊN dải đối đầu vì đây là việc
          phải làm, không phải thông tin để đọc. */}
      {respondDec.ok && (
        <Card className="border-violet-200 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-500/10">
          <CardBody>
            <h2 className="mb-1 text-base font-bold text-violet-800 dark:text-violet-200">
              Bạn bị thách kèo này
            </h2>
            <p className="mb-4 text-[13.5px] text-violet-700 dark:text-violet-300/80">
              Nhận hay né? Nhận rồi thì nhớ đánh, thua phải bao đấy.
            </p>
            <RespondInviteForm challengeId={challenge.id} />
          </CardBody>
        </Card>
      )}

      {/* Dải đối đầu: hai đội, tỉ số và tiền cược gộp làm một khối */}
      <section
        aria-label="Hai đội và kết quả"
        className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900"
      >
        <div className="grid sm:grid-cols-[1fr_auto_1fr]">
          <CotDoi
            team="A"
            members={teamA}
            capacity={formatSpec.playersPerTeam}
            isWinner={winner === "A"}
            isLoser={winner === "B"}
            myTeam={myTeam}
            joinSlot={
              joinA.ok ? (
                <JoinChallengeForm challengeId={challenge.id} team="A" />
              ) : undefined
            }
          />

          <GiuaSan
            hasScore={Boolean(challenge.result) && hasScore}
            scoreA={challenge.result?.scoreA}
            scoreB={challenge.result?.scoreB}
            winner={
              challenge.result
                ? (challenge.result.winningTeam as "A" | "B")
                : null
            }
            trangThai={nhanKetQua}
            nhanTheThuc={
              challenge.pointsTarget
                ? `Đánh tới ${challenge.pointsTarget} điểm`
                : formatSpec.label
            }
            ghiChu={challenge.result?.notes ?? null}
            tuDong={Boolean(challenge.result?.autoConfirmed)}
          />

          <CotDoi
            team="B"
            members={teamB}
            capacity={formatSpec.playersPerTeam}
            isWinner={winner === "B"}
            isLoser={winner === "A"}
            myTeam={myTeam}
            joinSlot={
              joinB.ok ? (
                <JoinChallengeForm challengeId={challenge.id} team="B" />
              ) : undefined
            }
          />
        </div>

        {/* Tiền cược vắt ngang chân dải, không còn là một hộp riêng: nó
            thuộc về trận này chứ không phải một mẩu tin rời. */}
        <div className="flex items-center gap-3.5 border-t border-gold-200 bg-gold-50 px-4 py-3.5 dark:border-gold-400/25 dark:bg-gold-400/10">
          <span className="text-2xl leading-none" aria-hidden>
            {STAKES[stakeKey].icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold tracking-[0.1em] text-gold-600 uppercase dark:text-gold-300">
              Cả đội thua bao cả đội thắng
            </p>
            <p className="mt-0.5 text-[17px] leading-tight font-bold text-gold-700 dark:text-gold-300">
              {formatStake(stakeKey, challenge.stakeQty, challenge.stakeNote)}
            </p>
          </div>
        </div>
      </section>

      {/* Phản đối kết quả: hộp riêng, vì đây là chuyện phải xử lý chứ
          không phải một dòng thông tin trong bảng tỉ số. */}
      {challenge.status === "disputed" && challenge.result?.disputeReason && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-400/30 dark:bg-rose-500/10">
          <p className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-rose-700 dark:text-rose-300">
            <ShieldAlert className="size-4" aria-hidden />
            Lý do phản đối
          </p>
          <p className="text-[13.5px] text-rose-800 dark:text-rose-200/80">
            {challenge.result.disputeReason}
          </p>
        </div>
      )}

      {confirmDec.ok && challenge.result && (
        <ConfirmResultActions challengeId={challenge.id} />
      )}

      {/* Nhập kết quả */}
      {submitDec.ok && (
        <SubmitResultForm
          challengeId={challenge.id}
          isFreeFormat={challenge.format === "free"}
          pointsTarget={challenge.pointsTarget}
        />
      )}

      {/*
        Chi tiết kèo: một hàng ngăn bằng nét mảnh, không phải bốn cái hộp.

        Bốn ô bo góc riêng cho bốn mẩu tin ngắn là thừa hẳn một tầng khối.
        Mỗi ô chỉ chứa một nhãn và một dòng chữ, chẳng có thứ bậc nào để
        một cái viền phải đi diễn đạt.
      */}
      <dl className="grid divide-y divide-ink-800 rounded-2xl border border-ink-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {challenge.pointsTarget && (
          <OThongTin icon={Target} nhan="Thể thức">
            Đánh tới {challenge.pointsTarget} điểm
          </OThongTin>
        )}

        {challenge.playDeadline && (
          <OThongTin icon={Clock} nhan="Hạn đánh">
            {formatDateTime(challenge.playDeadline)} ·{" "}
            {timeUntil(challenge.playDeadline)}
          </OThongTin>
        )}

        {challenge.session ? (
          <OThongTin icon={MapPin} nhan="Buổi tập">
            <Link
              href={`/buoi-tap/${challenge.session.id}`}
              className="text-link hover:underline"
            >
              {challenge.session.title}
            </Link>
          </OThongTin>
        ) : (
          <OThongTin icon={CalendarClock} nhan="Thời gian">
            Đánh lúc nào cũng được
          </OThongTin>
        )}
      </dl>

      {challenge.status === "cancelled" && challenge.cancellationReason && (
        <div className="rounded-2xl border border-ink-800 px-4 py-3.5">
          <p className="text-[11px] font-semibold text-ink-500">Lý do huỷ</p>
          <p className="mt-0.5 text-[13.5px] text-ink-300">
            {challenge.cancellationReason}
          </p>
        </div>
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
          {/* Sửa đứng trước mấy việc phá: nó là việc vô hại nhất trong
              nhóm, mà trước đây gõ nhầm tên kèo thì chỉ còn nước xoá đi
              tạo lại, mất sạch người đã nhận. */}
          {canEdit && (
            <LinkButton
              variant="ghost"
              size="sm"
              href={`/keo/${challenge.id}/sua`}
              className="text-ink-500 hover:text-ink-100"
            >
              <Pencil className="size-4" />
              Sửa kèo
            </LinkButton>
          )}
          {leaveDec.ok && <LeaveChallengeForm challengeId={challenge.id} />}
          {cancelDec.ok && <CancelChallengeForm challengeId={challenge.id} />}
          {canDelete && <DeleteChallengeForm challengeId={challenge.id} />}
        </div>
      </footer>
    </div>
  );
}
