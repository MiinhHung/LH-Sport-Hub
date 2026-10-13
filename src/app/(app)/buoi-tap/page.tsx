import { CalendarDays, Info, Plus } from "@/components/icons";
import type { Metadata } from "next";

import { ONgay, SessionRow } from "@/components/session-row";
import { Card, EmptyState, MetaLine, PageIntro, Well } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { listUpcomingSessions } from "@/lib/queries";
import {
  cn,
  dayLabel,
  formatDate,
  WEEK_BUCKET_LABELS,
  weekBucket,
  weekdayLabel,
} from "@/lib/utils";

import { BaoDi } from "./bao-di";

export const metadata: Metadata = { title: "Buổi tập" };

type Session = Awaited<ReturnType<typeof listUpcomingSessions>>[number];

/** Một ngày trong lịch: các buổi của ngày đó, giữ thứ tự thời gian. */
type Ngay = { key: string; ngay: Date; buoi: Session[] };

export default async function SessionsPage() {
  const profile = await requireProfile();
  const sessions = await listUpcomingSessions();

  // Gom theo tuần rồi theo ngày, giữ nguyên thứ tự thời gian bên trong.
  const nhom = new Map<number, Ngay[]>();
  for (const s of sessions) {
    const b = weekBucket(s.startsAt);
    if (!nhom.has(b)) nhom.set(b, []);
    const cacNgay = nhom.get(b)!;
    const key = formatDate(s.startsAt);
    const cuoi = cacNgay.at(-1);
    if (cuoi && cuoi.key === key) cuoi.buoi.push(s);
    else cacNgay.push({ key, ngay: s.startsAt, buoi: [s] });
  }

  /*
   * CỘT HẸP, KHÔNG DÀN HẾT BỀ NGANG.
   *
   * Đo trên bản dựng ở màn 1280: tiêu đề buổi tập nằm ở x=167 còn nút
   * báo đi ở x=1033, mắt phải đi 866px từ chỗ đọc tên tới chỗ bấm, cho
   * một thao tác mà người ta làm mỗi tuần. Cái lịch đọc theo chiều dọc,
   * nên trải nó ra hết bề ngang chỉ tạo thêm đường cho mắt chạy.
   */
  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7;
  const daysInWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((thu, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() + (idx - currentDayOfWeek));
    return {
      thu,
      dayNum: d.getDate(),
      isToday: idx === currentDayOfWeek,
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageIntro
        title="Buổi tập & Lịch ra sân"
        lead="Lịch ra sân định kỳ của CLB. Báo đi trước để chốt giờ và xếp cặp thi đấu."
        action={
          <LinkButton href="/buoi-tap/tao" variant="accent">
            <Plus className="size-4" />
            Tạo lịch buổi tập
          </LinkButton>
        }
      />

      <MetaLine
        items={[
          <span key="n" className="tabular font-semibold text-ink-300">
            {sessions.length} buổi tập sắp tới
          </span>,
          "Cố định thứ 5 & thứ 7",
          "WaveStation & Yonex Arena",
        ]}
      />

      {/* Dải tuần này */}
      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[14px] font-semibold text-ink-100">
            Lịch tuần này
          </h2>
          <span className="tabular text-[12.5px] font-medium text-ink-500">
            Tháng {now.getMonth() + 1}, {now.getFullYear()}
          </span>
        </div>
        <ol className="grid grid-cols-7 gap-1 text-center sm:gap-2">
          {daysInWeek.map((item) => (
            <li
              key={item.thu}
              aria-current={item.isToday ? "date" : undefined}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border py-2 sm:py-2.5",
                item.isToday
                  ? "border-navy-900 bg-navy-900 font-bold text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy-950"
                  : "border-ink-800 bg-ink-850 text-ink-400",
              )}
            >
              <span className="text-[12px] font-medium">{item.thu}</span>
              <span className="tabular mt-0.5 text-[15px] font-bold">
                {item.dayNum}
              </span>
              {item.isToday && <span className="sr-only">Hôm nay</span>}
            </li>
          ))}
        </ol>
      </Card>

      {sessions.length === 0 ? (
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
        <div className="space-y-6">
          {[0, 1, 2].map((b) => {
            const cacNgay = nhom.get(b);
            if (!cacNgay || cacNgay.length === 0) return null;
            const soBuoi = cacNgay.reduce((n, d) => n + d.buoi.length, 0);

            return (
              <section key={b} aria-labelledby={`tuan-${b}`}>
                {/* Nhãn tuần */}
                <div className="sticky top-[65px] z-20 flex items-baseline gap-2 bg-ink-950 py-2">
                  <h2
                    id={`tuan-${b}`}
                    className="text-[16px] font-semibold text-ink-100"
                  >
                    {WEEK_BUCKET_LABELS[b]}
                  </h2>
                  <span className="tabular text-[12.5px] font-medium text-ink-500">
                    {soBuoi} buổi
                  </span>
                </div>

                <Card className="mt-1 overflow-hidden">
                  <ol className="divide-y divide-ink-800">
                    {cacNgay.map((d) => {
                      const nhanNgay = dayLabel(d.ngay);
                      return (
                        <li
                          key={d.key}
                          className="flex gap-3 p-3 sm:gap-4 sm:p-4"
                        >
                          {/* Ô ngày chỉ để nhìn; trình đọc màn hình nghe
                              bản chữ đầy đủ ở dòng sr-only. */}
                          <div className="shrink-0">
                            <span aria-hidden>
                              <ONgay
                                ngay={d.ngay}
                                homNay={nhanNgay === "Hôm nay"}
                              />
                            </span>
                            <h3 className="sr-only">
                              {nhanNgay ? `${nhanNgay}, ` : ""}
                              {weekdayLabel(d.ngay)}, {d.key}
                            </h3>
                          </div>

                          <ul className="min-w-0 flex-1 divide-y divide-ink-800">
                            {d.buoi.map((session) => {
                              const going = session.attendees.filter(
                                (a) => a.status === "going",
                              );
                              const toi = going.some(
                                (a) => a.userId === profile.id,
                              );
                              const isNotGoing = session.attendees.some(
                                (a) =>
                                  a.userId === profile.id &&
                                  a.status === "not_going",
                              );
                              const isFull =
                                session.maxPlayers !== null &&
                                going.length >= session.maxPlayers;

                              return (
                                <li
                                  key={session.id}
                                  className="py-3 first:pt-0.5 last:pb-0.5"
                                >
                                  <SessionRow
                                    session={{
                                      id: session.id,
                                      title: session.title,
                                      venueName: session.venueName,
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
                                        isNotGoing={isNotGoing}
                                        daDayNguoi={isFull}
                                      />
                                    }
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </section>
            );
          })}
        </div>
      )}

      {/* Quy định đặt & huỷ lịch CLB */}
      <Well className="flex items-start gap-3 py-3.5">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-500" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-[14px] font-semibold text-ink-100">
            Quy định đặt & huỷ lịch CLB Light Human
          </h2>
          <p className="text-[13px] leading-relaxed text-ink-400">
            Vui lòng báo tham gia hoặc báo nghỉ trước ít nhất 12 giờ để ban tổ chức chốt số lượng người và thuê sân phù hợp. Đi trễ quá 15 phút sẽ phụ tiền nước/cầu cho buổi tập theo quy ước CLB.
          </p>
        </div>
      </Well>
    </div>
  );
}
