import {
  BookOpen,
  CalendarDays,
  MapPin,
  MessageSquare,
  Plus,
  Swords,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CoverArt } from "@/components/handbook/cover-art";
import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import {
  AvatarStack,
  Badge,
  Card,
  EmptyState,
  PageIntro,
  SectionTitle,
} from "@/components/ui";
import { BeamRing, TiltWrap } from "@/components/ui/beam-frame";
import { LinkButton } from "@/components/ui/button";
import { isModerator, requireProfile } from "@/lib/auth";
import { STAKES, formatStake, type StakeKey } from "@/lib/constants";
import { ARTICLES } from "@/content/cam-nang";
import { listFeed } from "@/lib/feed";
import { listChallenges, listUpcomingSessions } from "@/lib/queries";
import { formatDateTime, timeUntil } from "@/lib/utils";

export const metadata: Metadata = { title: "Bảng tin" };

/* ------------------------------------------------------------------ */
/* Cột phải                                                            */
/* ------------------------------------------------------------------ */

async function SideRail({ viewerId }: { viewerId: string }) {
  // Đổi bài gợi ý theo ngày, khỏi lúc nào cũng thấy đúng một bài.
  const tip =
    ARTICLES[
      Math.floor(Date.now() / 86_400_000) % ARTICLES.length
    ];

  const [sessions, openChallenges] = await Promise.all([
    listUpcomingSessions(2),
    listChallenges({ tab: "open", userId: viewerId, limit: 3 }),
  ]);

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      {/* Buổi tập sắp tới */}
      <section aria-labelledby="sap-toi">
        <SectionTitle
          action={
            <Link
              href="/buoi-tap"
              className="text-[12px] font-bold text-link hover:underline"
            >
              Tất cả
            </Link>
          }
        >
          <CalendarDays className="size-4 text-gold-500" aria-hidden />
          <span id="sap-toi">Sắp ra sân</span>
        </SectionTitle>

        {sessions.length === 0 ? (
          <Card className="p-4">
            <p className="text-[13px] text-ink-500">
              Chưa có lịch nào. Ai đứng ra đặt sân đi?
            </p>
            <LinkButton
              href="/buoi-tap/tao"
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
            >
              <Plus className="size-3.5" />
              Tạo lịch
            </LinkButton>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const going = s.attendees.filter((a) => a.status === "going");
              return (
                <TiltWrap key={s.id}>
                <Card interactive className="overflow-hidden">
                  <Link
                    href={`/buoi-tap/${s.id}`}
                    className="relative block p-3.5"
                  >
                    <BeamRing />
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] leading-snug font-bold text-ink-100">
                        {s.title}
                      </p>
                      <span className="shrink-0 text-[11px] font-bold text-gold-700 dark:text-gold-300">
                        {timeUntil(s.startsAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-500">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {formatDateTime(s.startsAt)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-ink-500">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {s.venueName}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-ink-800 pt-2.5">
                      <AvatarStack
                        people={going.map((a) => ({
                          id: a.userId,
                          fullName: a.user.fullName,
                          avatarUrl: a.user.avatarUrl,
                        }))}
                        max={4}
                        size="xs"
                      />
                      <span className="tabular flex items-center gap-1 text-[12px] font-bold text-ink-300">
                        <Users className="size-3.5 text-ink-500" aria-hidden />
                        {going.length}
                      </span>
                    </div>
                  </Link>
                </Card>
                </TiltWrap>
              );
            })}
          </div>
        )}
      </section>

      {/* Kèo đang tìm đối */}
      <section aria-labelledby="keo-mo">
        <SectionTitle
          action={
            <Link
              href="/keo"
              className="text-[12px] font-bold text-link hover:underline"
            >
              Tất cả
            </Link>
          }
        >
          <Swords className="size-4 text-gold-500" aria-hidden />
          <span id="keo-mo">Kèo đang tìm đối</span>
        </SectionTitle>

        {openChallenges.length === 0 ? (
          <Card className="p-4">
            <p className="text-[13px] text-ink-500">
              Chưa ai thách ai. Mở màn đi?
            </p>
            <LinkButton
              href="/keo/tao"
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
            >
              <Plus className="size-3.5" />
              Tạo kèo
            </LinkButton>
          </Card>
        ) : (
          <div className="space-y-2">
            {openChallenges.map((c) => (
              <TiltWrap key={c.id}>
              <Card interactive className="overflow-hidden">
                <Link href={`/keo/${c.id}`} className="relative block p-3.5">
                  <BeamRing />
                  <p className="text-[14px] leading-snug font-bold text-ink-100">
                    {c.title}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-gold-700 dark:text-gold-300">
                    <span aria-hidden>
                      {STAKES[c.stakeType as StakeKey].icon}
                    </span>
                    {formatStake(
                      c.stakeType as StakeKey,
                      c.stakeQty,
                      c.stakeNote,
                    )}
                  </p>
                  <p className="mt-1 text-[11.5px] text-ink-500">
                    bởi {c.creator.fullName}
                  </p>
                </Link>
              </Card>
              </TiltWrap>
            ))}
          </div>
        )}
      </section>

      {/* Cẩm nang — mỗi lần mở trang gợi một bài khác nhau */}
      <section aria-labelledby="cam-nang-rail">
        <SectionTitle
          action={
            <Link
              href="/cam-nang"
              className="text-[12px] font-bold text-link hover:underline"
            >
              Tất cả
            </Link>
          }
        >
          <BookOpen className="size-4 text-gold-500" aria-hidden />
          <span id="cam-nang-rail">Cẩm nang</span>
        </SectionTitle>

        <Link
          href={`/cam-nang/${tip.slug}`}
          className="group block overflow-hidden rounded-2xl ring-1 ring-ink-800"
        >
          <div className="relative aspect-[16/9]">
            {tip.cover ? (
              <Image
                src={tip.cover}
                alt=""
                fill
                sizes="320px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : tip.art ? (
              <CoverArt
                motif={tip.art}
                className="transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="bg-gradient-navy size-full" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3.5">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-gold-300 uppercase">
                {tip.category}
              </p>
              <p className="font-display mt-1 text-[15px] leading-tight font-bold text-white">
                {tip.title}
              </p>
            </div>
          </div>
        </Link>
      </section>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Trang chủ                                                           */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  const profile = await requireProfile();
  const { items } = await listFeed({ viewerId: profile.id });

  const viewer = {
    id: profile.id,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
  };
  const canModerate = isModerator(profile);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Cộng đồng"
        title="Bảng tin"
        action={
          <div className="hidden gap-2 sm:flex">
            <LinkButton href="/keo/tao" variant="accent" size="md">
              <Swords className="size-4" strokeWidth={2.5} />
              Tạo kèo
            </LinkButton>
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Bảng tin */}
        <div className="min-w-0 space-y-4">
          <PostComposer author={viewer} canAnnounce={canModerate} />

          {items.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="size-5" />}
              title="Chưa có bài nào"
              description="Đăng bài đầu tiên đi — khoe ảnh buổi đánh hôm trước cũng được."
            />
          ) : (
            <div className="space-y-4">
              {items.map((post, i) => (
                <div
                  key={post.id}
                  className="animate-rise"
                  style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
                >
                  <PostCard
                    post={post}
                    viewer={viewer}
                    canModerate={canModerate}
                  />
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <p className="pt-2 text-center text-[12px] text-ink-500">
              Hết bài rồi. <Badge tone="slate">Mẹo</Badge> Enter để gửi bình
              luận, Shift+Enter để xuống dòng.
            </p>
          )}
        </div>

        {/* Cột phải — ẩn trên điện thoại cho đỡ rối */}
        <div className="hidden lg:block">
          <SideRail viewerId={profile.id} />
        </div>
      </div>
    </div>
  );
}
