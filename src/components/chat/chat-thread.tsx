"use client";

import { SendHorizontal } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  fetchNewMessagesAction,
  markConversationReadAction,
  sendMessageAction,
} from "@/actions/chat";
import { idleState } from "@/actions/types";
import type { ChatMessagePayload } from "@/lib/chat";
import { LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Bao lâu hỏi lại tin mới một lần, khi tab đang mở. */
const POLL_MS = 4000;

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
  const [, startTransition] = useTransition();

  const bottomRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // Chỉ tự cuộn khi người dùng đang ở gần đáy — đang đọc lại tin cũ mà
  // bị kéo xuống thì rất khó chịu.
  const stickToBottom = useRef(true);
  // Chốt chặn: dù component có bị gắn lại vì lý do gì, cũng chỉ gọi
  // "đánh dấu đã đọc" một lần cho mỗi cuộc trò chuyện.
  const markedRead = useRef<string | null>(null);

  const markRead = useCallback(() => {
    if (markedRead.current === conversationId) return;
    markedRead.current = conversationId;
    void markConversationReadAction(conversationId);
  }, [conversationId]);

  const lastRealAt = items.reduce<string | null>(
    (acc, m) => (m.pending ? acc : !acc || m.createdAt > acc ? m.createdAt : acc),
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

  // Hỏi tin mới theo chu kỳ, và dừng hẳn khi tab bị ẩn.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden || !lastRealAt) return;
      const result = await fetchNewMessagesAction(conversationId, lastRealAt);
      if (cancelled || !result.ok || result.messages.length === 0) return;

      setItems((current) => {
        const known = new Set(current.filter((m) => !m.pending).map((m) => m.id));
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

  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    const tempId = `tam-${Date.now()}`;
    setDraft("");
    stickToBottom.current = true;
    setItems((current) => [
      ...current,
      {
        id: tempId,
        senderId: viewerId,
        content,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);

    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("content", content);

    startTransition(async () => {
      const result = await sendMessageAction(idleState, fd);
      if (result.status === "error") {
        setItems((current) =>
          current.map((m) =>
            m.id === tempId ? { ...m, pending: undefined, failed: true } : m,
          ),
        );
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
        return [...withoutTemp, ...fresh.messages.filter((m) => !known.has(m.id))];
      });
    });
  }

  let lastDay = "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={boxRef}
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
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div className="max-w-[78%] sm:max-w-[65%]">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap transition-opacity",
                        mine
                          ? "rounded-br-md bg-navy-900 text-white"
                          : "rounded-bl-md bg-ink-850 text-ink-200",
                        m.pending && "opacity-55",
                        m.failed && "bg-rose-100 text-rose-800",
                      )}
                    >
                      {m.content}
                    </div>
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
        className="flex items-end gap-2.5 border-t border-ink-800 bg-ink-950/80 py-4 backdrop-blur-sm"
      >
        <textarea
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
          disabled={!draft.trim()}
          aria-label="Gửi tin nhắn"
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-900 text-white transition-all hover:bg-navy-800 active:translate-y-px disabled:opacity-30"
        >
          <SendHorizontal className="size-[18px]" />
        </button>
      </form>
    </div>
  );
}
