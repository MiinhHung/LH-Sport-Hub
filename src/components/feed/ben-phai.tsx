import Image from "next/image";
import Link from "next/link";

import { StakeIcon } from "@/components/domain-icons";
import { ONgay } from "@/components/session-row";
import { CoverArt } from "@/components/handbook/cover-art";
import {
  ArrowRight,
  BookOpen,
  Clock,
  MapPin,
  Plus,
  Swords,
  Users,
} from "@/components/icons";
import { AvatarStack, Card } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { formatStake, type StakeKey } from "@/lib/constants";
import { ARTICLES } from "@/content/cam-nang";
import type { listChallenges, listUpcomingSessions } from "@/lib/queries";
import { formatTime, timeUntil } from "@/lib/utils";

export type Sessions = Awaited<ReturnType<typeof listUpcomingSessions>>;
export type Challenges = Awaited<ReturnType<typeof listChallenges>>;

/* ------------------------------------------------------------------ */
/* Mảnh dùng chung của cột phải                                        */
/* ------------------------------------------------------------------ */

function RailSection({
  id,
  title,
  href,
  icon,
  children,
}: {
  id: string;
  title: string;
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
          <div className="flex items-center gap-2">
            {icon}
            <h2 id={id} className="text-[15px] font-semibold text-ink-100">
              {title}
            </h2>
          </div>
          <Link
            href={href}
            prefetch={false}
            className="group inline-flex items-center gap-1 text-[13px] font-semibold text-gold-700 transition-colors hover:underline dark:text-gold-300"
          >
            <span>Tất cả</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div>{children}</div>
      </Card>
    </section>
  );
}

/** Ô trống của một mục ở cột phải: một câu, một nút. */
function RailEmpty({
  text,
  href,
  cta,
}: {
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="p-4 text-center">
      <p className="text-[13px] leading-relaxed text-ink-500">{text}</p>
      <LinkButton
        href={href}
        variant="secondary"
        size="sm"
        className="mt-3 w-full"
      >
        <Plus className="size-3.5" />
        <span>{cta}</span>
      </LinkButton>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cột phải                                                            */
/* ------------------------------------------------------------------ */

function SessionRows({ sessions }: { sessions: Sessions }) {
  return (
    <ul className="divide-y divide-ink-800">
      {sessions.map((s) => {
        const going = s.attendees.filter((a) => a.status === "going");
        return (
          <li key={s.id}>
            <Link
              href={`/buoi-tap/${s.id}`}
              className="group flex gap-3 p-3 transition-colors hover:bg-ink-850"
            >
              <ONgay ngay={s.startsAt} />
              <span className="min-w-0 flex-1 py-0.5">
                <span className="block truncate text-[13.5px] font-semibold text-ink-100 group-hover:text-gold-700 dark:group-hover:text-gold-300">
                  {s.title}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                  <Clock className="size-3 shrink-0" />
                  <span className="tabular">{formatTime(s.startsAt)}</span>
                  <span aria-hidden className="text-ink-600">
                    ·
                  </span>
                  <span className="truncate">{s.venueName}</span>
                </span>
                <span className="mt-2 flex items-center justify-between gap-2">
                  <AvatarStack
                    people={going.map((a) => ({
                      id: a.userId,
                      fullName: a.user.fullName,
                      avatarUrl: a.user.avatarUrl,
                    }))}
                    max={4}
                    size="xs"
                    showRest={false}
                  />
                  <span className="text-[12px] font-semibold text-gold-700 dark:text-gold-300">
                    {timeUntil(s.startsAt)}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ChallengeRows({ challenges }: { challenges: Challenges }) {
  return (
    <ul className="divide-y divide-ink-800">
      {challenges.map((c) => (
        <li key={c.id}>
          <Link
            href={`/keo/${c.id}`}
            className="group flex items-center gap-3 p-3 transition-colors hover:bg-ink-850"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300">
              <StakeIcon
                stake={c.stakeType as StakeKey}
                className="size-4"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-ink-100 group-hover:text-gold-700 dark:group-hover:text-gold-300">
                {c.title}
              </span>
              <span className="mt-0.5 block truncate text-[12.5px] text-ink-500">
                {formatStake(c.stakeType as StakeKey, c.stakeQty, c.stakeNote)}
                <span aria-hidden className="text-ink-600">
                  {" · "}
                </span>
                {c.creator.fullName}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SideRail({
  sessions,
  openChallenges,
}: {
  sessions: Sessions;
  openChallenges: Challenges;
}) {
  // eslint-disable-next-line react-hooks/purity
  const tip = ARTICLES[Math.floor(Date.now() / 86_400_000) % ARTICLES.length];

  return (
    <aside className="space-y-6 lg:sticky lg:top-20">
      <RailSection
        id="sap-toi"
        title="Sắp ra sân"
        href="/buoi-tap"
        icon={<Clock className="size-4 text-ink-500" />}
      >
        {sessions.length === 0 ? (
          <RailEmpty
            text="Chưa có lịch nào sắp tới. Ai đứng ra đặt sân đi?"
            href="/buoi-tap/tao"
            cta="Tạo lịch"
          />
        ) : (
          <SessionRows sessions={sessions} />
        )}
      </RailSection>

      <RailSection
        id="keo-mo"
        title="Kèo đang tìm đối"
        href="/keo"
        icon={<Swords className="size-4 text-ink-500" />}
      >
        {openChallenges.length === 0 ? (
          <RailEmpty
            text="Chưa ai thách ai hôm nay. Mở màn đi?"
            href="/keo/tao"
            cta="Tạo kèo"
          />
        ) : (
          <ChallengeRows challenges={openChallenges} />
        )}
      </RailSection>

      {/* Thống kê nhanh CLB */}
      <section aria-labelledby="thong-ke-rail">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
            <h2
              id="thong-ke-rail"
              className="flex items-center gap-2 text-[15px] font-semibold text-ink-100"
            >
              <Users className="size-4 text-ink-500" />
              <span>Hoạt động CLB</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
              Sôi nổi
            </span>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-ink-800 text-center">
            <div className="px-2 py-3.5">
              <dd className="tabular font-display text-[20px] leading-none text-ink-100">18</dd>
              <dt className="mt-1.5 text-[12.5px] font-medium text-ink-500">Thành viên</dt>
            </div>
            <div className="px-2 py-3.5">
              <dd className="tabular font-display text-[20px] leading-none text-ink-100">12</dd>
              <dt className="mt-1.5 text-[12.5px] font-medium text-ink-500">Kèo đã đấu</dt>
            </div>
            <div className="px-2 py-3.5">
              <dd className="tabular font-display text-[20px] leading-none text-ink-100">86%</dd>
              <dt className="mt-1.5 text-[12.5px] font-medium text-ink-500">Tham gia</dt>
            </div>
          </dl>
        </Card>
      </section>

      {/* Cẩm nang — mỗi ngày gợi một bài khác */}
      <section aria-labelledby="cam-nang-rail">
        <h2 id="cam-nang-rail" className="sr-only">
          Cẩm nang
        </h2>
        <Link
          href={`/cam-nang/${tip.slug}`}
          className="group block overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition-colors duration-200 hover:border-ink-700"
        >
          <div className="relative aspect-[16/9] overflow-hidden">
            {tip.cover ? (
              <Image
                src={tip.cover}
                alt=""
                fill
                sizes="320px"
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              />
            ) : tip.art ? (
              <CoverArt
                motif={tip.art}
                className="transition-transform duration-300 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="size-full bg-navy-900" />
            )}
          </div>
          <div className="p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
              <BookOpen className="size-3.5" />
              <span>Cẩm nang · {tip.category}</span>
            </p>
            <p className="mt-1 text-[14px] leading-snug font-semibold text-ink-100 transition-colors group-hover:text-gold-700 dark:group-hover:text-gold-300">
              {tip.title}
            </p>
          </div>
        </Link>
      </section>
    </aside>
  );
}

/**
 * Dải "Sắp ra sân" cho màn hẹp (Mobile).
 */
export function UpcomingStrip({ sessions }: { sessions: Sessions }) {
  if (sessions.length === 0) return null;
  return (
    <section aria-labelledby="sap-toi-hep" className="lg:hidden">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="sap-toi-hep" className="text-[15px] font-semibold text-ink-100">
          Sắp ra sân
        </h2>
        <Link
          href="/buoi-tap"
          prefetch={false}
          className="text-[13px] font-semibold text-gold-700 hover:underline dark:text-gold-300"
        >
          Tất cả
        </Link>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        {sessions.map((s) => (
          <li key={s.id} className="w-[260px] shrink-0 snap-start">
            <Link
              href={`/buoi-tap/${s.id}`}
              className="flex h-full gap-3 rounded-xl border border-ink-800 bg-ink-900 p-3 transition-colors hover:border-ink-700 active:scale-[0.99]"
            >
              <ONgay ngay={s.startsAt} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink-100">
                  {s.title}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                  <Clock className="size-3.5 shrink-0" />
                  <span className="tabular">{formatTime(s.startsAt)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{s.venueName}</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
