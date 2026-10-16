import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Plus,
  Wallet,
} from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";

import { SportIcon } from "@/components/domain-icons";
import { SessionRow, ThanhCho, doDai } from "@/components/session-row";
import { AvatarStack, Card, EmptyState, PageIntro } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import type { SportKey } from "@/lib/constants";
import { directionsUrl, mapEmbedSrc } from "@/lib/maps";
import { listUpcomingSessions } from "@/lib/queries";
import {
  cn,
  dayLabel,
  formatTime,
  formatVnd,
  timeUntil,
  weekdayLabel,
  zonedYmd,
} from "@/lib/utils";

import { BaoDi } from "./bao-di";

export const metadata: Metadata = { title: "Buổi tập" };

type Session = Awaited<ReturnType<typeof listUpcomingSessions>>[number];

/** Khoá ngày theo múi giờ app, dùng làm mỏ neo `#ngay-…` và để gom nhóm. */
const khoaNgay = (d: Date) => {
  const z = zonedYmd(d);
  return `${z.year}-${String(z.month).padStart(2, "0")}-${String(z.day).padStart(2, "0")}`;
};

/** "17/10" theo múi giờ app. */
const ngayThang = (d: Date) => {
  const z = zonedYmd(d);
  return `${z.day}/${z.month}`;
};

function trangThaiDi(session: Session, meId: string) {
  const going = session.attendees.filter((a) => a.status === "going");
  return {
    going,
    toi: going.some((a) => a.userId === meId),
    ban: session.attendees.some(
      (a) => a.userId === meId && a.status === "not_going",
    ),
    day: session.maxPlayers !== null && going.length >= session.maxPlayers,
  };
}

/* ------------------------------------------------------------------ */
/* Buổi tới gần nhất                                                    */
/* ------------------------------------------------------------------ */

/**
 * Khung lớn đầu trang: trả lời ngay ba câu ai mở lịch cũng hỏi — KHI NÀO
 * (ngày, giờ, còn bao lâu), Ở ĐÂU (sân, địa chỉ, chỉ đường, bản đồ) và
 * AI ĐI. Nút báo đi nằm luôn ở đây, khỏi phải tìm trong danh sách.
 */
function BuoiGanNhat({ session, meId }: { session: Session; meId: string }) {
  const { going, toi, ban, day } = trangThaiDi(session, meId);
  const nhan = dayLabel(session.startsAt);
  const chiDuong = directionsUrl(
    session.venueName,
    session.venueAddress,
    session.mapUrl,
  );
  const banDo = session.showMap
    ? mapEmbedSrc(session.venueName, session.venueAddress, session.mapUrl)
    : null;
  const di = going.length;

  return (
    <section
      id="buoi-gan-nhat"
      aria-labelledby="buoi-gan-nhat-tieu-de"
      className="scroll-mt-24 overflow-hidden rounded-2xl bg-navy-950 text-white ring-1 ring-white/10 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
    >
      <div className="relative isolate p-5 sm:p-7">
        <div
          aria-hidden
          className="absolute -top-24 -left-20 -z-10 size-72 rounded-full bg-gold-400/15 blur-[80px]"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sport text-[12.5px] font-bold tracking-[0.22em] text-gold-300 uppercase">
            Buổi tới gần nhất
          </span>
          <span className="rounded-full bg-gold-400 px-2.5 py-0.5 text-[11.5px] font-bold text-navy-950">
            {nhan ? `${nhan} · ` : ""}
            {timeUntil(session.startsAt)}
          </span>
        </div>

        {/* KHI NÀO */}
        <p className="mt-4 font-display text-[30px] leading-none font-bold sm:text-[38px]">
          {weekdayLabel(session.startsAt)}, {ngayThang(session.startsAt)}
        </p>
        <p className="tabular mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[17px] font-semibold text-white/90 sm:text-[19px]">
          <Clock className="size-[18px] text-gold-300" aria-hidden />
          {formatTime(session.startsAt)} – {formatTime(session.endsAt)}
          <span className="text-[13px] font-medium text-white/50">
            {doDai(session.startsAt, session.endsAt)}
          </span>
        </p>

        <h2 id="buoi-gan-nhat-tieu-de" className="mt-4">
          <Link
            href={`/buoi-tap/${session.id}`}
            className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-white/80 transition-colors hover:text-white"
          >
            <SportIcon sport={session.sport as SportKey} className="size-4 text-gold-300" />
            {session.title}
          </Link>
        </h2>

        {/* Ở ĐÂU */}
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gold-400 text-navy-950">
            <MapPin className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">{session.venueName}</p>
            {session.venueAddress ? (
              <p className="mt-0.5 text-[13px] text-white/60">
                {session.venueAddress}
              </p>
            ) : (
              <p className="mt-0.5 text-[13px] text-white/40">
                Chưa ghi địa chỉ
              </p>
            )}
          </div>
          {chiDuong && (
            <a
              href={chiDuong}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-lg bg-white px-3 py-2 text-[13px] font-bold text-navy-950 transition-colors hover:bg-gold-300"
            >
              <Navigation className="size-3.5" aria-hidden />
              Chỉ đường
            </a>
          )}
        </div>

        {/* AI ĐI + báo đi */}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              {di > 0 && (
                <AvatarStack
                  people={going.map((a) => ({
                    id: a.userId,
                    fullName: a.user.fullName,
                    avatarUrl: a.user.avatarUrl,
                  }))}
                  max={5}
                  size="sm"
                />
              )}
              <span className="tabular text-[13.5px] font-semibold text-white/85">
                {di > 0 ? `${di}` : "Chưa ai"}
                {session.maxPlayers ? `/${session.maxPlayers}` : ""} người đi
              </span>
            </div>
            {session.maxPlayers !== null && (
              <ThanhCho
                di={di}
                toiDa={session.maxPlayers}
                className="mt-2.5 max-w-xs bg-white/10"
              />
            )}
            {session.costTotal !== null && di > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-white/55">
                <Wallet className="size-3.5" aria-hidden />
                ~{formatVnd(Math.round(session.costTotal / di))}/người
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:w-[200px]">
            <BaoDi
              sessionId={session.id}
              isGoing={toi}
              isNotGoing={ban}
              daDayNguoi={day}
            />
            <Link
              href={`/buoi-tap/${session.id}`}
              className="group inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gold-400 px-4 text-[13.5px] font-bold text-navy-950 transition-colors hover:bg-gold-300"
            >
              Xem chi tiết
              <ChevronRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Bản đồ sân. Không bật bản đồ thì một tấm "sân" vẽ tay thay chỗ. */}
      <div className="relative min-h-[220px] border-t border-white/10 lg:min-h-full lg:border-t-0 lg:border-l">
        {banDo ? (
          <iframe
            src={banDo}
            title={`Bản đồ ${session.venueName}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full grayscale-[25%]"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#0b3d2e,#06281e)]"
          >
            <div className="relative h-[70%] w-[62%] rounded border-2 border-white/40">
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-white/60" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
              <div className="absolute inset-x-[8%] top-[18%] bottom-[18%] border-x border-white/25" />
            </div>
            <span className="absolute bottom-4 left-4 rounded-md bg-black/40 px-2 py-1 text-[12px] font-semibold text-white/85">
              {session.venueName}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export default async function SessionsPage() {
  const profile = await requireProfile();
  const sessions = await listUpcomingSessions();

  const [ganNhat, ...conLai] = sessions;

  // Gom các buổi còn lại theo NGÀY (theo múi giờ app), giữ thứ tự thời gian.
  const theoNgay: { key: string; ngay: Date; buoi: Session[] }[] = [];
  for (const s of conLai) {
    const key = khoaNgay(s.startsAt);
    const cuoi = theoNgay.at(-1);
    if (cuoi && cuoi.key === key) cuoi.buoi.push(s);
    else theoNgay.push({ key, ngay: s.startsAt, buoi: [s] });
  }

  // Ngày nào có buổi: để dải tuần sáng lên và trỏ tới đúng chỗ.
  const buoiTheoNgay = new Map<string, Session[]>();
  for (const s of sessions) {
    const key = khoaNgay(s.startsAt);
    buoiTheoNgay.set(key, [...(buoiTheoNgay.get(key) ?? []), s]);
  }
  const coTrongDanhSach = new Set(theoNgay.map((d) => d.key));

  // Tuần này, tính theo múi giờ app (Vercel chạy UTC). Cộng trừ ngày bằng
  // Date.UTC để không dính múi giờ máy chủ.
  const homNay = zonedYmd();
  const viTriHomNay = (homNay.weekday + 6) % 7;
  const tuanNay = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((thu, i) => {
    const d = new Date(
      Date.UTC(homNay.year, homNay.month - 1, homNay.day + (i - viTriHomNay)),
    );
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    return {
      thu,
      so: d.getUTCDate(),
      key,
      homNay: i === viTriHomNay,
      daQua: i < viTriHomNay,
      buoi: buoiTheoNgay.get(key) ?? [],
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageIntro
        title="Buổi tập & Lịch ra sân"
        lead="Đánh khi nào, ở sân nào, ai đi — xem một lần là đủ. Báo đi sớm để chốt sân."
        action={
          <LinkButton href="/buoi-tap/tao" variant="accent">
            <Plus className="size-4" />
            Tạo lịch buổi tập
          </LinkButton>
        }
      />

      {!ganNhat ? (
        <EmptyState
          icon={<CalendarDays className="size-6" />}
          title="Chưa có lịch nào sắp tới"
          description="Tuần này anh em nghỉ, hay chưa ai chịu đứng ra đặt sân?"
          action={
            <LinkButton href="/buoi-tap/tao" variant="accent">
              <Plus className="size-4" />
              Lên lịch ngay
            </LinkButton>
          }
        />
      ) : (
        <>
          <BuoiGanNhat session={ganNhat} meId={profile.id} />

          {/* Lịch tuần: ngày có buổi sáng lên, ghi giờ, bấm là nhảy tới */}
          <Card className="p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-[14px] font-semibold text-ink-100">
                Lịch tuần này
              </h2>
              <span className="tabular text-[12.5px] font-medium text-ink-500">
                Tháng {homNay.month}, {homNay.year}
              </span>
            </div>
            <ol className="grid grid-cols-7 gap-1 text-center sm:gap-2">
              {tuanNay.map((n) => {
                const co = n.buoi.length > 0;
                const dich = coTrongDanhSach.has(n.key)
                  ? `#ngay-${n.key}`
                  : "#buoi-gan-nhat";
                const noiDung = (
                  <>
                    <span className="text-[11.5px] font-medium opacity-80">
                      {n.thu}
                    </span>
                    <span className="tabular mt-0.5 font-display text-[17px] leading-none font-bold">
                      {n.so}
                    </span>
                    <span className="mt-1.5 flex min-h-[16px] flex-col items-center gap-0.5">
                      {n.buoi.slice(0, 2).map((b) => (
                        <span
                          key={b.id}
                          className={cn(
                            "tabular rounded px-1 text-[10px] leading-[14px] font-bold",
                            n.homNay
                              ? "bg-navy-950/15 dark:bg-navy-950/20"
                              : "bg-gold-400 text-navy-950",
                          )}
                        >
                          {formatTime(b.startsAt)}
                        </span>
                      ))}
                      {n.buoi.length > 2 && (
                        <span className="text-[10px] font-semibold opacity-70">
                          +{n.buoi.length - 2}
                        </span>
                      )}
                    </span>
                    {n.homNay && <span className="sr-only">Hôm nay</span>}
                  </>
                );
                const lop = cn(
                  "flex h-full flex-col items-center rounded-xl border px-0.5 pt-2 pb-2",
                  n.homNay
                    ? "border-navy-900 bg-navy-900 text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy-950"
                    : co
                      ? "border-gold-400/60 bg-gold-400/10 text-ink-100"
                      : "border-ink-800 bg-ink-850 text-ink-500",
                  n.daQua && !n.homNay && "opacity-50",
                );
                return (
                  <li key={n.key} aria-current={n.homNay ? "date" : undefined}>
                    {co ? (
                      <a
                        href={dich}
                        aria-label={`${n.thu} ngày ${n.so}: ${n.buoi.length} buổi`}
                        className={cn(
                          lop,
                          "transition-transform hover:-translate-y-0.5",
                        )}
                      >
                        {noiDung}
                      </a>
                    ) : (
                      <div className={lop}>{noiDung}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* Các buổi tiếp theo, nhóm theo ngày */}
          {theoNgay.length > 0 && (
            <section aria-labelledby="tiep-theo" className="space-y-5">
              <h2
                id="tiep-theo"
                className="text-[17px] font-semibold text-ink-100"
              >
                Các buổi tiếp theo
                <span className="tabular ml-2 text-[13px] font-medium text-ink-500">
                  {conLai.length} buổi
                </span>
              </h2>

              {theoNgay.map((d) => {
                const nhan = dayLabel(d.ngay);
                return (
                  <div
                    key={d.key}
                    id={`ngay-${d.key}`}
                    className="scroll-mt-24"
                  >
                    <h3 className="mb-2 flex items-baseline gap-2 px-1">
                      <span className="text-[15px] font-bold text-ink-100">
                        {weekdayLabel(d.ngay)}, {ngayThang(d.ngay)}
                      </span>
                      {nhan && (
                        <span className="text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
                          {nhan}
                        </span>
                      )}
                    </h3>
                    <Card className="overflow-hidden">
                      <ul className="divide-y divide-ink-800">
                        {d.buoi.map((session) => {
                          const { going, toi, ban, day } = trangThaiDi(
                            session,
                            profile.id,
                          );
                          return (
                            <li key={session.id} className="p-3.5 sm:p-4">
                              <SessionRow
                                session={{
                                  id: session.id,
                                  title: session.title,
                                  venueName: session.venueName,
                                  venueAddress: session.venueAddress,
                                  mapUrl: session.mapUrl,
                                  sport: session.sport,
                                  startsAt: session.startsAt,
                                  endsAt: session.endsAt,
                                  maxPlayers: session.maxPlayers,
                                  costTotal: session.costTotal,
                                  going: going.map((a) => ({
                                    id: a.userId,
                                    fullName: a.user.fullName,
                                    avatarUrl: a.user.avatarUrl,
                                  })),
                                }}
                                rsvp={
                                  <BaoDi
                                    sessionId={session.id}
                                    isGoing={toi}
                                    isNotGoing={ban}
                                    daDayNguoi={day}
                                  />
                                }
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}
