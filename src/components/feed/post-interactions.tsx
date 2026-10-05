"use client";

import { MessageCircle, Send, SmilePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  createCommentAction,
  deleteCommentAction,
  toggleReactionAction,
} from "@/actions/posts";
import { idleState } from "@/actions/types";
import { Avatar } from "@/components/ui";
import { useHoiLai } from "@/components/ui/hoi-lai";
import {
  LIMITS,
  REACTIONS,
  REACTION_KEYS,
  type ReactionKey,
} from "@/lib/constants";
import type { FeedComment, ReactionSummary } from "@/lib/feed";
import { cn, timeAgo } from "@/lib/utils";

type Viewer = { id: string; fullName: string; avatarUrl: string | null };

/** Tính lại bảng cảm xúc ngay trên máy để bấm là thấy đổi, không chờ server. */
function applyToggle(
  summary: ReactionSummary,
  type: ReactionKey,
): ReactionSummary {
  const counts = new Map(summary.counts.map((c) => [c.type, c.count]));
  let total = summary.total;
  let mine: ReactionKey | null = summary.mine;

  if (summary.mine === type) {
    counts.set(type, (counts.get(type) ?? 1) - 1);
    total -= 1;
    mine = null;
  } else if (summary.mine) {
    counts.set(summary.mine, (counts.get(summary.mine) ?? 1) - 1);
    counts.set(type, (counts.get(type) ?? 0) + 1);
    mine = type;
  } else {
    counts.set(type, (counts.get(type) ?? 0) + 1);
    total += 1;
    mine = type;
  }

  return {
    counts: [...counts.entries()]
      .filter(([, n]) => n > 0)
      .map(([t, count]) => ({ type: t, count }))
      .sort((a, b) => b.count - a.count),
    total: Math.max(0, total),
    mine,
  };
}

/* ------------------------------------------------------------------ */
/* Nút cảm xúc                                                         */
/* ------------------------------------------------------------------ */

/**
 * Ba cảm xúc bày sẵn. Chọn theo thứ tự hay dùng của một nhóm thể thao:
 * thích, cháy (đánh hay), haha (chọc nhau). Ba cái còn lại — thương,
 * vỗ tay, buồn — vẫn ở trong bảng chọn.
 */
const NHANH: ReactionKey[] = ["like", "fire", "haha"];

function ReactionControl({
  targetType,
  targetId,
  initial,
  compact,
}: {
  targetType: "post" | "comment";
  targetId: string;
  initial: ReactionSummary;
  compact?: boolean;
}) {
  const [summary, setSummary] = useState(initial);
  const [picking, setPicking] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Dữ liệu mới từ server (sau revalidate) thì lấy làm chuẩn.
  useEffect(() => setSummary(initial), [initial]);

  useEffect(() => {
    if (!picking) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPicking(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [picking]);

  function toggle(type: ReactionKey) {
    setPicking(false);
    setSummary((current) => applyToggle(current, type));

    const fd = new FormData();
    fd.set("targetType", targetType);
    fd.set("targetId", targetId);
    fd.set("type", type);

    startTransition(async () => {
      const result = await toggleReactionAction(idleState, fd);
      // Thất bại thì trả lại trạng thái cũ để không hiện sai.
      if (result.status === "error") setSummary(initial);
    });
  }

  const mine = summary.mine;

  return (
    <div className="relative flex items-center gap-1.5" ref={ref}>
      {/*
        BA CẢM XÚC HAY DÙNG NHẤT HIỆN THẲNG RA, KHÔNG GIẤU SAU MỘT CÚ BẤM.

        Bản trước ở trạng thái nghỉ chỉ là một icon mặt cười xám cạnh chữ
        "Cảm xúc". Chụp bảng tin thật thì hàng đó đọc ra một thanh trống
        huơ: hai mẩu chữ xám hai đầu, ở giữa không có gì. Và muốn thả tim
        thì phải bấm hai lần — mở bảng chọn rồi mới chọn.

        Giờ ba cái hay dùng nhất nằm sẵn, một chạm là xong. Ba cái còn
        lại vẫn ở sau dấu cộng, vì bày cả sáu ra thì hàng này lại đi quá
        xa về phía ồn ào.

        Ở bình luận (`compact`) thì giữ nguyên một nút: dòng bình luận
        hẹp, nhét ba nút vào sẽ chen mất chỗ của chính câu bình luận.
      */}
      {!compact && !mine && (
        <div className="flex items-center gap-0.5">
          {NHANH.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              title={REACTIONS[key].label}
              aria-label={`Thả ${REACTIONS[key].label}`}
              className="grid size-8 place-items-center rounded-lg text-[17px] leading-none transition-transform duration-150 hover:scale-125 hover:bg-ink-850"
            >
              {REACTIONS[key].icon}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => (mine ? toggle(mine) : setPicking((v) => !v))}
        onContextMenu={(e) => {
          e.preventDefault();
          setPicking((v) => !v);
        }}
        aria-label={mine ? `Bỏ ${REACTIONS[mine].label}` : "Thêm cảm xúc khác"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors",
          compact ? "px-1.5 py-0.5 text-[11.5px]" : "px-2 py-1.5 text-[12.5px]",
          mine
            ? "text-gold-700 dark:text-gold-300 hover:bg-gold-50 dark:hover:bg-gold-400/10"
            : "text-ink-500 hover:bg-ink-850 hover:text-ink-300",
        )}
      >
        {mine ? (
          <span className="text-[15px] leading-none">
            {REACTIONS[mine].icon}
          </span>
        ) : (
          <SmilePlus className={compact ? "size-3.5" : "size-4"} />
        )}
        {mine ? REACTIONS[mine].label : compact ? "Cảm xúc" : null}
      </button>

      {/* Tổng hợp cảm xúc đã có */}
      {summary.total > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[12px] text-ink-500">
          {summary.counts.slice(0, 3).map((c) => (
            <span key={c.type} title={`${REACTIONS[c.type].label}: ${c.count}`}>
              {REACTIONS[c.type].icon}
            </span>
          ))}
          <span className="tabular ml-0.5 font-semibold">{summary.total}</span>
        </span>
      )}

      {picking && (
        <div className="animate-rise absolute bottom-full left-0 z-20 mb-1.5 flex gap-0.5 rounded-xl border border-ink-800 bg-ink-900 p-1.5 shadow-[var(--shadow-pop)]">
          {REACTION_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              title={REACTIONS[key].label}
              aria-label={REACTIONS[key].label}
              className="grid size-9 place-items-center rounded-lg text-xl transition-transform duration-150 hover:scale-125 hover:bg-ink-850"
            >
              {REACTIONS[key].icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Một bình luận                                                       */
/* ------------------------------------------------------------------ */

function CommentRow({
  comment,
  viewer,
  canModerate,
}: {
  comment: FeedComment;
  viewer: Viewer;
  canModerate: boolean;
}) {
  const [removed, setRemoved] = useState(false);
  const [, startTransition] = useTransition();
  const { hoi, hopThoai } = useHoiLai();

  if (removed) return null;

  const canDelete = comment.author.id === viewer.id || canModerate;

  async function remove() {
    const ok = await hoi({
      tieuDe: "Xoá bình luận này?",
      moTa: "Bình luận sẽ biến mất khỏi bài viết và không lấy lại được.",
      nguyHiem: true,
    });
    if (!ok) return;
    setRemoved(true);
    const fd = new FormData();
    fd.set("commentId", comment.id);
    startTransition(async () => {
      const result = await deleteCommentAction(idleState, fd);
      if (result.status === "error") setRemoved(false);
    });
  }

  return (
    <li className="group flex gap-2.5">
      {hopThoai}
      <Avatar
        name={comment.author.fullName}
        src={comment.author.avatarUrl}
        seed={comment.author.id}
        size="sm"
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-2xl rounded-tl-md bg-ink-850 px-3.5 py-2">
          <p className="text-[13px] font-bold text-ink-100">
            {comment.author.fullName}
          </p>
          <p className="mt-0.5 text-[14px] leading-relaxed break-words whitespace-pre-wrap text-ink-300">
            {comment.content}
          </p>
        </div>

        <div className="mt-0.5 flex items-center gap-1 pl-1">
          <time
            className="text-[11px] text-ink-500"
            dateTime={comment.createdAt.toISOString()}
          >
            {timeAgo(comment.createdAt)}
          </time>
          <ReactionControl
            targetType="comment"
            targetId={comment.id}
            initial={comment.reactions}
            compact
          />
          {canDelete && (
            <button
              type="button"
              onClick={remove}
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-ink-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-600 dark:text-rose-400 focus-visible:opacity-100"
            >
              <Trash2 className="size-3" />
              <span className="sr-only">Xoá bình luận</span>
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Khu tương tác của một bài                                           */
/* ------------------------------------------------------------------ */

export function PostInteractions({
  postId,
  reactions,
  comments,
  viewer,
  canModerate,
}: {
  postId: string;
  reactions: ReactionSummary;
  comments: FeedComment[];
  viewer: Viewer;
  canModerate: boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  /*
   * Ô bình luận CHỈ MỞ SẴN KHI ĐÃ CÓ BÌNH LUẬN.
   *
   * Bản trước luôn dựng cả khối: avatar, ô nhập, nút gửi — kể cả ở bài
   * chưa ai bình luận. Mỗi bài tốn thêm chừng 80px cho một ô trống,
   * nên cuộn bảng tin ra cảm giác lướt qua một chồng biểu mẫu chứ không
   * phải đọc tin của đội.
   *
   * Bài đã có bình luận thì vẫn mở sẵn, vì ở đó ô nhập nằm ngay dưới
   * mấy câu đang đọc — đúng chỗ người ta muốn trả lời.
   */
  const [moBinhLuan, setMoBinhLuan] = useState(comments.length > 0);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const visible = showAll ? comments : comments.slice(-3);
  const hidden = comments.length - visible.length;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setError(null);
    setDraft("");

    const fd = new FormData();
    fd.set("postId", postId);
    fd.set("content", content);

    startTransition(async () => {
      const result = await createCommentAction(idleState, fd);
      if (result.status === "error") {
        setError(result.message ?? "Không gửi được bình luận.");
        setDraft(content);
      }
    });
  }

  return (
    <div className="border-t border-ink-800">
      {/* Thanh hành động */}
      <div className="flex items-center gap-1 px-4 py-2 sm:px-5">
        <ReactionControl
          targetType="post"
          targetId={postId}
          initial={reactions}
        />
        <button
          type="button"
          onClick={() => setMoBinhLuan((v) => !v)}
          aria-expanded={moBinhLuan}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-200"
        >
          <MessageCircle className="size-4" />
          {comments.length > 0 ? (
            <>
              <span className="tabular">{comments.length}</span>
              <span className="hidden sm:inline">bình luận</span>
            </>
          ) : (
            "Bình luận"
          )}
        </button>
      </div>

      {/* Bình luận */}
      {moBinhLuan && (
        <div className="space-y-3 border-t border-ink-800 bg-ink-850/40 px-4 py-3 sm:px-5">
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-[12.5px] font-bold text-link hover:underline"
            >
              Xem thêm {hidden} bình luận
            </button>
          )}

          {visible.length > 0 && (
            <ul className="space-y-3">
              {visible.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  viewer={viewer}
                  canModerate={canModerate}
                />
              ))}
            </ul>
          )}

          <form onSubmit={submit} className="flex items-start gap-2.5">
            <Avatar
              name={viewer.fullName}
              src={viewer.avatarUrl}
              seed={viewer.id}
              size="sm"
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter gửi, Shift+Enter xuống dòng — như mọi khung chat.
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  maxLength={LIMITS.commentContent}
                  placeholder="Viết bình luận…"
                  aria-label="Viết bình luận"
                  className="max-h-32 min-h-9 w-full resize-none rounded-2xl border border-ink-700 bg-ink-900 px-3.5 py-2 text-[14px] text-ink-200 outline-none transition-all placeholder:text-ink-500 hover:border-ink-600 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || pending}
                  aria-label="Gửi bình luận"
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-navy-900 text-white transition-all hover:bg-navy-800 active:translate-y-px disabled:opacity-35"
                >
                  <Send className="size-4" />
                </button>
              </div>
              {error && (
                <p className="mt-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
