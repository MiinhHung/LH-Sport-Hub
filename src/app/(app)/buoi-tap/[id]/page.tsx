import {
  ArrowLeft,
  CalendarDays,
  Info,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChallengeCard } from "@/components/challenge-card";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  EmptyState,
  SectionTitle,
  Stat,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { SPORTS, type SportKey } from "@/lib/constants";
import { getSessionDetail } from "@/lib/queries";
import { formatDateTime, formatTime, formatVnd, timeUntil } from "@/lib/utils";

import { AttendanceButtons } from "./attendance";

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

  const perHead =
    session.costTotal !== null && going.length > 0
      ? Math.round(session.costTotal / going.length)
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/buoi-tap"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Lịch tập
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="slate">
            {sport.icon} {sport.label}
          </Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
          {session.status === "open" && (
            <span className="text-[11.5px] font-semibold text-gold-700">
              {timeUntil(session.startsAt)}
            </span>
          )}
        </div>

        <h1 className="font-display mt-3 text-[28px] leading-[1.15] font-bold text-ink-100 sm:text-[34px]">
          {session.title}
        </h1>
      </header>

      {session.status === "cancelled" && session.cancellationReason && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-[13px] font-bold text-rose-700">Buổi này đã huỷ</p>
          <p className="mt-0.5 text-[13.5px] text-rose-800/80">
            {session.cancellationReason}
          </p>
        </div>
      )}

      {/* Thông tin chính */}
      <Card>
        <CardBody className="space-y-4">
          <dl className="space-y-3.5 text-[14.5px]">
            <div className="flex items-start gap-3">
              <CalendarDays
                className="mt-0.5 size-[18px] shrink-0 text-ink-500"
                aria-hidden
              />
              <div>
                <dt className="sr-only">Thời gian</dt>
                <dd className="font-semibold text-ink-200">
                  {formatDateTime(session.startsAt)}
                </dd>
                <dd className="text-[13px] text-ink-500">
                  đến {formatTime(session.endsAt)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 size-[18px] shrink-0 text-ink-500"
                aria-hidden
              />
              <div>
                <dt className="sr-only">Địa điểm</dt>
                <dd className="font-semibold text-ink-200">
                  {session.venueName}
                </dd>
                {session.venueAddress && (
                  <dd className="text-[13px] text-ink-500">
                    {session.venueAddress}
                  </dd>
                )}
              </div>
            </div>

            {session.notes && (
              <div className="flex items-start gap-3">
                <Info
                  className="mt-0.5 size-[18px] shrink-0 text-ink-500"
                  aria-hidden
                />
                <div>
                  <dt className="sr-only">Ghi chú</dt>
                  <dd className="whitespace-pre-wrap text-ink-300">
                    {session.notes}
                  </dd>
                </div>
              </div>
            )}
          </dl>

          {session.status === "open" && (
            <div className="border-t border-ink-800 pt-4">
              <AttendanceButtons
                sessionId={session.id}
                isGoing={mine?.status === "going"}
                isNotGoing={mine?.status === "not_going"}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Số liệu nhanh */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Stat
          label="Đã nhận đi"
          value={
            session.maxPlayers
              ? `${going.length}/${session.maxPlayers}`
              : going.length
          }
          icon={<Users className="size-3.5" />}
          tone="navy"
        />
        {session.costTotal !== null && (
          <>
            <Stat
              label="Tiền sân"
              value={formatVnd(session.costTotal)}
              icon={<Wallet className="size-3.5" />}
              tone="lime"
            />
            <Stat
              label="Mỗi người"
              value={perHead === null ? "—" : formatVnd(perHead)}
              sub={perHead === null ? "chưa ai nhận đi" : "tạm tính"}
              tone="slate"
            />
          </>
        )}
      </div>

      {/* Danh sách người đi */}
      <section aria-labelledby="ds-di">
        <SectionTitle>
          <span id="ds-di">Người đi ({going.length})</span>
        </SectionTitle>

        {going.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" />}
            title="Chưa ai nhận đi"
            description="Bạn xung phong trước đi, có người đầu tiên là kiểu gì cũng có người theo."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {going.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-900 p-3 shadow-[var(--shadow-soft)]"
              >
                <Avatar
                  name={a.user.fullName}
                  src={a.user.avatarUrl}
                  seed={a.userId}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-ink-200">
                    {a.user.fullName}
                    {a.userId === session.creatorId && (
                      <span className="ml-1.5 text-[11px] font-semibold text-gold-700">
                        chủ kèo
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {a.user.department || "Thành viên"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {notGoing.length > 0 && (
          <p className="mt-3 text-[13px] text-ink-500">
            Không đi:{" "}
            <span className="text-ink-400">
              {notGoing.map((a) => a.user.fullName).join(", ")}
            </span>
          </p>
        )}
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
  );
}
