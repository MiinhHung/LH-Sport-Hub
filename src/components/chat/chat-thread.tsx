"use client";

import {
  ImagePlus,
  MessageCircle,
  SendHorizontal,
  Smile,
  Trash2,
  X,
} from "@/components/icons";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  deleteMessageAction,
  fetchNewMessagesAction,
  markConversationReadAction,
  sendMessageAction,
} from "@/actions/chat";
import { useHoiLai } from "@/components/ui/hoi-lai";
import { XemAnh } from "@/components/xem-anh";
import { idleState } from "@/actions/types";
import type { ChatMessagePayload } from "@/lib/chat";
import { LIMITS, UPLOAD } from "@/lib/constants";
import { cn, TIME_ZONE } from "@/lib/utils";

/** Bao lâu hỏi lại tin mới một lần, khi tab đang mở. */
const POLL_MS = 4000;

/** Emoji hay dùng — đủ cho chat nội bộ, khỏi kéo cả thư viện emoji vào. */
const EMOJIS = [
  "😀",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😎",
  "🤔",
  "😅",
  "😭",
  "😱",
  "😤",
  "🥲",
  "🙃",
  "😴",
  "🤝",
  "🙏",
  "👍",
  "👎",
  "👏",
  "💪",
  "🔥",
  "✨",
  "💯",
  "🎉",
  "❤️",
  "💔",
  "😘",
  "🤗",
  "🥳",
  "😇",
  "🤡",
  "💀",
  "🏸",
  "🏆",
  "🥇",
  "⚡",
  "🍜",
  "🧋",
  "☕",
  "💧",
  "💸",
  "🤑",
  "😏",
  "🫡",
  "👀",
  "🆗",
  "❌",
  "⏰",
];

type Pending = ChatMessagePayload & { pending?: true; failed?: true };

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const todayStr = fmt.format(now);
  const dateStr = fmt.format(d);
  if (dateStr === todayStr) return "Hôm nay";

  const yest = new Date(now.getTime() - 86_400_000);
  if (dateStr === fmt.format(yest)) return "Hôm qua";

  return dateStr;
}

function clockLabel(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function ChatThread({
  conversationId,
  viewerId,
  partnerName,
  initialMessages,
}: {
  conversationId: string;
  viewerId: string;
  partnerName: string;
  initialMessages: ChatMessagePayload[];
}) {
  const [items, setItems] = useState<Pending[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { hoi, hopThoai } = useHoiLai();

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Chỉ tự cuộn khi đang ở gần đáy — đang đọc lại tin cũ mà bị kéo xuống
  // thì rất khó chịu.
  const stickToBottom = useRef(true);
  // Chốt chặn: dù component có gắn lại vì lý do gì, cũng chỉ đánh dấu
  // đã đọc một lần cho mỗi cuộc trò chuyện.
  const markedRead = useRef<string | null>(null);

  const markRead = useCallback(() => {
    if (markedRead.current === conversationId) return;
    markedRead.current = conversationId;
    void markConversationReadAction(conversationId);
  }, [conversationId]);

  const lastRealAt = items.reduce<string | null>(
    (acc, m) =>
      m.pending ? acc : !acc || m.createdAt > acc ? m.createdAt : acc,
    null,
  );

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
    markRead();
  }, [markRead, scrollToBottom]);

  useEffect(() => {
    if (stickToBottom.current) scrollToBottom(true);
  }, [items, scrollToBottom]);

  useEffect(() => {
    if (!emojiOpen) return;
    function onDown(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [emojiOpen]);

  // Hỏi tin mới theo chu kỳ, dừng hẳn khi tab bị ẩn.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) return;
      const since = lastRealAt ?? new Date(0).toISOString();
      const result = await fetchNewMessagesAction(conversationId, since);
      if (cancelled || !result.ok || result.messages.length === 0) return;

      setItems((current) => {
        const known = new Set(
          current.filter((m) => !m.pending).map((m) => m.id),
        );
        const fresh = result.messages.filter((m) => !known.has(m.id));
        if (fresh.length === 0) return current;
        return [...current.filter((m) => !m.pending), ...fresh];
      });

      // Có tin mới từ người kia => mở lại chốt để đánh dấu đã đọc lần nữa.
      if (result.messages.some((m) => m.senderId !== viewerId)) {
        markedRead.current = null;
        markRead();
      }
    }

    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [conversationId, lastRealAt, markRead, viewerId]);

  function pickImage(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    if (file.size > UPLOAD.maxBytes) {
      setError(`Ảnh tối đa ${Math.round(UPLOAD.maxBytes / 1024 / 1024)}MB.`);
      return;
    }
    setError(null);
    setAttachment((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return { file, url: URL.createObjectURL(file) };
    });
  }

  function clearAttachment() {
    setAttachment((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function insertEmoji(emoji: string) {
    const el = textRef.current;
    if (!el) {
      setDraft((d) => d + emoji);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    // Đặt lại con trỏ ngay sau emoji vừa chèn.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  async function removeMessage(id: string) {
    const ok = await hoi({
      tieuDe: "Xoá tin nhắn này?",
      moTa: "Cả hai bên sẽ không còn thấy tin này nữa.",
      nguyHiem: true,
    });
    if (!ok) return;
    const snapshot = items;
    setItems((current) => current.filter((m) => m.id !== id));

    const fd = new FormData();
    fd.set("messageId", id);
    startTransition(async () => {
      const result = await deleteMessageAction(idleState, fd);
      if (result.status === "error") {
        setItems(snapshot);
        setError(result.message ?? "Không xoá được tin nhắn.");
      }
    });
  }

  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = draft.trim();
    const file = attachment?.file ?? null;
    if (!content && !file) return;

    const tempId = `tam-${Date.now()}`;
    const previewUrl = attachment?.url ?? null;

    setDraft("");
    setError(null);
    setEmojiOpen(false);
    stickToBottom.current = true;
    // Không thu hồi object URL ở đây: bản tạm còn đang dùng nó để hiện ảnh.
    setAttachment(null);
    if (fileRef.current) fileRef.current.value = "";

    setItems((current) => [
      ...current,
      {
        id: tempId,
        senderId: viewerId,
        content,
        imageUrl: previewUrl,
        imageWidth: null,
        imageHeight: null,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);

    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("content", content);
    if (file) fd.set("image", file);

    startTransition(async () => {
      const result = await sendMessageAction(idleState, fd);

      if (result.status === "error") {
        setItems((current) =>
          current.map((m) =>
            m.id === tempId ? { ...m, pending: undefined, failed: true } : m,
          ),
        );
        setError(result.message ?? null);
        return;
      }

      // Lần hỏi tin kế tiếp sẽ mang về bản thật; bỏ bản tạm đi.
      const fresh = await fetchNewMessagesAction(
        conversationId,
        lastRealAt ?? new Date(Date.now() - 60_000).toISOString(),
      );
      setItems((current) => {
        const withoutTemp = current.filter((m) => m.id !== tempId);
        if (!fresh.ok) return withoutTemp;
        const known = new Set(withoutTemp.map((m) => m.id));
        return [
          ...withoutTemp,
          ...fresh.messages.filter((m) => !known.has(m.id)),
        ];
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    });
  }

  /*
    Tin nào là tin ĐẦU TIÊN của một ngày — tức tin cần vẽ vạch ngăn ngày
    phía trên.

    Trước đây chỗ này là một biến `let lastDay` bị gán lại ngay trong
    `items.map(...)`, tức thay đổi trạng thái giữa lúc render. Chạy một
    lượt thì đúng, nhưng React có quyền render lại một phần cây mà không
    chạy lại từ đầu — khi đó `lastDay` mang giá trị sót của lượt trước và
    vạch ngăn ngày rơi sai chỗ. `react-hooks/immutability` bắt đúng chỗ
    này.

    Tính trước thành một Map thì mỗi tin tra ra kết quả của riêng nó,
    không phụ thuộc thứ tự render.
  */
  const mocNgay = useMemo(() => {
    const ra = new Map<string, string>();
    let truoc: string | null = null;
    for (const m of items) {
      const ngay = dayLabel(m.createdAt);
      if (ngay !== truoc) ra.set(m.id, ngay);
      truoc = ngay;
    }
    return ra;
  }, [items]);

  /*
    MỌI ẢNH TRONG CUỘC TRÒ CHUYỆN, để lật qua lại trong khung xem.

    Bấm vào một ảnh thì mở đúng tấm đó, nhưng vuốt tiếp là sang ảnh
    khác của cùng cuộc trò chuyện — giống Messenger. Mở từng tấm rời
    thì mỗi lần muốn xem ảnh trước lại phải đóng, cuộn, bấm lại.

    Bỏ ảnh đang gửi: lúc đó `imageUrl` còn là `blob:` trỏ vào bộ nhớ
    trình duyệt, chưa phải ảnh thật trên máy chủ.
  */
  const anhTrongCuoc = useMemo(
    () =>
      items
        .filter((m) => m.imageUrl && !m.imageUrl.startsWith("blob:"))
        .map((m) => ({
          id: m.id,
          url: m.imageUrl as string,
          alt: null,
          width: m.imageWidth ?? null,
          height: m.imageHeight ?? null,
        })),
    [items],
  );
  const [moAnhTai, setMoAnhTai] = useState<number | null>(null);

  const canSend = Boolean(draft.trim() || attachment);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {hopThoai}
      <div
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
      >
        {items.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <span
              aria-hidden
              className="grid size-12 place-items-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-gold-200 dark:bg-gold-400/10 dark:text-gold-300 dark:ring-gold-400/30"
            >
              <MessageCircle className="size-6" />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-ink-200">
              Chưa có tin nhắn nào với {partnerName}
            </p>
            <p className="mt-1 text-[13.5px] text-ink-500">
              Chào một câu đi.
            </p>
          </div>
        )}

        <ol className="space-y-1.5">
          {items.map((m) => {
            const mine = m.senderId === viewerId;
            const day = mocNgay.get(m.id);

            return (
              <li key={m.id}>
                {day && (
                  <div className="flex justify-center py-4">
                    <span className="rounded-full bg-ink-850 px-3 py-1 text-[12px] font-medium text-ink-500">
                      {day}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    "group flex items-end gap-1.5",
                    mine ? "justify-end" : "justify-start",
                  )}
                >
                  {mine && !m.pending && (
                    <button
                      type="button"
                      onClick={() => removeMessage(m.id)}
                      aria-label="Xoá tin nhắn"
                      /*
                        `pointer-coarse:opacity-100` — TRÊN ĐIỆN THOẠI THÌ
                        HIỆN SẴN.

                        Nút này vốn ẩn và chỉ hiện khi rê chuột qua dòng
                        tin. Điện thoại không có "rê chuột": ngón tay chỉ
                        có chạm hoặc không. Nghĩa là suốt từ trước tới
                        giờ, ai mở app bằng điện thoại thì KHÔNG CÓ CÁCH
                        NÀO xoá tin nhắn của chính mình — nút có đó mà
                        trong suốt vĩnh viễn.
                      */
                      className="mb-5 grid size-7 shrink-0 place-items-center rounded-lg text-ink-500 opacity-0 transition-[opacity,background-color,color] group-hover:opacity-100 pointer-coarse:size-9 pointer-coarse:opacity-100 hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}

                  <div className="max-w-[80%] sm:max-w-[68%]">
                    {m.imageUrl &&
                      /*
                        Ảnh ĐANG GỬI thì không bấm xem được: lúc này
                        `imageUrl` mới là `blob:` trong bộ nhớ trình
                        duyệt, chưa có trên máy chủ. Để nó là `div` thường
                        thay vì nút — nút bấm vào không làm gì là lời hứa
                        suông, mà đây chỉ kéo dài một hai giây.
                      */
                      (m.imageUrl.startsWith("blob:") ? (
                        <div
                          className={cn(
                            "block overflow-hidden rounded-xl opacity-55 ring-1 ring-ink-800",
                            m.content && "mb-1",
                          )}
                        >
                          {/* blob: URL nên dùng thẻ img thường, next/image
                              không tối ưu được thứ chưa có trên máy chủ. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.imageUrl}
                            alt="Ảnh đang gửi"
                            className="max-h-72 w-auto object-cover"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setMoAnhTai(
                              anhTrongCuoc.findIndex((a) => a.id === m.id),
                            )
                          }
                          aria-label="Xem ảnh"
                          className={cn(
                            "block cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-ink-800 transition-opacity hover:opacity-90",
                            m.content && "mb-1",
                          )}
                        >
                          <Image
                            src={m.imageUrl}
                            alt="Ảnh trong tin nhắn"
                            width={m.imageWidth ?? 600}
                            height={m.imageHeight ?? 600}
                            sizes="(max-width: 640px) 78vw, 400px"
                            className="h-auto max-h-72 w-auto object-cover"
                          />
                        </button>
                      ))}

                    {m.content && (
                      <div
                        className={cn(
                          "rounded-xl px-3.5 py-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap transition-opacity",
                          mine
                            ? "bg-navy-900 text-white dark:bg-navy-700"
                            : "bg-ink-850 text-ink-200",
                          m.pending && "opacity-55",
                          m.failed &&
                            "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
                        )}
                      >
                        {m.content}
                      </div>
                    )}

                    <p
                      className={cn(
                        "tabular mt-1 px-1 text-[12px]",
                        m.failed
                          ? "font-semibold text-rose-600 dark:text-rose-400"
                          : "text-ink-500",
                        mine ? "text-right" : "text-left",
                      )}
                    >
                      {m.failed
                        ? "Không gửi được"
                        : m.pending
                          ? "Đang gửi…"
                          : clockLabel(m.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div ref={bottomRef} />
      </div>

      {/* Ô soạn tin — cùng dáng ô bình luận ở bảng tin */}
      <form
        onSubmit={send}
        className="border-t border-ink-800 bg-ink-900 px-3 pt-3 pb-3 sm:px-4"
      >
        {attachment && (
          <div className="relative mb-2.5 ml-1 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.url}
              alt="Ảnh sắp gửi"
              className="h-24 w-auto rounded-lg object-cover ring-1 ring-ink-800"
            />
            <button
              type="button"
              onClick={clearAttachment}
              aria-label="Bỏ ảnh"
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-navy-900 text-white ring-2 ring-ink-900 transition-colors hover:bg-navy-800 pointer-coarse:size-8"
            >
              <X className="size-3.5" strokeWidth={3} />
            </button>
          </div>
        )}

        {error && (
          <p className="mb-2 px-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex items-end gap-1 rounded-xl border border-ink-700 bg-ink-900 p-1 transition-[border-color,box-shadow] focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-400/25 hover:border-ink-600">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Gửi ảnh"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-100"
          >
            <ImagePlus className="size-[18px]" />
          </button>

          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              aria-label="Chèn biểu tượng cảm xúc"
              aria-expanded={emojiOpen}
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-lg transition-colors",
                emojiOpen
                  ? "bg-ink-850 text-ink-100"
                  : "text-ink-500 hover:bg-ink-850 hover:text-ink-100",
              )}
            >
              <Smile className="size-[18px]" />
            </button>

            {/* Bảng emoji là nội dung để chèn vào tin, không phải biểu tượng giao diện. */}
            {emojiOpen && (
              <div className="animate-rise absolute bottom-full left-0 z-20 mb-3 w-[17.5rem] rounded-xl border border-ink-800 bg-ink-900 p-2 shadow-[var(--shadow-pop)]">
                <div className="grid grid-cols-8 gap-0.5">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="grid size-8 place-items-center rounded-lg text-lg transition-[transform,background-color] duration-150 hover:scale-125 hover:bg-ink-850"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <textarea
            ref={textRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={LIMITS.commentContent}
            placeholder={`Nhắn cho ${partnerName}…`}
            aria-label="Nội dung tin nhắn"
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1.5 py-[9px] text-[15px] text-ink-200 outline-none placeholder:text-ink-500"
          />

          <button
            type="submit"
            disabled={!canSend}
            aria-label="Gửi tin nhắn"
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy-900 text-white transition-[background-color,opacity,transform] hover:bg-navy-800 active:scale-95 disabled:opacity-30 dark:bg-navy-700 dark:hover:bg-navy-600"
          >
            <SendHorizontal className="size-[18px]" />
          </button>
        </div>

        <p className="mt-1.5 hidden px-1 text-[12px] text-ink-500 sm:block">
          Enter để gửi · Shift+Enter để xuống dòng
        </p>

        <input
          ref={fileRef}
          type="file"
          accept={UPLOAD.allowedMimeTypes.join(",")}
          className="sr-only"
          onChange={(e) => pickImage(e.target.files)}
        />
      </form>

      {/* Một khung xem cho cả cuộc trò chuyện, không phải mỗi tin một
          khung — xem ghi chú `anhTrongCuoc` ở trên. */}
      <XemAnh
        danhSach={anhTrongCuoc}
        moTai={moAnhTai}
        dong={() => setMoAnhTai(null)}
      />
    </div>
  );
}
