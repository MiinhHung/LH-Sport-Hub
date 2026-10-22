import { SportIcon } from "@/components/domain-icons";
import {
  ArrowLeft,
  Clock,
  Info,
  MapPin,
  Navigation,
  Users,
} from "@/components/icons";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChallengeCard } from "@/components/challenge-card";
import { ONgay, ThanhCho } from "@/components/session-row";
import { Avatar, Badge, Card, SectionTitle } from "@/components/ui";
import { buttonClass } from "@/components/ui/button";
import { isModerator, requireProfile } from "@/lib/auth";
import { SPORTS, type SportKey } from "@/lib/constants";
import { directionsUrl, mapEmbedSrc } from "@/lib/maps";
import { getSessionDetail } from "@/lib/queries";
import {
  dayLabel,
  formatDate,
  formatDateTime,
  formatTime,
  formatVnd,
  timeUntil,
  weekdayLabel,
} from "@/lib/utils";

import { NutChiaSe } from "@/components/buoi-tap/nut-chia-se";

import { AttendanceButtons } from "./attendance";
import { SessionOwnerActions } from "./session-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getSessionDetail(id);
  return { title: session?.title ?? "Buổi tập" };
}

const STATUS_LABEL = {
  open: { label: "Đang mở", tone: "lime" },
  cancelled: { label: "Đã huỷ", tone: "rose" },
  completed: { label: "Đã xong", tone: "slate" },
} as const;

/** Thẻ ở cột phải: tiêu đề một dòng, nội dung bên dưới. */
function RailCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <Card className="overflow-hidden">
        <h2 id={id} className="px-4 pt-4 pb-2 text-[15px] font-semibold text-ink-100">
          {title}
        </h2>
        <div className="px-4 pb-4">{children}</div>
      </Card>
    </section>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  const mine = session.attendees.find((a) => a.userId === profile.id);
  const going = session.attendees.filter((a) => a.status === "going");
  const notGoing = session.attendees.filter((a) => a.status === "not_going");
  const sport = SPORTS[session.sport as SportKey];
  const status = STATUS_LABEL[session.status];
  const isOwner = session.creatorId === profile.id || isModerator(profile);
  const nhanNgay = dayLabel(session.startsAt);

  const directions = directionsUrl(
    session.venueName,
    session.venueAddress,
    session.mapUrl,
  );
  const embedSrc = session.showMap
    ? mapEmbedSrc(session.venueName, session.venueAddress, session.mapUrl)
    : null;

  const perHead =
    session.costTotal !== null && going.length > 0
      ? Math.round(session.costTotal / going.length)
      : null;

  const conThieu =
    session.maxPlayers !== null ? session.maxPlayers - going.length : null;

  // Buổi đã qua giờ kết thúc thì không báo đi/huỷ nữa — server cũng chặn
  // ("Buổi tập đã kết thúc."), giấu nút cho khỏi bấm rồi mới biết.
  // eslint-disable-next-line react-hooks/purity -- trang server, dựng mỗi lần tải
  const daKetThuc = session.endsAt.getTime() < Date.now();

  return (
    <div className="space-y-6">
      <Link
        href="/buoi-tap"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Lịch tập
      </Link>

      {/* Đầu trang: ô ngày, tên buổi, giờ, sân. */}
      <header className="animate-rise">
        <Card>
          <div className="flex gap-4 p-4 sm:gap-5 sm:p-6">
            <span aria-hidden>
              <ONgay
                ngay={session.startsAt}
                homNay={nhanNgay === "Hôm nay"}
                lon
              />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <Badge tone={status.tone}>{status.label}</Badge>
                <span className="flex items-center gap-1 text-[12.5px] font-medium text-ink-500">
                  <SportIcon sport={session.sport as SportKey} />
                  {sport.label}
                </span>
                {session.status === "open" && (
                  <span className="text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
                    {nhanNgay ?? timeUntil(session.startsAt)}
                  </span>
                )}
              </div>

              <h1 className="font-display mt-2 text-[24px] leading-[1.15] text-ink-100 sm:text-[32px]">
                {session.title}
              </h1>

              <dl className="mt-3 space-y-2 text-[14px]">
                <div className="flex items-start gap-2.5">
                  <dt className="flex shrink-0 pt-0.5 text-ink-500">
                    <Clock className="size-4" aria-hidden />
                    <span className="sr-only">Thời gian</span>
                  </dt>
                  <dd className="text-ink-300">
                    <span className="font-semibold text-ink-200">
                      {weekdayLabel(session.startsAt)},{" "}
                      {formatDate(session.startsAt)}
                    </span>
                    <span aria-hidden className="mx-2 text-ink-600">
                      ·
                    </span>
                    <span className="tabular">
                      {formatTime(session.startsAt)} đến{" "}
                      {formatTime(session.endsAt)}
                    </span>
                  </dd>
                </div>

                <div className="flex items-start gap-2.5">
                  <dt className="flex shrink-0 pt-0.5 text-ink-500">
                    <MapPin className="size-4" aria-hidden />
                    <span className="sr-only">Địa điểm</span>
                  </dt>
                  <dd className="min-w-0">
                    <span className="font-semibold text-ink-200">
                      {session.venueName}
                    </span>
                    {session.venueAddress && (
                      <span className="block text-[13px] text-ink-500">
                        {session.venueAddress}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              {directions && (
                <a
                  href={directions}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass("secondary", "sm", "mt-4")}
                >
                  <Navigation className="size-4" aria-hidden />
                  Chỉ đường
                </a>
              )}
            </div>
          </div>

          {session.notes && (
            <div className="flex items-start gap-2.5 border-t border-ink-800 px-4 py-3.5 sm:px-6">
              <Info
                className="mt-0.5 size-4 shrink-0 text-ink-500"
                aria-hidden
              />
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-ink-300">
                <span className="sr-only">Ghi chú: </span>
                {session.notes}
              </p>
            </div>
          )}
        </Card>
      </header>

      {session.status === "cancelled" && session.cancellationReason && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-400/30 dark:bg-rose-500/10">
          <p className="text-[13px] font-semibold text-rose-700 dark:text-rose-300">
            Buổi này đã huỷ
          </p>
          <p className="mt-0.5 text-[13.5px] text-rose-800 dark:text-rose-200/80">
            {session.cancellationReason}
          </p>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* Điểm danh: sĩ số và nút gạt đi/không đi */}
          <section aria-labelledby="diem-danh">
            <Card className="p-4 sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2
                    id="diem-danh"
                    className="text-[15px] font-semibold text-ink-100"
                  >
                    {session.status === "open" ? "Bạn có đi không?" : "Sĩ số"}
                  </h2>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">
                    <span className="tabular font-semibold text-ink-200">
                      {going.length}
                      {session.maxPlayers ? `/${session.maxPlayers}` : ""}
                    </span>{" "}
                    người đã nhận đi
                  </p>
                </div>
                {conThieu !== null && conThieu > 0 && (
                  <span className="text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
                    Còn {conThieu} chỗ
                  </span>
                )}
                {conThieu !== null && conThieu <= 0 && (
                  <span className="text-[12.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Đủ người
                  </span>
                )}
              </div>

              <ThanhCho
                di={going.length}
                toiDa={session.maxPlayers}
                className="mt-3"
              />

              {/*
                Nút chia sẻ đặt CẠNH nút điểm danh, không nhét vào menu
                của chủ buổi: ai cũng rủ người khác được, không riêng
                người đặt sân. Và đây đúng là lúc người ta nghĩ tới
                chuyện rủ — vừa xem xong giờ và sân.

                Vẫn hiện cả khi buổi đã đóng hoặc đã qua: gửi lại link
                cho người hỏi "hôm đó đánh ở đâu" là việc có thật.
              */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {session.status === "open" && !daKetThuc && (
                  <AttendanceButtons
                    sessionId={session.id}
                    isGoing={mine?.status === "going"}
                    isNotGoing={mine?.status === "not_going"}
                    daDayNguoi={conThieu !== null && conThieu <= 0}
                  />
                )}
                <NutChiaSe
                  duongDan={`/moi/${session.id}`}
                  tieuDe={session.title}
                  moTa={`${formatDateTime(session.startsAt)} • ${session.venueName}`}
                />
              </div>
            </Card>
          </section>

          {/* Danh sách người tham gia, chia theo trả lời */}
          <section aria-labelledby="ds-di">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 sm:px-5">
                <h2 id="ds-di" className="text-[15px] font-semibold text-ink-100">
                  Sẽ đi{" "}
                  <span className="tabular font-semibold text-ink-500">
                    {going.length}
                  </span>
                </h2>
              </div>

              {going.length === 0 ? (
                <div className="flex items-center gap-3 px-4 pt-1 pb-5 sm:px-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink-850 text-ink-500">
                    <Users className="size-[18px]" />
                  </span>
                  <p className="text-[13px] leading-relaxed text-ink-500">
                    Chưa ai nhận đi. Bạn xung phong trước đi, có người đầu
                    tiên là kiểu gì cũng có người theo.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-0.5 px-2 pb-2 sm:grid-cols-2">
                  {going.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/thanh-vien/${a.userId}`}
                        prefetch={false}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-ink-850"
                      >
                        <Avatar
                          name={a.user.fullName}
                          src={a.user.avatarUrl}
                          seed={a.userId}
                          size="md"
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[14px] font-semibold text-ink-100">
                              {a.user.fullName}
                            </span>
                            {a.userId === session.creatorId && (
                              <Badge variant="gold" className="shrink-0 px-1.5 py-0 text-[11px]">
                                Tổ chức
                              </Badge>
                            )}
                          </span>
                          <span className="block truncate text-[12.5px] text-ink-500">
                            {a.user.department || "Thành viên"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {notGoing.length > 0 && (
                <div className="border-t border-ink-800 px-4 py-3.5 sm:px-5">
                  <h3 className="text-[13px] font-semibold text-ink-400">
                    Không đi{" "}
                    <span className="tabular text-ink-500">
                      {notGoing.length}
                    </span>
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {notGoing.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-1.5 rounded-full border border-ink-800 py-0.5 pr-2.5 pl-0.5"
                      >
                        <Avatar
                          name={a.user.fullName}
                          src={a.user.avatarUrl}
                          seed={a.userId}
                          size="xs"
                          className="rounded-full"
                        />
                        <span className="text-[12.5px] text-ink-400">
                          {a.user.fullName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </section>

          {/* Kèo gắn với buổi này */}
          {session.challenges.length > 0 && (
            <section aria-labelledby="keo-trong-buoi">
              <SectionTitle>
                <span id="keo-trong-buoi">
                  Kèo trong buổi này ({session.challenges.length})
                </span>
              </SectionTitle>
              <div className="grid gap-3">
                {session.challenges.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    currentUserId={profile.id}
                    href={`/keo/${c.id}`}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-10">
          {/* Người tổ chức + hành động của chủ buổi */}
          <RailCard id="to-chuc" title="Người tổ chức">
            <div className="flex items-center gap-3">
              <Avatar
                name={session.creator.fullName}
                src={session.creator.avatarUrl}
                seed={session.creator.id}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink-100">
                  {session.creator.fullName}
                </p>
                <p className="text-[12.5px] text-ink-500">đứng ra đặt sân</p>
              </div>
            </div>

            {isOwner && (
              <div className="mt-4 border-t border-ink-800 pt-4">
                <SessionOwnerActions
                  sessionId={session.id}
                  canCancel={session.status === "open" && !daKetThuc}
                  canEdit={session.status !== "cancelled"}
                  goingCount={going.length}
                />
              </div>
            )}
          </RailCard>

          {session.costTotal !== null && (
            <RailCard id="chi-phi" title="Chi phí">
              <dl className="space-y-2.5 text-[13.5px]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-500">Tiền sân</dt>
                  <dd className="tabular font-semibold text-ink-200">
                    {formatVnd(session.costTotal)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-500">Mỗi người (tạm tính)</dt>
                  {perHead === null ? (
                    <dd className="text-[13px] text-ink-500">
                      Chưa ai nhận đi
                    </dd>
                  ) : (
                    <dd className="tabular font-display text-[17px] text-ink-100">
                      {formatVnd(perHead)}
                    </dd>
                  )}
                </div>
              </dl>

              {/*
                MÃ QR CỦA NGƯỜI TẠO BUỔI.

                Chỉ hiện khi buổi có tính tiền (đã nằm trong điều kiện của
                cả thẻ này) và người tạo đã tải mã lên. Chưa có mã thì
                nhắc đúng một câu, và CHỈ nhắc chính chủ — người khác đọc
                câu đó cũng chẳng làm gì được.

                Nền TRẮNG dưới mã, kể cả ở chế độ tối: máy quét đọc mã QR
                bằng tương phản đen trên trắng, đảo màu là nhiều máy chịu
                thua.
              */}
              {session.creator.qrUrl ? (
                <div className="mt-4 border-t border-ink-800 pt-4">
                  <p className="text-[12.5px] text-ink-500">
                    Quét để chuyển cho{" "}
                    <span className="font-semibold text-ink-300">
                      {session.creator.fullName}
                    </span>
                  </p>
                  <a
                    href={session.creator.qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Mở mã QR của ${session.creator.fullName} cỡ lớn`}
                    className="mt-2 block rounded-lg bg-white p-2 ring-1 ring-ink-800 transition-opacity hover:opacity-90"
                  >
                    <Image
                      src={session.creator.qrUrl}
                      alt={`Mã QR nhận tiền của ${session.creator.fullName}`}
                      width={320}
                      height={320}
                      sizes="240px"
                      className="h-auto w-full object-contain"
                    />
                  </a>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
                    Mã không kèm sẵn số tiền — tự nhập{" "}
                    {perHead === null ? "số tiền" : formatVnd(perHead)} khi
                    chuyển.
                  </p>
                </div>
              ) : (
                isOwner && (
                  <div className="mt-4 border-t border-ink-800 pt-4">
                    <p className="text-[12.5px] leading-relaxed text-ink-500">
                      Thêm mã QR trong{" "}
                      <Link
                        href="/ho-so"
                        className="font-semibold text-link underline-offset-2 hover:underline"
                      >
                        hồ sơ
                      </Link>{" "}
                      để anh em quét trả tiền sân, khỏi phải hỏi số tài khoản.
                    </p>
                  </div>
                )
              )}
            </RailCard>
          )}

          {/* Bản đồ: nạp muộn để không kéo chậm lần mở trang đầu tiên. */}
          {embedSrc && (
            <section aria-label={`Bản đồ tới ${session.venueName}`}>
              <Card className="overflow-hidden">
                <iframe
                  src={embedSrc}
                  title={`Bản đồ tới ${session.venueName}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="block h-56 w-full"
                />
              </Card>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
