import { CalendarDays, Plus } from "lucide-react";
import type { Metadata } from "next";

import { SessionRow } from "@/components/session-row";
import { EmptyState, PageIntro } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { FlowLink } from "@/components/ui/flow-button";
import { requireProfile } from "@/lib/auth";
import { listUpcomingSessions } from "@/lib/queries";
import { WEEK_BUCKET_LABELS, weekBucket } from "@/lib/utils";

import { BaoDi } from "./bao-di";

export const metadata: Metadata = { title: "Buổi tập" };

type Session = Awaited<ReturnType<typeof listUpcomingSessions>>[number];

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

  const sapToiNhatId = sessions[0]?.id;

  /*
   * CỘT HẸP, KHÔNG DÀN HẾT BỀ NGANG.
   *
   * Đo trên bản dựng ở màn 1280: tiêu đề buổi tập nằm ở x=167 còn nút
   * báo đi ở x=1033 — mắt phải đi 866px từ chỗ đọc tên tới chỗ bấm, cho
   * một thao tác mà người ta làm mỗi tuần. Rộng không phải lúc nào cũng
   * hơn: cái lịch đọc theo chiều dọc, nên trải nó ra 1120px chỉ tạo
   * thêm đường cho mắt chạy.
   *
   * max-w-3xl cũng là bề ngang mà trang chi tiết kèo và trang hồ sơ
   * đang dùng, nên không phải một ngoại lệ riêng của trang này.
   */
  return (
    <div className="mx-auto max-w-3xl space-y-8">
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
        <div className="space-y-8">
          {[0, 1, 2].map((b) => {
            const trong = nhom.get(b);
            if (!trong || trong.length === 0) return null;

            return (
              <section key={b}>
                {/*
                  Nhãn tuần: một nét vàng ngắn rồi tới chữ, không phải một
                  thanh nền xám chạy hết bề ngang. Thanh nền đọc ra là
                  tiêu đề cột của bảng dữ liệu; nét vàng thì đọc ra là
                  một mốc trên dòng thời gian, đúng thứ nó đang đánh dấu.

                  Dính lại khi cuộn, nằm ngay dưới thanh trên cao 64px, để
                  danh sách dài vẫn biết đang đọc tới tuần nào.
                */}
                <h2 className="sticky top-16 z-20 -mx-4 flex items-center gap-2.5 bg-ink-950/92 px-4 py-2.5 backdrop-blur-sm">
                  <span aria-hidden className="h-px w-5 shrink-0 bg-gold-400" />
                  <span className="text-[11px] font-bold tracking-[0.16em] text-ink-300 uppercase">
                    {WEEK_BUCKET_LABELS[b]}
                  </span>
                  <span className="text-[11.5px] font-medium text-ink-500">
                    {trong.length} buổi
                  </span>
                </h2>

                {/*
                  Đường thời gian chạy dọc sau các ô ngày. Nó biến một
                  danh sách rời rạc thành một mạch thời gian, và cũng là
                  thứ duy nhất trong trang nói "đây là cái lịch" mà không
                  cần một chữ nào.
                */}
                <div className="mt-1">
                  <ul className="relative divide-y divide-ink-800 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
                    {trong.map((session) => {
                      const going = session.attendees.filter(
                        (a) => a.status === "going",
                      );
                      const toi = going.some((a) => a.userId === profile.id);
                      const isNotGoing = session.attendees.some(
                        (a) =>
                          a.userId === profile.id && a.status === "not_going",
                      );
                      const isFull =
                        session.maxPlayers !== null &&
                        going.length >= session.maxPlayers;

                      return (
                        <SessionRow
                          key={session.id}
                          session={{
                            id: session.id,
                            title: session.title,
                            venueName: session.venueName,
                            sport: session.sport,
                            startsAt: session.startsAt,
                            maxPlayers: session.maxPlayers,
                            costTotal: session.costTotal,
                            going: going.map((a) => ({
                              id: a.userId,
                              fullName: a.user.fullName,
                              avatarUrl: a.user.avatarUrl,
                            })),
                          }}
                          toi={toi}
                          sapToiNhat={session.id === sapToiNhatId}
                          rsvp={
                            <BaoDi
                              sessionId={session.id}
                              isGoing={toi}
                              isNotGoing={isNotGoing}
                              daDayNguoi={isFull}
                            />
                          }
                        />
                      );
                    })}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
