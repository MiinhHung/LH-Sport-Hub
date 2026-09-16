import { CalendarDays, MapPin, Plus, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AvatarStack, Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { SPORTS, type SportKey } from "@/lib/constants";
import { listUpcomingSessions } from "@/lib/queries";
import { cn, formatDateTime, formatVnd, timeUntil } from "@/lib/utils";

export const metadata: Metadata = { title: "Buổi tập" };

export default async function SessionsPage() {
  const profile = await requireProfile();
  const sessions = await listUpcomingSessions();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Buổi tập"
        description="Lịch ra sân sắp tới. Bấm vào để báo đi hay không đi."
        action={
          <LinkButton href="/buoi-tap/tao" variant="accent" size="md">
            <Plus className="size-4" strokeWidth={2.5} />
            Tạo lịch
          </LinkButton>
        }
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
        <div className="grid gap-3 lg:grid-cols-2">
          {sessions.map((session, i) => {
            const going = session.attendees.filter((a) => a.status === "going");
            const isGoing = going.some((a) => a.userId === profile.id);
            const sport = SPORTS[session.sport as SportKey];
            const isFull =
              session.maxPlayers !== null && going.length >= session.maxPlayers;

            return (
              <div
                key={session.id}
                className="animate-rise"
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                <Card interactive className="overflow-hidden">
                  <Link
                    href={`/buoi-tap/${session.id}`}
                    className="group relative block p-4 sm:p-[18px]"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-0 left-0 w-[3px]",
                        isGoing ? "bg-gold-400" : "bg-ink-700",
                      )}
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="slate">
                        {sport.icon} {sport.label}
                      </Badge>
                      {isGoing && <Badge tone="lime">Bạn có đi</Badge>}
                      {isFull && <Badge tone="rose">Đã đủ người</Badge>}
                      <span className="ml-auto text-[11px] font-semibold text-gold-700">
                        {timeUntil(session.startsAt)}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-[17px] leading-snug font-bold text-ink-100 transition-colors group-hover:text-navy-700">
                      {session.title}
                    </h3>

                    <dl className="mt-3 space-y-1.5 text-[13.5px] text-ink-400">
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">Thời gian</dt>
                        <CalendarDays
                          className="size-4 shrink-0 text-ink-500"
                          aria-hidden
                        />
                        <dd>{formatDateTime(session.startsAt)}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">Địa điểm</dt>
                        <MapPin
                          className="size-4 shrink-0 text-ink-500"
                          aria-hidden
                        />
                        <dd className="truncate">{session.venueName}</dd>
                      </div>
                      {session.costTotal !== null && (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">Tiền sân</dt>
                          <Wallet
                            className="size-4 shrink-0 text-ink-500"
                            aria-hidden
                          />
                          <dd>
                            {formatVnd(session.costTotal)}
                            {going.length > 0 && (
                              <span className="text-ink-500">
                                {" "}
                                · ~
                                {formatVnd(
                                  Math.round(session.costTotal / going.length),
                                )}
                                /người
                              </span>
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-ink-800 pt-3">
                      <AvatarStack
                        people={going.map((a) => ({
                          id: a.userId,
                          fullName: a.user.fullName,
                          avatarUrl: a.user.avatarUrl,
                        }))}
                      />
                      <span className="tabular flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-ink-200">
                        <Users className="size-4 text-ink-500" aria-hidden />
                        {going.length}
                        {session.maxPlayers ? `/${session.maxPlayers}` : ""}
                      </span>
                    </div>
                  </Link>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
