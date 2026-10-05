import { CalendarDays, MapPin, Plus, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AvatarStack, EmptyState, PageIntro } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { FlowLink } from "@/components/ui/flow-button";
import { requireProfile } from "@/lib/auth";
import { SPORTS, type SportKey } from "@/lib/constants";
import { listUpcomingSessions } from "@/lib/queries";
import {
  WEEK_BUCKET_LABELS,
  cn,
  dayLabel,
  formatTime,
  formatVnd,
  timeUntil,
  weekBucket,
  weekdayLabel,
} from "@/lib/utils";

import { BaoDi } from "./bao-di";

export const metadata: Metadata = { title: "Buổi tập" };

/*
 * MỘT CÁI LỊCH, KHÔNG PHẢI MỘT LƯỚI THẺ.
 *
 * Bản trước là lưới hai cột thẻ cao, mỗi thẻ một buổi tập, xếp theo thứ
 * tự thời gian nhưng không nhóm lại. Ba chỗ hỏng:
 *
 * 1. Người ta không hỏi "có bao nhiêu buổi", người ta hỏi "thứ 7 này có
 *    đánh không, ai đi rồi". Một dãy thẻ phẳng không trả lời được câu đó
 *    mà không đọc kỹ từng cái.
 * 2. Trên điện thoại mỗi màn hình chỉ thấy khoảng một buổi rưỡi vì thẻ
 *    quá cao. Dạng dòng gọn cho thấy năm sáu buổi, tức nhìn một cái là
 *    nắm cả tháng.
 * 3. Cả thẻ là một liên kết sang trang chi tiết, nên muốn báo đi phải mở
 *    thêm một trang — mà đó lại là việc làm nhiều nhất ở đây.
 *
 * Giờ nhóm theo tuần, mỗi buổi một dòng: ô ngày bên trái, nội dung ở
 * giữa, nút báo đi bên phải. Ô ngày là thứ duy nhất được phép to, vì
 * "ngày nào" chính là câu hỏi đầu tiên.
 */

type Session = Awaited<ReturnType<typeof listUpcomingSessions>>[number];

/** Ô ngày bên trái, kiểu tờ lịch bóc. */
function ONgay({ ngay, noiBat }: { ngay: Date; noiBat: boolean }) {
  const d = new Date(ngay);
  const soNgay = new Intl.DateTimeFormat("vi-VN", {
    timeZone: process.env.NEXT_PUBLIC_TIME_ZONE || "Asia/Ho_Chi_Minh",
    day: "numeric",
  }).format(d);
  const thang = new Intl.DateTimeFormat("vi-VN", {
    timeZone: process.env.NEXT_PUBLIC_TIME_ZONE || "Asia/Ho_Chi_Minh",
    month: "numeric",
  }).format(d);

  return (
    <div
      className={cn(
        "flex w-[58px] shrink-0 flex-col items-center justify-center rounded-xl border py-2",
        noiBat
          ? "border-gold-300 bg-gold-50 dark:border-gold-400/30 dark:bg-gold-400/10"
          : "border-ink-800 bg-ink-850",
      )}
    >
      <span className="text-[10px] font-bold tracking-[0.1em] text-ink-500 uppercase">
        {weekdayLabel(d).replace("Thứ ", "T")}
      </span>
      <span
        className={cn(
          "tabular font-display text-[22px] leading-none font-bold",
          noiBat ? "text-gold-700 dark:text-gold-300" : "text-ink-100",
        )}
      >
        {soNgay}
      </span>
      <span className="text-[10.5px] text-ink-500">th{thang}</span>
    </div>
  );
}

function DongBuoiTap({
  session,
  viewerId,
}: {
  session: Session;
  viewerId: string;
}) {
  const going = session.attendees.filter((a) => a.status === "going");
  const isGoing = going.some((a) => a.userId === viewerId);
  const isNotGoing = session.attendees.some(
    (a) => a.userId === viewerId && a.status === "not_going",
  );
  const sport = SPORTS[session.sport as SportKey];
  const isFull =
    session.maxPlayers !== null && going.length >= session.maxPlayers;
  const conThieu =
    session.maxPlayers !== null ? session.maxPlayers - going.length : null;
  const nhanNgay = dayLabel(session.startsAt);

  return (
    <li
      className={cn(
        "flex gap-3 px-3 py-3.5 transition-colors sm:gap-4 sm:px-4",
        isGoing && "bg-gold-50/60 dark:bg-gold-400/[0.06]",
      )}
    >
      <ONgay ngay={session.startsAt} noiBat={isGoing} />

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {nhanNgay && (
              <span className="text-[11px] font-bold tracking-wide text-gold-700 dark:text-gold-300">
                {nhanNgay}
              </span>
            )}
            <span className="tabular text-[12.5px] font-semibold text-ink-300">
              {formatTime(session.startsAt)}
            </span>
            <span className="text-[12px] text-ink-500">
              {sport.icon} {sport.label}
            </span>
            {!nhanNgay && (
              <span className="text-[11.5px] text-ink-500">
                {timeUntil(session.startsAt)}
              </span>
            )}
          </div>

          <h3 className="mt-1">
            <Link
              href={`/buoi-tap/${session.id}`}
              className="font-display text-[17px] leading-tight font-bold text-ink-100 transition-colors hover:text-link sm:text-[18px]"
            >
              {session.title}
            </Link>
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-ink-400">
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-ink-500" aria-hidden />
              <span className="truncate">{session.venueName}</span>
            </span>
            {session.costTotal !== null && going.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Wallet className="size-3.5 shrink-0 text-ink-500" aria-hidden />
                ~{formatVnd(Math.round(session.costTotal / going.length))}/người
              </span>
            )}
          </div>
        </div>

        {/* Ai đi, và còn thiếu mấy người */}
        <div className="flex items-center gap-2.5 sm:w-[150px] sm:shrink-0">
          <AvatarStack
            people={going.map((a) => ({
              id: a.userId,
              fullName: a.user.fullName,
              avatarUrl: a.user.avatarUrl,
            }))}
          />
          <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-ink-300">
            <Users className="size-3.5 text-ink-500" aria-hidden />
            <span className="tabular">
              {going.length}
              {session.maxPlayers ? `/${session.maxPlayers}` : ""}
            </span>
          </span>
          {/*
            "Còn thiếu 2" mới là câu kéo người ta bấm, chứ không phải
            "6/8". Chỉ hiện khi sắp đủ: còn thiếu 5 người thì câu đó
            chẳng giục được ai.
          */}
          {conThieu !== null && conThieu > 0 && conThieu <= 2 && (
            <span className="shrink-0 text-[11.5px] font-bold text-gold-700 dark:text-gold-300">
              thiếu {conThieu}
            </span>
          )}
          {isFull && (
            <span className="shrink-0 text-[11.5px] font-semibold text-ink-500">
              đủ người
            </span>
          )}
        </div>

        <div className="shrink-0 sm:w-[132px]">
          <BaoDi
            sessionId={session.id}
            isGoing={isGoing}
            isNotGoing={isNotGoing}
            daDayNguoi={isFull}
          />
        </div>
      </div>
    </li>
  );
}

export default async function SessionsPage() {
  const profile = await requireProfile();
  const sessions = await listUpcomingSessions();

  // Gom theo tuần, giữ nguyên thứ tự thời gian bên trong mỗi nhóm.
  const nhom = new Map<number, Session[]>();
  for (const s of sessions) {
    const b = weekBucket(s.startsAt);
    if (!nhom.has(b)) nhom.set(b, []);
    nhom.get(b)!.push(s);
  }

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Lịch"
        title="Buổi tập"
        lead="Lịch ra sân sắp tới."
        action={<FlowLink href="/buoi-tap/tao" text="Tạo lịch" />}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="Chưa có lịch nào sắp tới"
          description="Tuần này anh em nghỉ, hay chưa ai chịu đứng ra đặt sân?"
          action={
            <LinkButton href="/buoi-tap/tao" variant="accent">
              <Plus className="size-4" strokeWidth={2.5} />
              Lên lịch ngay
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-7">
          {[0, 1, 2].map((b) => {
            const trong = nhom.get(b);
            if (!trong || trong.length === 0) return null;

            return (
              <section key={b}>
                {/* Tiêu đề tuần dính lại khi cuộn: danh sách dài thì vẫn
                    biết đang đọc tới tuần nào. Nằm dưới thanh trên 64px. */}
                <h2 className="sticky top-16 z-10 -mx-4 bg-ink-950/90 px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase backdrop-blur-sm">
                  {WEEK_BUCKET_LABELS[b]}
                  <span className="ml-2 font-semibold tracking-normal text-ink-600 normal-case">
                    {trong.length} buổi
                  </span>
                </h2>

                <ul className="mt-2 divide-y divide-ink-800 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
                  {trong.map((session) => (
                    <DongBuoiTap
                      key={session.id}
                      session={session}
                      viewerId={profile.id}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
