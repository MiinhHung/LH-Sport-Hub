import { CalendarDays, Pin, Swords } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LinkHoSo } from "@/components/thanh-vien/link-ho-so";
import { Avatar, Badge, Card } from "@/components/ui";
import { POST_TYPES, type PostTypeKey } from "@/lib/constants";
import type { FeedPost } from "@/lib/feed";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

import { PostInteractions } from "./post-interactions";
import { PostMenu } from "./post-menu";

/** Bố cục lưới ảnh đổi theo số lượng, giống cách Facebook xếp. */
/**
 * Tỉ lệ khung cho MỘT ảnh, kẹp trong khoảng đọc được.
 *
 * Bản trước để `object-contain` trên nền xám với `max-h-[520px]`. Hai
 * hậu quả thấy ngay khi chụp màn hình bảng tin thật:
 *
 *  - Ảnh DỌC bị đóng khung: ảnh vừa theo chiều cao, còn hai bên là hai
 *    dải xám rộng. Nhìn như ảnh hỏng chứ không như ảnh được trình bày.
 *  - Một bài một ảnh chiếm hơn cả màn hình, nên cuộn bảng tin thành
 *    cuộn qua từng tấm ảnh một.
 *
 * Giờ dùng `object-cover` trong một khung có tỉ lệ TÍNH TỪ ảnh thật
 * (database có lưu width/height), rồi kẹp lại:
 *
 *   dọc nhất   4:5    (0.8)  — hơn nữa thì cắt bớt trên dưới
 *   ngang nhất 16:9   (1.78) — hơn nữa thì cắt bớt hai bên
 *
 * KÈM THÊM MỘT TRẦN CHIỀU CAO TUYỆT ĐỐI. Chỉ kẹp tỉ lệ là chưa đủ: cột
 * bảng tin rộng 735px, nên một ảnh 4:5 vẫn cao 919px — hơn cả màn hình
 * laptop. Đã đo sau lần sửa đầu và vẫn phải cuộn gần hai màn cho một
 * tấm ảnh. Trần 560px giữ cho mỗi bài gọn trong tầm mắt, và vì dùng
 * `object-cover` nên phần dư bị cắt chứ không đẻ ra dải xám.
 *
 * Ảnh nằm trong khoảng đó thì giữ nguyên tỉ lệ, không cắt một pixel nào.
 * Chỉ ảnh quá dọc hoặc quá ngang mới bị kẹp — và bấm vào vẫn mở ảnh gốc
 * đầy đủ.
 *
 * Không có width/height (ảnh cũ đăng trước khi lưu kích thước) thì mặc
 * định 4:5, vì ảnh chụp bằng điện thoại phần lớn là ảnh dọc.
 */
function tiLeAnh(w?: number | null, h?: number | null) {
  if (!w || !h) return 0.8;
  return Math.min(Math.max(w / h, 0.8), 16 / 9);
}

function MediaGrid({ media }: { media: FeedPost["media"] }) {
  if (media.length === 0) return null;

  const single = media.length === 1;
  const con = media.length - 4;

  return (
    <div
      className={cn(
        "mt-3 grid gap-1 overflow-hidden rounded-xl",
        media.length === 1 && "grid-cols-1",
        media.length >= 2 && "grid-cols-2",
      )}
    >
      {media.slice(0, 4).map((m, i) => (
        <a
          key={m.id}
          href={m.url}
          target="_blank"
          rel="noreferrer"
          aria-label="Mở ảnh cỡ đầy đủ"
          className={cn(
            "group relative block overflow-hidden bg-ink-850",
            // `w-full` BẮT BUỘC đi kèm `max-h`. Thiếu nó thì bề ngang là
            // "tự co", nên khi trần chiều cao cắt bớt, tỉ lệ kéo luôn bề
            // ngang xuống theo — đo được 448px trên một cột rộng 734px, tức
            // hai dải trống hai bên, đúng cái vừa sửa xong.
            single && "w-full max-h-[560px]",
            !single && "aspect-square",
            // Ba ảnh: tấm đầu cao gấp đôi, nằm trọn cột trái.
            media.length === 3 && i === 0 && "row-span-2 aspect-auto",
          )}
          style={
            single
              ? { aspectRatio: String(tiLeAnh(m.width, m.height)) }
              : undefined
          }
        >
          <Image
            src={m.url}
            alt={m.alt ?? "Ảnh trong bài viết"}
            fill
            sizes={single ? "(max-width: 768px) 100vw, 640px" : "320px"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />

          {/* Ảnh thứ tư của bài có hơn bốn ảnh: phủ mờ và báo còn mấy tấm */}
          {i === 3 && con > 0 && (
            <span className="absolute inset-0 grid place-items-center bg-navy-950/55 text-[22px] font-bold text-white">
              +{con}
            </span>
          )}
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
