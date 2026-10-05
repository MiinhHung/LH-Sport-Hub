"use client";

import { ImagePlus, SendHorizontal, Smile, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  deleteMessageAction,
  fetchNewMessagesAction,
  markConversationReadAction,
  sendMessageAction,
} from "@/actions/chat";
import { useHoiLai } from "@/components/ui/hoi-lai";
import { idleState } from "@/actions/types";
import type { ChatMessagePayload } from "@/lib/chat";
import { LIMITS, UPLOAD } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Hôm nay";
  if (same(d, yesterday)) return "Hôm qua";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function clockLabel(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
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
      if (document.hidden || !lastRealAt) return;
      const result = await fetchNewMessagesAction(conversationId, lastRealAt);
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

  let lastDay = "";
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
        className="min-h-0 flex-1 overflow-y-auto px-1 py-6"
      >
        {items.length === 0 && (
          <p className="py-16 text-center text-[14px] text-ink-500">
            Chưa có tin nhắn nào với {partnerName}.
            <br />
            Chào một câu đi.
          </p>
        )}

        <ol className="space-y-1.5">
          {items.map((m) => {
            const mine = m.senderId === viewerId;
            const day = dayLabel(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;

            return (
              <li key={m.id}>
                {showDay && (
                  <div className="flex items-center gap-4 py-6">
                    <span className="h-px flex-1 bg-ink-800" />
                    <span className="text-[10.5px] font-semibold tracking-[0.14em] text-ink-500 uppercase">
                      {day}
                    </span>
                    <span className="h-px flex-1 bg-ink-800" />
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
                      className="mb-5 grid size-7 shrink-0 place-items-center rounded-lg text-ink-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 focus-visible:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}

                  <div className="max-w-[78%] sm:max-w-[65%]">
                    {m.imageUrl && (
                      <a
                        href={m.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "block overflow-hidden rounded-2xl ring-1 ring-ink-800 transition-opacity",
                          mine ? "rounded-br-md" : "rounded-bl-md",
                          m.pending && "opacity-55",
                          m.content && "mb-1",
                        )}
                      >
                        {/* Ảnh tạm là blob: URL nên dùng thẻ img thường;
                            ảnh thật đi qua next/image để được tối ưu. */}
                        {m.imageUrl.startsWith("blob:") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.imageUrl}
                            alt="Ảnh đang gửi"
                            className="max-h-72 w-auto object-cover"
                          />
                        ) : (
                          <Image
                            src={m.imageUrl}
                            alt="Ảnh trong tin nhắn"
                            width={m.imageWidth ?? 600}
                            height={m.imageHeight ?? 600}
                            sizes="(max-width: 640px) 78vw, 400px"
                            className="h-auto max-h-72 w-auto object-cover"
                          />
                        )}
                      </a>
                    )}

                    {m.content && (
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap transition-opacity",
                          mine
                            ? "rounded-br-md bg-navy-900 text-white"
                            : "rounded-bl-md bg-ink-850 text-ink-200",
                          m.pending && "opacity-55",
                          m.failed &&
                            "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200",
                          m.imageUrl &&
                            (mine ? "rounded-tr-md" : "rounded-tl-md"),
                        )}
                      >
                        {m.content}
                      </div>
                    )}

                    <p
                      className={cn(
                        "mt-1 px-1 text-[10.5px] text-ink-500",
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

      {/* Ô soạn tin */}
      <form
        onSubmit={send}
        className="border-t border-ink-800 bg-ink-950/80 py-4 backdrop-blur-sm"
      >
        {attachment && (
          <div className="relative mb-3 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.url}
              alt="Ảnh sắp gửi"
              className="h-24 w-auto rounded-xl object-cover ring-1 ring-ink-800"
            />
            <button
              type="button"
              onClick={clearAttachment}
              aria-label="Bỏ ảnh"
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-navy-900 text-white transition-colors hover:bg-navy-800"
            >
              <X className="size-3.5" strokeWidth={3} />
            </button>
          </div>
        )}

        {error && (
          <p className="mb-2 text-[12px] font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Gửi ảnh"
            className="grid size-11 shrink-0 place-items-center rounded-2xl text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-100"
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
                "grid size-11 shrink-0 place-items-center rounded-2xl transition-colors",
                emojiOpen
                  ? "bg-ink-850 text-ink-100"
                  : "text-ink-500 hover:bg-ink-850 hover:text-ink-100",
              )}
            >
              <Smile className="size-[18px]" />
            </button>

            {emojiOpen && (
              <div className="animate-rise absolute bottom-full left-0 z-20 mb-2 w-[17.5rem] rounded-2xl border border-ink-800 bg-ink-900 p-2 shadow-[var(--shadow-pop)]">
                <div className="grid grid-cols-8 gap-0.5">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="grid size-8 place-items-center rounded-lg text-lg transition-transform duration-150 hover:scale-125 hover:bg-ink-850"
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
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-[15px] text-ink-200 outline-none transition-all placeholder:text-ink-500 hover:border-ink-600 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15"
          />

          <button
            type="submit"
            disabled={!canSend}
            aria-label="Gửi tin nhắn"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-900 text-white transition-all hover:bg-navy-800 active:translate-y-px disabled:opacity-30"
          >
            <SendHorizontal className="size-[18px]" />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={UPLOAD.allowedMimeTypes.join(",")}
          className="sr-only"
          onChange={(e) => pickImage(e.target.files)}
        />
      </form>
    </div>
  );
}
