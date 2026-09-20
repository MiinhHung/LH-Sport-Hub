import { CalendarDays, Pin, Swords } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Avatar, Badge, Card } from "@/components/ui";
import { POST_TYPES, type PostTypeKey } from "@/lib/constants";
import type { FeedPost } from "@/lib/feed";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

import { PostInteractions } from "./post-interactions";
import { PostMenu } from "./post-menu";

/** Bố cục lưới ảnh đổi theo số lượng, giống cách Facebook xếp. */
function MediaGrid({ media }: { media: FeedPost["media"] }) {
  if (media.length === 0) return null;

  const single = media.length === 1;

  return (
    <div
      className={cn(
        "mt-3 grid gap-1 overflow-hidden",
        media.length === 1 && "grid-cols-1",
        media.length === 2 && "grid-cols-2",
        media.length === 3 && "grid-cols-2",
        media.length >= 4 && "grid-cols-2",
      )}
    >
      {media.slice(0, 4).map((m, i) => (
        <a
          key={m.id}
          href={m.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "group relative block overflow-hidden bg-ink-850",
            single ? "max-h-[520px]" : "aspect-square",
            media.length === 3 && i === 0 && "row-span-2 aspect-auto",
          )}
        >
          <Image
            src={m.url}
            alt={m.alt ?? "Ảnh trong bài viết"}
            width={single ? 1200 : 600}
            height={single ? 900 : 600}
            sizes={single ? "(max-width: 768px) 100vw, 640px" : "320px"}
            className={cn(
              "h-full w-full transition-transform duration-500 group-hover:scale-[1.02]",
              single ? "object-contain" : "object-cover",
            )}
          />
        </a>
      ))}
    </div>
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
          <Avatar
            name={post.author.fullName}
            src={post.author.avatarUrl}
            seed={post.author.id}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] leading-tight font-bold text-ink-100">
              {post.author.fullName}
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
        <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-ink-300">
          {post.content}
        </p>

        <MediaGrid media={post.media} />

        {/* Liên kết tới kèo / buổi tập nếu có */}
        {(post.challenge || post.session) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.challenge && (
              <Link
                href={`/keo/${post.challenge.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-800 bg-ink-850 px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-100 transition-colors hover:border-ink-700 hover:bg-ink-900"
              >
                <Swords className="size-3.5 text-gold-600 dark:text-gold-300" aria-hidden />
                {post.challenge.title}
              </Link>
            )}
            {post.session && (
              <Link
                href={`/buoi-tap/${post.session.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-800 bg-ink-850 px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-100 transition-colors hover:border-ink-700 hover:bg-ink-900"
              >
                <CalendarDays className="size-3.5 text-gold-600 dark:text-gold-300" aria-hidden />
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
