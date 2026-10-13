import type { Metadata } from "next";
import { SideRail, UpcomingStrip } from "@/components/feed/ben-phai";
import { FeedFilter, type FeedFilterKey } from "@/components/feed/feed-filter";
import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { CalendarDays, Swords } from "@/components/icons";
import { EmptyState, PageIntro } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { isModerator, requireProfile } from "@/lib/auth";
import { LIMITS } from "@/lib/constants";
import { listFeed } from "@/lib/feed";
import { listChallenges, listUpcomingSessions } from "@/lib/queries";

export const metadata: Metadata = { title: "Bảng tin" };

/* ------------------------------------------------------------------ */
/* Trang Bảng tin                                                     */
/* ------------------------------------------------------------------ */

const MOI_LAN = LIMITS.feedPageSize;
const TOI_DA = 300;

function loiChao(): string {
  const gio = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: process.env.NEXT_PUBLIC_TIME_ZONE || "Asia/Ho_Chi_Minh",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  if (gio < 11) return "Chào buổi sáng";
  if (gio < 14) return "Chào buổi trưa";
  if (gio < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ bai?: string; loai?: string }>;
}) {
  const profile = await requireProfile();

  const { bai, loai } = await searchParams;
  const xin = Number.parseInt(bai ?? "", 10);
  const soBai = Math.min(
    Number.isFinite(xin) && xin > 0 ? xin : MOI_LAN,
    TOI_DA,
  );

  // Ba truy vấn độc lập, chạy song song
  const [{ items, hasMore }, sessions, openChallenges] = await Promise.all([
    listFeed({ viewerId: profile.id, limit: soBai }),
    listUpcomingSessions(3),
    listChallenges({ tab: "open", userId: profile.id, limit: 3 }),
  ]);

  const viewer = {
    id: profile.id,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
  };
  const canModerate = isModerator(profile);
  const tenGoi = profile.fullName.trim().split(/\s+/).at(-1) ?? "";

  // Lọc theo loại bài hiển thị
  const activeLoai = (loai as FeedFilterKey) || "all";
  const displayedItems = items.filter((post) => {
    if (activeLoai === "keo") return Boolean(post.challenge);
    if (activeLoai === "tim-nguoi") return post.type === "looking_for_player";
    if (activeLoai === "thong-bao") return post.type === "announcement";
    return true;
  });

  return (
    <div className="space-y-6">
      <PageIntro
        title={`${loiChao()}, ${tenGoi}`}
        lead="Tin tức, thách đấu và những khoảnh khắc ra sân của Light Human Sport Hub hôm nay."
        action={
          <div className="flex gap-2">
            <LinkButton href="/buoi-tap/tao" variant="secondary">
              <CalendarDays className="size-4" />
              <span>Lên lịch</span>
            </LinkButton>
            <LinkButton href="/keo/tao" variant="accent">
              <Swords className="size-4" />
              <span>Tạo kèo</span>
            </LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <UpcomingStrip sessions={sessions} />

          <PostComposer author={viewer} canAnnounce={canModerate} />

          <FeedFilter
            activeKey={activeLoai}
            baseQuery={{ bai: bai ?? "" }}
          />

          {displayedItems.length === 0 ? (
            <EmptyState
              icon={<Swords className="size-5" />}
              title={
                activeLoai === "all"
                  ? "Bảng tin còn trống"
                  : "Không có bài viết nào trong mục này"
              }
              description={
                activeLoai === "all"
                  ? "Đăng bài đầu tiên đi. Khoe ảnh buổi đánh hôm trước cũng được."
                  : "Chưa có bài viết phù hợp với bộ lọc đã chọn. Hãy thử chọn mục khác hoặc đăng bài mới."
              }
            />
          ) : (
            <div className="space-y-3">
              {displayedItems.map((post, i) => (
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

          {hasMore && soBai < TOI_DA && activeLoai === "all" && (
            <div className="pt-1 text-center">
              <LinkButton
                href={`?bai=${Math.min(soBai + MOI_LAN, TOI_DA)}`}
                variant="secondary"
                scroll={false}
              >
                Xem thêm bài cũ
              </LinkButton>
            </div>
          )}

          {items.length > 0 && !hasMore && activeLoai === "all" && (
            <p className="flex items-center gap-3 pt-2 text-[12.5px] text-ink-500">
              <span aria-hidden className="h-px flex-1 bg-ink-800" />
              <span>Bạn đã xem hết bảng tin</span>
              <span aria-hidden className="h-px flex-1 bg-ink-800" />
            </p>
          )}

          {hasMore && soBai >= TOI_DA && activeLoai === "all" && (
            <p className="pt-2 text-center text-[12.5px] text-ink-500">
              Đang hiện {TOI_DA} bài mới nhất.
            </p>
          )}
        </div>

        {/* Cột phải */}
        <div className="hidden lg:block">
          <SideRail sessions={sessions} openChallenges={openChallenges} />
        </div>
      </div>
    </div>
  );
}
