import Image from "next/image";
import Link from "next/link";

import { PostTypeIcon } from "@/components/domain-icons";
import {
  CalendarDays,
  ChevronRight,
  Link as LinkIcon,
  Megaphone,
  Pin,
  Swords,
} from "@/components/icons";
import { LinkHoSo } from "@/components/thanh-vien/link-ho-so";
import { Avatar, Card } from "@/components/ui";
import { CHALLENGE_STATUS_META } from "@/lib/challenge-logic";
import { POST_TYPES, type PostTypeKey } from "@/lib/constants";
import type { FeedPost } from "@/lib/feed";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

import { LuoiAnh } from "./luoi-anh";
import { PostInteractions } from "./post-interactions";
import { PostMenu } from "./post-menu";

/**
 * Thẻ xem trước của một bài dạng link.
 */
function TheLink({
  url,
  tieuDe,
  moTa,
  anh,
  ten,
}: {
  url: string;
  tieuDe: string | null;
  moTa: string | null;
  anh: string | null;
  ten: string | null;
}) {
  let mien = ten;
  if (!mien) {
    try {
      mien = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      mien = url;
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-3.5 flex overflow-hidden rounded-xl border border-ink-800 bg-ink-850 transition-colors hover:border-ink-700"
    >
      {anh && (
        <span className="relative hidden w-36 shrink-0 self-stretch sm:block">
          <Image
            src={anh}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
          />
        </span>
      )}

      <span className="min-w-0 flex-1 p-3.5">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-500">
          <LinkIcon className="size-3" aria-hidden />
          <span>{mien}</span>
        </span>
        <span className="mt-1 line-clamp-2 block text-[14px] leading-snug font-semibold text-ink-100 transition-colors group-hover:text-gold-700 dark:group-hover:text-gold-300">
          {tieuDe ?? url}
        </span>
        {moTa && (
          <span className="mt-1 line-clamp-2 block text-[12.5px] leading-relaxed text-ink-500">
            {moTa}
          </span>
        )}
      </span>
    </a>
  );
}

/**
 * Thẻ đính kèm trỏ sang một kèo hay buổi tập.
 */
function TheDinhKem({
  href,
  icon,
  tieuDe,
  phu,
}: {
  href: string;
  icon: React.ReactNode;
  tieuDe: string;
  phu: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-850 p-2.5 pr-3 transition-colors hover:border-ink-700"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-white dark:bg-gold-400/10 dark:text-gold-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-ink-100 group-hover:text-gold-700 dark:group-hover:text-gold-300">
          {tieuDe}
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-ink-500">
          {phu}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-500 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function PostCard({
  post,
  viewer,
  canModerate,
}: {
  post: FeedPost;
  viewer: { id: string; fullName: string; avatarUrl: string | null };
  canModerate: boolean;
}) {
  const type = POST_TYPES[post.type as PostTypeKey];
  const isAnnouncement = post.type === "announcement";
  const coNhan =
    post.type !== "text" && post.type !== "image" && !isAnnouncement;

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isAnnouncement && "border-gold-300 dark:border-gold-400/40",
      )}
    >
      {/* Banner thông báo */}
      {isAnnouncement && (
        <div className="flex items-center gap-2 border-b border-gold-200 bg-gold-50 px-4 py-2 text-[12.5px] font-semibold text-gold-700 sm:px-5 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300">
          <Megaphone className="size-3.5" />
          <span>Thông báo từ ban điều hành</span>
        </div>
      )}

      <article className="px-4 pt-4 sm:px-5 sm:pt-5">
        {/* Tác giả */}
        <header className="flex items-start gap-3">
          <LinkHoSo
            id={post.author.id}
            nguoiXem={viewer.id}
            ten={post.author.fullName}
            className="shrink-0"
          >
            <Avatar
              name={post.author.fullName}
              src={post.author.avatarUrl}
              seed={post.author.id}
              size="md"
            />
          </LinkHoSo>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-[14.5px] leading-tight font-semibold text-ink-100">
              <LinkHoSo
                id={post.author.id}
                nguoiXem={viewer.id}
                ten={post.author.fullName}
                className="rounded hover:underline"
              >
                {post.author.fullName}
              </LinkHoSo>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] font-medium text-ink-500">
              <time dateTime={post.createdAt.toISOString()}>
                {timeAgo(post.createdAt)}
              </time>
              {post.author.department && (
                <>
                  <span aria-hidden className="text-ink-600">
                    ·
                  </span>
                  <span className="truncate">{post.author.department}</span>
                </>
              )}
              {coNhan && (
                <>
                  <span aria-hidden className="text-ink-600">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-gold-700 dark:text-gold-300">
                    <PostTypeIcon type={post.type as PostTypeKey} />
                    <span>{type?.label ?? post.type}</span>
                  </span>
                </>
              )}
              {post.isPinned && (
                <>
                  <span aria-hidden className="text-ink-600">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-gold-700 dark:text-gold-300">
                    <Pin weight="fill" className="size-3" />
                    <span>Đã ghim</span>
                  </span>
                </>
              )}
            </p>
          </div>

          <PostMenu
            postId={post.id}
            isPinned={post.isPinned}
            canDelete={post.author.id === viewer.id || canModerate}
            canPin={canModerate}
          />
        </header>

        {/* Nội dung bài viết */}
        {post.content.trim().length > 0 && (
          <p className="mt-3 text-[14.5px] leading-[1.65] break-words whitespace-pre-wrap text-ink-200">
            {post.content}
          </p>
        )}

        {post.linkUrl && (
          <TheLink
            url={post.linkUrl}
            tieuDe={post.linkTitle}
            moTa={post.linkDesc}
            anh={post.linkImage}
            ten={post.linkSite}
          />
        )}

        <LuoiAnh media={post.media} />

        {/* Đính kèm kèo hoặc buổi tập */}
        {(post.challenge || post.session) && (
          <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
            {post.challenge && (
              <TheDinhKem
                href={`/keo/${post.challenge.id}`}
                icon={<Swords className="size-4" />}
                tieuDe={post.challenge.title}
                phu={`Kèo · ${CHALLENGE_STATUS_META[post.challenge.status]?.label ?? "Chi tiết"}`}
              />
            )}
            {post.session && (
              <TheDinhKem
                href={`/buoi-tap/${post.session.id}`}
                icon={<CalendarDays className="size-4" />}
                tieuDe={post.session.title}
                phu={formatDateTime(post.session.startsAt)}
              />
            )}
          </div>
        )}

        <div className="h-3.5" />
      </article>

      <PostInteractions
        postId={post.id}
        reactions={post.reactions}
        comments={post.comments}
        viewer={viewer}
        canModerate={canModerate}
      />
    </Card>
  );
}
