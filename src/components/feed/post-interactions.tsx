"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  createCommentAction,
  deleteCommentAction,
  toggleReactionAction,
} from "@/actions/posts";
import { idleState } from "@/actions/types";
import { ReactionBadge } from "@/components/domain-icons";
import {
  MessageCircle,
  Send,
  SmilePlus,
  ThumbsUp,
  Trash2,
} from "@/components/icons";
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

/**
 * Trạng thái cảm xúc của một nội dung, cập nhật lạc quan.
 *
 * Tách thành hook vì ở bài viết, CON SỐ (dòng tổng hợp phía trên) và NÚT
 * BẤM (thanh hành động phía dưới) nằm ở hai chỗ khác nhau mà phải đổi
 * cùng một nhịp.
 */
function useReaction(
  targetType: "post" | "comment",
  targetId: string,
  initial: ReactionSummary,
) {
  const [summary, setSummary] = useState(initial);
  const [, startTransition] = useTransition();

  // Dữ liệu mới từ server (sau revalidate) thì lấy làm chuẩn. Đổi ngay
  // trong lúc dựng thay vì setState trong effect (đỡ một lần vẽ thừa).
  const [goc, setGoc] = useState(initial);
  if (goc !== initial) {
    setGoc(initial);
    setSummary(initial);
  }

  function toggle(type: ReactionKey) {
    // Giữ lại trạng thái NGAY TRƯỚC cú bấm này. Trả về `initial` (bản từ
    // server lúc tải trang) là sai khi người ta đã bấm vài lần rồi.
    const truoc = summary;
    setSummary(applyToggle(truoc, type));

    const fd = new FormData();
    fd.set("targetType", targetType);
    fd.set("targetId", targetId);
    fd.set("type", type);

    startTransition(async () => {
      try {
        const result = await toggleReactionAction(idleState, fd);
        // Thất bại thì trả lại trạng thái cũ để không hiện sai.
        if (result.status === "error") setSummary(truoc);
      } catch {
        // Mất mạng / server lỗi: cũng trả lại như cũ.
        setSummary(truoc);
      }
    });
  }

  return { summary, toggle };
}

/* ------------------------------------------------------------------ */
/* Bảng chọn cảm xúc                                                   */
/* ------------------------------------------------------------------ */

/**
 * Sáu huy hiệu nổi lên phía trên nút. Mở bằng: rê chuột chờ một nhịp,
 * nhấn giữ / chuột phải, hoặc nút mặt cười riêng (cho bàn phím và cho ai
 * không biết hai cách kia).
 */
function usePicker() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hen = useRef(0);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(hen.current), []);

  /** Chỉ chuột mới mở bằng rê — trên cảm ứng "rê" là cú chạm đầu tiên. */
  const hover = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      window.clearTimeout(hen.current);
      hen.current = window.setTimeout(() => setOpen(true), 450);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      window.clearTimeout(hen.current);
      hen.current = window.setTimeout(() => setOpen(false), 300);
    },
  };

  return { open, setOpen, ref, hover };
}

function ReactionPicker({
  mine,
  onPick,
  className,
}: {
  mine: ReactionKey | null;
  onPick: (k: ReactionKey) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Chọn cảm xúc"
      className={cn(
        "animate-rise absolute bottom-full z-20 mb-2 flex gap-1 rounded-full border border-ink-800 bg-ink-900 p-1.5 shadow-[var(--shadow-pop)]",
        className,
      )}
    >
      {REACTION_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onPick(key)}
          aria-label={REACTIONS[key].label}
          aria-pressed={mine === key}
          className="group/r relative grid place-items-center rounded-full p-0.5 transition-transform duration-150 ease-out hover:-translate-y-1 hover:scale-110 focus-visible:-translate-y-1"
        >
          <ReactionBadge reaction={key} size="lg" />
          <span
            aria-hidden
            className="pointer-events-none absolute -top-7 rounded-lg bg-navy-900 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 transition-opacity group-hover/r:opacity-100"
          >
            {REACTIONS[key].label}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Ba huy hiệu đầu chồng lên nhau, kèm tổng số. */
function ReactionSummaryChip({ summary }: { summary: ReactionSummary }) {
  if (summary.total === 0) return null;
  const ten = summary.counts
    .map((c) => `${REACTIONS[c.type].label}: ${c.count}`)
    .join(", ");
  return (
    <span className="inline-flex items-center gap-1.5" title={ten}>
      <span className="flex -space-x-1">
        {summary.counts.slice(0, 3).map((c) => (
          <ReactionBadge
            key={c.type}
            reaction={c.type}
            size="sm"
            className="ring-2 ring-ink-900"
          />
        ))}
      </span>
      <span className="tabular">{summary.total}</span>
      <span className="sr-only">cảm xúc ({ten})</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Một bình luận                                                       */
/* ------------------------------------------------------------------ */

function CommentRow({
  comment,
  viewer,
  canModerate,
  onTraLoi,
  nho,
}: {
  comment: FeedComment;
  viewer: Viewer;
  canModerate: boolean;
  /** Bấm "Trả lời" dưới bình luận này. */
  onTraLoi: () => void;
  /** Câu trả lời: avatar nhỏ hơn, nằm thụt trong chuỗi. */
  nho?: boolean;
}) {
  const [removed, setRemoved] = useState(false);
  const [, startTransition] = useTransition();
  const { hoi, hopThoai } = useHoiLai();
  const { summary, toggle } = useReaction(
    "comment",
    comment.id,
    comment.reactions,
  );
  const {
    open: chonMo,
    setOpen: datChon,
    ref: chonRef,
    hover: reChon,
  } = usePicker();

  if (removed) return null;

  const canDelete = comment.author.id === viewer.id || canModerate;
  const mine = summary.mine;

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
      try {
        const result = await deleteCommentAction(idleState, fd);
        if (result.status === "error") setRemoved(false);
      } catch {
        // Lỗi mạng: hiện lại bình luận, vì thật ra nó chưa bị xoá.
        setRemoved(false);
      }
    });
  }

  return (
    <li className="group flex gap-2.5">
      {hopThoai}
      <Avatar
        name={comment.author.fullName}
        src={comment.author.avatarUrl}
        seed={comment.author.id}
        size={nho ? "xs" : "sm"}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="relative inline-block max-w-full rounded-2xl bg-ink-850 px-3.5 py-2">
          <p className="text-[13px] font-semibold text-ink-100">
            {comment.author.fullName}
          </p>
          <p className="mt-0.5 text-[14px] leading-relaxed break-words whitespace-pre-wrap text-ink-300">
            {comment.content}
          </p>
        </div>

        <div className="mt-1 flex items-center gap-3 pl-1 text-[12.5px]">
          <time
            className="text-ink-500"
            dateTime={comment.createdAt.toISOString()}
            // "x phút trước" tính lúc dựng: máy chủ và trình duyệt lệch
            // nhau vài giây là đủ khác chữ, đừng báo lỗi hydrate.
            suppressHydrationWarning
          >
            {timeAgo(comment.createdAt)}
          </time>

          <div ref={chonRef} className="relative" {...reChon}>
            <button
              type="button"
              onClick={() => toggle(mine ?? "like")}
              onContextMenu={(e) => {
                e.preventDefault();
                datChon(true);
              }}
              aria-label={
                mine ? `Bỏ ${REACTIONS[mine].label}` : "Thích bình luận"
              }
              className={cn(
                "font-semibold transition-colors pointer-coarse:min-h-8",
                mine
                  ? "text-gold-700 dark:text-gold-300"
                  : "text-ink-500 hover:text-ink-200",
              )}
            >
              {mine ? REACTIONS[mine].label : "Thích"}
            </button>
            {chonMo && (
              <ReactionPicker
                mine={mine}
                className="left-0"
                onPick={(k) => {
                  datChon(false);
                  toggle(k);
                }}
              />
            )}
          </div>

          <button
            type="button"
            onClick={onTraLoi}
            className="font-semibold text-ink-500 transition-colors hover:text-ink-200 pointer-coarse:min-h-8"
          >
            Trả lời
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={remove}
              /* Hiện sẵn trên màn cảm ứng: không có `:hover` thì nút xoá
                 nằm đó mà không ai dùng điện thoại chạm tới được. Vùng
                 chạm nới lên 32px cho đầu ngón tay (WCAG 2.5.8). */
              className="inline-flex items-center gap-1 font-semibold text-ink-500 opacity-0 transition-opacity group-hover:opacity-100 pointer-coarse:min-h-8 pointer-coarse:opacity-100 hover:text-rose-600 focus-visible:opacity-100 dark:hover:text-rose-400"
            >
              <Trash2 className="size-3" />
              Xoá
            </button>
          )}

          {/* Tổng cảm xúc nằm cuối dòng phụ, không đè lên câu bình luận. */}
          {summary.total > 0 && (
            <span className="ml-auto text-[12.5px] font-semibold text-ink-500">
              <ReactionSummaryChip summary={summary} />
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Ô trả lời một bình luận                                             */
/* ------------------------------------------------------------------ */

/**
 * Ô nhập mở ngay dưới chuỗi bình luận đang được trả lời. Trả lời vào một
 * câu trả lời thì điền sẵn "@Tên " để biết đang đáp ai (máy chủ vẫn gắn
 * vào bình luận gốc — chỉ một tầng).
 */
function OTraLoi({
  postId,
  parentId,
  ten,
  nhacTen,
  viewer,
  onDong,
}: {
  postId: string;
  parentId: string;
  ten: string;
  /** Điền sẵn "@ten " vào ô (khi trả lời một câu trả lời). */
  nhacTen: boolean;
  viewer: Viewer;
  onDong: () => void;
}) {
  const [draft, setDraft] = useState(nhacTen ? `@${ten} ` : "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const oNhap = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = oNhap.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setError(null);

    const fd = new FormData();
    fd.set("postId", postId);
    fd.set("parentId", parentId);
    fd.set("content", content);

    startTransition(async () => {
      try {
        const result = await createCommentAction(idleState, fd);
        if (result.status === "error") {
          setError(result.message ?? "Không gửi được câu trả lời.");
          return;
        }
        onDong();
      } catch {
        setError("Không gửi được câu trả lời.");
      }
    });
  }

  return (
    <li>
      <form onSubmit={submit} className="flex items-start gap-2">
        <Avatar
          name={viewer.fullName}
          src={viewer.avatarUrl}
          seed={viewer.id}
          size="xs"
          className="mt-1.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-2 rounded-2xl border border-ink-700 bg-ink-900 py-1 pr-1 pl-3 transition-[border-color,box-shadow] focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/25">
            <textarea
              ref={oNhap}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
                if (e.key === "Escape") onDong();
              }}
              rows={1}
              maxLength={LIMITS.commentContent}
              placeholder={`Trả lời ${ten}…`}
              aria-label={`Trả lời ${ten}`}
              className="max-h-28 min-h-8 w-full resize-none bg-transparent py-1.5 text-[13.5px] text-ink-200 outline-none placeholder:text-ink-500"
            />
            <button
              type="submit"
              disabled={!draft.trim() || pending}
              aria-label="Gửi câu trả lời"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-900 text-white transition-[background-color,opacity,transform] hover:bg-navy-800 active:scale-95 disabled:opacity-30"
            >
              <Send className="size-3.5" />
            </button>
          </div>
          <p className="mt-1 flex items-center gap-2 text-[12px] text-ink-500">
            {error ? (
              <span className="font-medium text-rose-600 dark:text-rose-400">
                {error}
              </span>
            ) : (
              <span className="hidden sm:inline">Enter để gửi · Esc để huỷ</span>
            )}
            <button
              type="button"
              onClick={onDong}
              className="font-semibold hover:text-ink-200 sm:hidden"
            >
              Huỷ
            </button>
          </p>
        </div>
      </form>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Khu tương tác của một bài                                           */
/* ------------------------------------------------------------------ */

const NUT_HANH_DONG =
  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-[13.5px] font-semibold transition-colors active:scale-[0.98]";

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
  const { summary, toggle } = useReaction("post", postId, reactions);
  const {
    open: chonMo,
    setOpen: datChon,
    ref: chonRef,
    hover: reChon,
  } = usePicker();
  const oNhap = useRef<HTMLTextAreaElement>(null);

  /*
   * Ô bình luận CHỈ MỞ SẴN KHI ĐÃ CÓ BÌNH LUẬN.
   *
   * Luôn dựng cả khối (avatar, ô nhập, nút gửi) ở bài chưa ai bình luận
   * thì mỗi bài tốn thêm chừng 80px cho một ô trống, và cuộn bảng tin ra
   * cảm giác lướt qua một chồng biểu mẫu chứ không phải đọc tin của đội.
   */
  const [moBinhLuan, setMoBinhLuan] = useState(comments.length > 0);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /*
   * Gom thành chuỗi: bình luận gốc, mỗi cái kèm các câu trả lời của nó.
   * Câu trả lời mà bình luận gốc không có trong danh sách (đã xoá, hoặc
   * nằm ngoài phần đã tải) thì đứng như một bình luận thường.
   */
  const coMat = new Set(comments.map((c) => c.id));
  const goc = comments.filter((c) => !c.parentId || !coMat.has(c.parentId));
  const traLoiCua = new Map<string, FeedComment[]>();
  for (const c of comments) {
    if (c.parentId && coMat.has(c.parentId)) {
      traLoiCua.set(c.parentId, [...(traLoiCua.get(c.parentId) ?? []), c]);
    }
  }
  const chuoiHien = showAll ? goc : goc.slice(-3);
  const soDangHien = chuoiHien.reduce(
    (n, c) => n + 1 + (traLoiCua.get(c.id)?.length ?? 0),
    0,
  );
  const hidden = comments.length - soDangHien;
  const mine = summary.mine;

  /** Đang trả lời: chuỗi nào, người nào, có điền sẵn tên không. */
  const [traLoi, setTraLoi] = useState<{
    goc: string;
    dich: string;
    ten: string;
    nhacTen: boolean;
  } | null>(null);

  function batBinhLuan() {
    setMoBinhLuan(true);
    // Đợi ô nhập được dựng ra rồi mới đưa con trỏ vào.
    requestAnimationFrame(() => oNhap.current?.focus());
  }

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
      try {
        const result = await createCommentAction(idleState, fd);
        if (result.status === "error") {
          setError(result.message ?? "Không gửi được bình luận.");
          setDraft(content);
        }
      } catch {
        // Lỗi mạng: trả lại chữ đã gõ để khỏi mất.
        setError("Không gửi được bình luận.");
        setDraft(content);
      }
    });
  }

  return (
    <div>
      {/* Dòng tổng hợp — chỉ hiện khi có gì để nói */}
      {(summary.total > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between gap-3 px-4 pb-2.5 text-[12.5px] text-ink-500 sm:px-5">
          <ReactionSummaryChip summary={summary} />
          {comments.length > 0 && (
            <button
              type="button"
              onClick={() => setMoBinhLuan((v) => !v)}
              className="ml-auto hover:text-ink-200 hover:underline"
            >
              <span className="tabular">{comments.length}</span> bình luận
            </button>
          )}
        </div>
      )}

      {/* Thanh hành động */}
      <div className="flex items-center gap-1 border-t border-ink-800 px-2 py-1 sm:px-3">
        {/*
          NÚT CẢM XÚC LÀ MỘT CỤM, ĐỨNG GIỮA NỬA TRÁI. Bản trước nút chính
          giãn hết nửa trái (đẩy chữ vào giữa) còn nút mặt cười bị dạt ra
          sát vạch ngăn — hai thứ lệch nhau, nhìn như không dính gì tới
          nhau. Giờ cả hai nằm chung một viên, căn giữa, đối xứng với nút
          "Bình luận" bên phải.
        */}
        <div className="flex flex-1 justify-center">
          <div
            ref={chonRef}
            className="relative flex items-center rounded-lg transition-colors hover:bg-ink-850"
            {...reChon}
          >
            <button
              type="button"
              onClick={() => toggle(mine ?? "like")}
              onContextMenu={(e) => {
                e.preventDefault();
                datChon(true);
              }}
              aria-pressed={!!mine}
              aria-label={
                mine ? `Bỏ ${REACTIONS[mine].label}` : "Thích bài này"
              }
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-l-lg pr-2 pl-3.5 text-[13.5px] font-semibold transition-colors active:scale-[0.98]",
                mine
                  ? "text-gold-700 dark:text-gold-300"
                  : "text-ink-400 hover:text-ink-100",
              )}
            >
              {mine ? (
                <ReactionBadge reaction={mine} size="sm" />
              ) : (
                <ThumbsUp className="size-[18px]" />
              )}
              {mine ? REACTIONS[mine].label : "Thích"}
            </button>
            <span aria-hidden className="h-4 w-px bg-ink-700/70" />
            <button
              type="button"
              onClick={() => datChon((v) => !v)}
              aria-expanded={chonMo}
              aria-label="Chọn cảm xúc khác"
              className="grid h-10 w-9 place-items-center rounded-r-lg text-ink-500 transition-colors hover:text-ink-100"
            >
              <SmilePlus className="size-[17px]" />
            </button>
            {chonMo && (
              <ReactionPicker
                mine={mine}
                className="left-1/2 -translate-x-1/2"
                onPick={(k) => {
                  datChon(false);
                  toggle(k);
                }}
              />
            )}
          </div>
        </div>

        <span aria-hidden className="h-5 w-px bg-ink-800" />

        <button
          type="button"
          onClick={() => (moBinhLuan ? oNhap.current?.focus() : batBinhLuan())}
          className={cn(
            NUT_HANH_DONG,
            "text-ink-400 hover:bg-ink-850 hover:text-ink-100",
          )}
        >
          <MessageCircle className="size-[18px]" />
          Bình luận
        </button>
      </div>

      {/* Bình luận */}
      {moBinhLuan && (
        <div className="space-y-4 border-t border-ink-800 bg-ink-850/50 px-4 py-4 sm:px-5">
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-[12.5px] font-semibold text-gold-700 hover:underline dark:text-gold-300"
            >
              Xem thêm {hidden} bình luận
            </button>
          )}

          {chuoiHien.length > 0 && (
            <ul className="space-y-4">
              {chuoiHien.map((c) => {
                const cacTraLoi = traLoiCua.get(c.id) ?? [];
                const dangTraLoi = traLoi?.goc === c.id;
                return (
                  <li key={c.id}>
                    <ul className="space-y-0">
                      <CommentRow
                        comment={c}
                        viewer={viewer}
                        canModerate={canModerate}
                        onTraLoi={() =>
                          setTraLoi({
                            goc: c.id,
                            dich: c.id,
                            ten: c.author.fullName,
                            nhacTen: false,
                          })
                        }
                      />
                    </ul>

                    {/* Chuỗi trả lời: thụt vào, có vạch dọc nối về bình luận gốc */}
                    {(cacTraLoi.length > 0 || dangTraLoi) && (
                      <ul className="mt-3 ml-4 space-y-3 border-l-2 border-ink-800 pl-4 sm:ml-[18px]">
                        {cacTraLoi.map((r) => (
                          <CommentRow
                            key={r.id}
                            nho
                            comment={r}
                            viewer={viewer}
                            canModerate={canModerate}
                            onTraLoi={() =>
                              setTraLoi({
                                goc: c.id,
                                dich: r.id,
                                ten: r.author.fullName,
                                nhacTen: r.author.id !== viewer.id,
                              })
                            }
                          />
                        ))}
                        {dangTraLoi && (
                          <OTraLoi
                            key={traLoi.dich}
                            postId={postId}
                            parentId={traLoi.dich}
                            ten={traLoi.ten}
                            nhacTen={traLoi.nhacTen}
                            viewer={viewer}
                            onDong={() => setTraLoi(null)}
                          />
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
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
              <div className="flex items-end gap-2 rounded-lg border border-ink-700 bg-ink-900 py-1 pr-1 pl-3.5 transition-[border-color,box-shadow] focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/25 hover:border-ink-600">
                <textarea
                  ref={oNhap}
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
                  className="max-h-32 min-h-8 w-full resize-none bg-transparent py-1.5 text-[14px] text-ink-200 outline-none placeholder:text-ink-500"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || pending}
                  aria-label="Gửi bình luận"
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy-900 text-white transition-[background-color,opacity,transform] hover:bg-navy-800 active:scale-95 disabled:opacity-30"
                >
                  <Send className="size-4" />
                </button>
              </div>
              {error ? (
                <p className="mt-1.5 text-[12.5px] font-medium text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              ) : (
                <p className="mt-1.5 hidden text-[12.5px] text-ink-500 sm:block">
                  Enter để gửi · Shift+Enter để xuống dòng
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
