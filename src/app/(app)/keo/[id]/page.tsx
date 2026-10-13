import { SportIcon, StakeIcon } from "@/components/domain-icons";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  MapPin,
  Pencil,
  Plus,
  ShieldAlert,
  Swords,
  Target,
  Trophy,
} from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { trangThaiKeo } from "@/components/challenge-card";
import { Alert, Avatar, Badge, Card, CardBody, Well } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { isModerator, requireProfile } from "@/lib/auth";
import {
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
 * Giờ gộp làm một thẻ kiểu bảng tỉ số: dải navy ghi thể thức, hai đội
 * quay mặt vào nhau, tỉ số nằm chính giữa, phần thưởng vắt ngang chân
 * thẻ. Thông tin phụ (hạn đánh, buổi tập, người tạo) ra cột phải.
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
  // Đội B soi gương đội A từ sm trở lên: tên dạt về mép phải, hai đội
  // quay mặt vào tỉ số ở giữa.
  const guong = team === "B";

  return (
    <VaoSan
      phia={team === "A" ? "trai" : "phai"}
      className={cn(
        "flex min-w-0 flex-col p-4 transition-colors sm:p-5",
        guong && "sm:items-end sm:text-right",
        isWinner && "bg-gold-50 dark:bg-gold-400/10",
        isLoser && "opacity-60",
        !isWinner &&
          !isLoser &&
          myTeam === team &&
          "bg-navy-50 dark:bg-navy-600/15",
      )}
    >
      <div
        className={cn(
          "mb-3.5 flex flex-wrap items-center gap-2",
          guong && "sm:flex-row-reverse",
        )}
      >
        <h3 className="font-display text-[17px] leading-none text-ink-100">
          Đội {team}
        </h3>
        {isWinner && (
          <Badge tone="lime">
            <Trophy className="size-3" aria-hidden />
            Thắng
          </Badge>
        )}
        {myTeam === team && !isWinner && <Badge tone="navy">Đội bạn</Badge>}
      </div>

      <ul className="w-full flex-1 space-y-2.5">
        {members.map((p) => (
          <li
            key={p.userId}
            className={cn(
              "flex items-center gap-2.5",
              guong && "sm:flex-row-reverse",
            )}
          >
            <Avatar
              name={p.user.fullName}
              src={p.user.avatarUrl}
              seed={p.userId}
              size="md"
              className={cn(p.status === "invited" && "opacity-50 grayscale")}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink-100">
                {p.user.fullName}
              </p>
              {p.status === "invited" && (
                <p className="text-[12px] text-gold-700 dark:text-gold-300">
                  Chưa trả lời
                </p>
              )}
              {p.isCreator && p.status !== "invited" && (
                <p className="text-[12px] text-ink-500">Người tạo kèo</p>
              )}
            </div>
          </li>
        ))}

        {Array.from({ length: Math.max(0, capacity - members.length) }).map(
          (_, i) => (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2.5",
                guong && "sm:flex-row-reverse",
              )}
            >
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-ink-700 text-ink-500"
              >
                <Plus className="size-4" />
              </span>
              <span className="text-[14px] text-ink-500">Còn trống</span>
            </li>
          ),
        )}
      </ul>

      {joinSlot && <div className="mt-4 w-full">{joinSlot}</div>}
    </VaoSan>
  );
}

/**
 * Giữa sân: tỉ số nếu đã có, còn không thì "VS".
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
  ghiChu,
  tuDong,
}: {
  hasScore: boolean;
  scoreA: number | null | undefined;
  scoreB: number | null | undefined;
  winner: "A" | "B" | null;
  ghiChu: string | null;
  tuDong: boolean;
}) {
  return (
    <div className="flex min-w-36 flex-col items-center justify-center gap-2 border-y border-ink-800 px-5 py-6 text-center sm:border-x sm:border-y-0">
      {hasScore ? (
        <p className="tabular font-display flex items-center gap-4 text-[44px] leading-none text-ink-100 sm:text-[52px]">
          <span className={cn(winner === "B" && "text-ink-500")}>
            <SoTiSo diem={scoreA as number} />
          </span>
          <span aria-hidden className="h-9 w-px bg-ink-700" />
          <span className={cn(winner === "A" && "text-ink-500")}>
            <SoTiSo diem={scoreB as number} />
          </span>
        </p>
      ) : winner ? (
        <p className="font-display text-[26px] leading-tight text-ink-100">
          Đội {winner}
        </p>
      ) : (
        <p className="font-display text-[32px] leading-none text-ink-600">
          VS
        </p>
      )}

      <p className="text-[12.5px] font-semibold text-ink-500">
        {winner ? `Đội ${winner} thắng` : "Chưa có kết quả"}
      </p>

      {tuDong && <p className="text-[12px] text-ink-500">Tự động xác nhận</p>}

      {ghiChu && (
        <p className="mt-1 max-w-[24ch] text-[13px] leading-relaxed text-ink-400">
          “{ghiChu}”
        </p>
      )}
    </div>
  );
}

/** Một dòng trong thẻ "Chi tiết kèo" ở cột phải. */
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
    <div className="flex items-start gap-3 p-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-850 text-ink-400">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-px">
        <dt className="text-[12.5px] text-ink-500">{nhan}</dt>
        <dd className="mt-0.5 text-[14px] leading-snug font-semibold text-ink-100">
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

  const status = trangThaiKeo(challenge.status);
  const format = challenge.format as ChallengeFormatKey;
  const formatSpec = CHALLENGE_FORMATS[format];
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

  const coViecQuanLy = canEdit || leaveDec.ok || cancelDec.ok || canDelete;

  return (
    <div className="space-y-6">
      <Link
        href="/keo"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tất cả kèo
      </Link>

      {/* Tiêu đề */}
      <header className="animate-rise">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          {challenge.kind === "direct" && (
            <Badge tone="navy">Thách đích danh</Badge>
          )}
        </div>

        <h1 className="font-display mt-3 text-[28px] leading-[1.15] text-ink-100 sm:text-[32px]">
          {challenge.title}
        </h1>

        {challenge.description && (
          <p className="mt-2.5 max-w-[60ch] text-[15px] leading-relaxed text-ink-300">
            {challenge.description}
          </p>
        )}
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* Lời mời đang chờ bạn. Đặt NGAY TRÊN dải đối đầu vì đây là việc
              phải làm, không phải thông tin để đọc. */}
          {respondDec.ok && (
            <Card>
              <CardBody>
                <div className="mb-4 flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300">
                    <Swords className="size-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-semibold text-ink-100">
                      Bạn bị thách kèo này
                    </h2>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-500">
                      Nhận hay né? Nhận rồi thì nhớ đánh, thua phải bao đấy.
                    </p>
                  </div>
                </div>
                <RespondInviteForm challengeId={challenge.id} />
              </CardBody>
            </Card>
          )}

          {/* Bảng tỉ số: hai đội, tỉ số và phần thưởng gộp làm một thẻ */}
          <section aria-label="Hai đội và kết quả">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 bg-navy-900 px-4 py-2.5 text-[12.5px] font-semibold text-white sm:px-5">
                <span className="flex min-w-0 items-center gap-1.5">
                  <SportIcon
                    sport={challenge.sport as SportKey}
                    className="text-gold-300"
                  />
                  <span className="truncate">
                    {formatSpec.label}
                    {challenge.pointsTarget
                      ? `, đánh tới ${challenge.pointsTarget} điểm`
                      : ""}
                  </span>
                </span>
                {nhanKetQua && (
                  <span className="shrink-0 text-gold-300">{nhanKetQua}</span>
                )}
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
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

              {/* Phần thưởng vắt ngang chân thẻ, không còn là một hộp riêng:
                  nó thuộc về trận này chứ không phải một mẩu tin rời. */}
              <div className="flex items-center gap-3.5 border-t border-ink-800 bg-ink-850/60 px-4 py-3.5 sm:px-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
                  <StakeIcon stake={stakeKey} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
                    Cả đội thua bao cả đội thắng
                  </p>
                  <p className="mt-0.5 text-[17px] leading-tight font-bold text-ink-100">
                    {formatStake(
                      stakeKey,
                      challenge.stakeQty,
                      challenge.stakeNote,
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Phản đối kết quả: hộp riêng, vì đây là chuyện phải xử lý chứ
              không phải một dòng thông tin trong bảng tỉ số. */}
          {challenge.status === "disputed" &&
            challenge.result?.disputeReason && (
              <Alert tone="rose">
                <p className="mb-1 flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="size-4" aria-hidden />
                  Lý do phản đối
                </p>
                <p>{challenge.result.disputeReason}</p>
              </Alert>
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

          {challenge.status === "cancelled" &&
            challenge.cancellationReason && (
              <Well className="px-4 py-3.5">
                <p className="text-[12.5px] font-semibold text-ink-500">
                  Lý do huỷ
                </p>
                <p className="mt-0.5 text-[14px] text-ink-300">
                  {challenge.cancellationReason}
                </p>
              </Well>
            )}
        </div>

        {/* Cột phải: thông tin phụ và các việc quản lý */}
        <aside className="space-y-6 lg:sticky lg:top-10">
          <section aria-labelledby="chi-tiet-keo">
            <Card className="overflow-hidden">
              <h2
                id="chi-tiet-keo"
                className="px-4 pt-4 pb-1 text-[16px] font-semibold text-ink-100"
              >
                Chi tiết kèo
              </h2>
              <dl className="px-2 pb-2">
                <OThongTin icon={Target} nhan="Thể thức">
                  {challenge.pointsTarget
                    ? `${formatSpec.label}, tới ${challenge.pointsTarget} điểm`
                    : formatSpec.label}
                </OThongTin>

                {challenge.playDeadline && (
                  <OThongTin icon={Clock} nhan="Hạn đánh">
                    {formatDateTime(challenge.playDeadline)}
                    <span className="block text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
                      {timeUntil(challenge.playDeadline)}
                    </span>
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

                <div className="flex items-start gap-3 p-2">
                  <Avatar
                    name={challenge.creator.fullName}
                    src={challenge.creator.avatarUrl}
                    seed={challenge.creator.id}
                    size="md"
                    className="size-9"
                  />
                  <div className="min-w-0 flex-1 pt-px">
                    <dt className="text-[12.5px] text-ink-500">Người tạo</dt>
                    <dd className="mt-0.5 truncate text-[14px] leading-snug font-semibold text-ink-100">
                      {challenge.creator.fullName}
                    </dd>
                    <dd className="text-[12.5px] text-ink-500">
                      {formatDateTime(challenge.createdAt)}
                    </dd>
                  </div>
                </div>
              </dl>
            </Card>
          </section>

          {coViecQuanLy && (
            <section aria-labelledby="quan-ly-keo">
              <Card className="p-4">
                <h2
                  id="quan-ly-keo"
                  className="mb-2 text-[16px] font-semibold text-ink-100"
                >
                  Quản lý
                </h2>
                <div className="-mx-1.5 flex flex-wrap items-center gap-1">
                  {/* Sửa đứng trước mấy việc phá: nó là việc vô hại nhất
                      trong nhóm, mà trước đây gõ nhầm tên kèo thì chỉ còn
                      nước xoá đi tạo lại, mất sạch người đã nhận. */}
                  {canEdit && (
                    <LinkButton
                      variant="ghost"
                      size="sm"
                      href={`/keo/${challenge.id}/sua`}
                    >
                      <Pencil className="size-4" />
                      Sửa kèo
                    </LinkButton>
                  )}
                  {leaveDec.ok && (
                    <LeaveChallengeForm challengeId={challenge.id} />
                  )}
                  {cancelDec.ok && (
                    <CancelChallengeForm challengeId={challenge.id} />
                  )}
                  {canDelete && (
                    <DeleteChallengeForm challengeId={challenge.id} />
                  )}
                </div>
              </Card>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
