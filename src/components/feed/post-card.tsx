import { CalendarDays, Link as LinkIcon, Pin, Swords } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LinkHoSo } from "@/components/thanh-vien/link-ho-so";
import { Avatar, Badge, Card } from "@/components/ui";
import { POST_TYPES, type PostTypeKey } from "@/lib/constants";
import type { FeedPost } from "@/lib/feed";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

import { LuoiAnh } from "./luoi-anh";
import { PostInteractions } from "./post-interactions";
import { PostMenu } from "./post-menu";

/**
 * Thẻ xem trước của một bài dạng link.
 *
 * NỘI DUNG LÀ BẢN CHỤP LÚC ĐĂNG, không đi lấy lại mỗi lần hiển thị. Lấy
 * lại nghĩa là mỗi người mở bảng tin lại bắn một yêu cầu sang trang của
 * người ta — vừa chậm, vừa hỏng hẳn khi trang kia chết. Bản chụp thì
 * vẫn đọc được cả khi bài gốc đã bị gỡ.
 *
 * Ảnh trỏ vào kho của mình nên `next/image` dùng được bình thường, và
 * `remotePatterns` vẫn khoá đúng một host. Xem
 * `supabase/06-bai-dang-link.sql`.
 *
 * `rel="noopener"` là bắt buộc với `target="_blank"`: thiếu nó thì trang
 * mở ra đọc được `window.opener` và đổi được địa chỉ tab gốc.
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
      className="group mt-3 flex overflow-hidden rounded-xl border border-ink-800 bg-ink-850 transition-colors hover:border-ink-700 hover:bg-ink-900"
    >
      {anh && (
        <span className="relative hidden w-40 shrink-0 self-stretch sm:block">
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
        <span className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">
          <LinkIcon className="size-3" aria-hidden />
          {mien}
        </span>
        <span className="mt-1.5 line-clamp-2 block text-[15px] leading-snug font-bold text-ink-100 transition-colors group-hover:text-link">
          {tieuDe ?? url}
        </span>
        {moTa && (
          <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-ink-500">
            {moTa}
          </span>
        )}
      </span>
    </a>
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

  return (
    <Card
      className={cn(
        "overflow-hidden",
        post.isPinned && "border-gold-200 dark:border-gold-400/30",
        isAnnouncement && "border-amber-200 dark:border-amber-400/30",
      )}
    >
      {post.isPinned && (
        <p className="flex items-center gap-1.5 border-b border-gold-200 dark:border-gold-400/30 bg-gold-50 dark:bg-gold-400/10 px-4 py-1.5 text-[11.5px] font-bold text-gold-700 dark:text-gold-300 sm:px-5">
          <Pin className="size-3.5" aria-hidden />
          Bài được ghim
        </p>
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
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] leading-tight font-bold text-ink-100">
              <LinkHoSo
                id={post.author.id}
                nguoiXem={viewer.id}
                ten={post.author.fullName}
                className="rounded hover:underline"
              >
                {post.author.fullName}
              </LinkHoSo>
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-ink-500">
              <time dateTime={post.createdAt.toISOString()}>
                {timeAgo(post.createdAt)}
              </time>
              {post.author.department && (
                <>
                  <span aria-hidden>·</span>
                  <span className="truncate">{post.author.department}</span>
                </>
              )}
              {post.type !== "text" && post.type !== "image" && (
                <Badge tone={isAnnouncement ? "amber" : "lime"}>
                  {type.icon} {type.label}
                </Badge>
              )}
            </div>
          </div>

          <PostMenu
            postId={post.id}
            isPinned={post.isPinned}
            canDelete={post.author.id === viewer.id || canModerate}
            canPin={canModerate}
          />
        </header>

        {/* Nội dung — render dạng văn bản thuần, không cho HTML của người dùng */}
        {/* Bài dạng link được phép không có lời dẫn — đừng chừa một thẻ
            `p` rỗng mang `mt-3`, nó đẩy thẻ link xuống một quãng vô cớ. */}
        {post.content.trim().length > 0 && (
          <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-ink-300">
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

        {/* Liên kết tới kèo / buổi tập nếu có */}
        {(post.challenge || post.session) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.challenge && (
              <Link
                href={`/keo/${post.challenge.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-800 bg-ink-850 px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-100 transition-colors hover:border-ink-700 hover:bg-ink-900"
              >
                <Swords
                  className="size-3.5 text-gold-700 dark:text-gold-300"
                  aria-hidden
                />
                {post.challenge.title}
              </Link>
            )}
            {post.session && (
              <Link
                href={`/buoi-tap/${post.session.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-800 bg-ink-850 px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-100 transition-colors hover:border-ink-700 hover:bg-ink-900"
              >
                <CalendarDays
                  className="size-3.5 text-gold-700 dark:text-gold-300"
                  aria-hidden
                />
                {post.session.title}
                <span className="font-normal text-ink-500">
                  {formatDateTime(post.session.startsAt)}
                </span>
              </Link>
            )}
          </div>
        )}

        <div className="h-3" />
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
