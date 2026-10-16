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

/** Tin tạm (đang gửi hoặc gửi hỏng) — chưa có id thật trên máy chủ. */
const TEMP_PREFIX = "tam-";
let tempSeq = 0;
/** Id tạm không trùng, kể cả khi bấm gửi / gửi lại hai lần trong cùng mili giây. */
function newTempId() {
  tempSeq += 1;
  return `${TEMP_PREFIX}${Date.now()}-${tempSeq}`;
}
const isTemp = (m: Pending) =>
  Boolean(m.pending || m.failed || m.id.startsWith(TEMP_PREFIX));

/**
 * Gộp tin từ máy chủ vào danh sách đang hiện.
 *
 * - Tin đã có (trùng id) thì bỏ qua.
 * - Tin tạm (đang gửi / gửi hỏng) LUÔN được giữ và xếp cuối: nếu bỏ đi
 *   giữa chừng thì lúc gửi hỏng không còn gì để đánh dấu, chữ người dùng
 *   gõ biến mất luôn.
 * - Tin thật của chính mình về tới thì gỡ một bản tạm cùng nội dung đang
 *   chờ, để không hiện hai lần trong lúc chờ kết quả gửi.
 */
function mergeIncoming(
  current: Pending[],
  incoming: ChatMessagePayload[],
  viewerId: string,
): Pending[] {
  const ids = new Set(current.map((m) => m.id));
  const add = incoming.filter((m) => !ids.has(m.id));
  if (add.length === 0) return current;

  const confirmed = current.filter((m) => !isTemp(m));
  let temps = current.filter(isTemp);
  for (const m of add) {
    if (m.senderId !== viewerId) continue;
    const i = temps.findIndex(
      (t) =>
        t.pending && t.content === m.content && !t.imageUrl === !m.imageUrl,
    );
    if (i !== -1) temps = temps.filter((_, j) => j !== i);
  }
  return [...confirmed, ...add, ...temps];
}

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

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Đang kéo một tệp ngang qua khung soạn tin. */
  const [dangKeoAnh, setDangKeoAnh] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Chỉ tự cuộn khi đang ở gần đáy — đang đọc lại tin cũ mà bị kéo xuống
  // thì rất khó chịu.
  const stickToBottom = useRef(true);
  // Chốt chặn: dù component có gắn lại vì lý do gì, cũng chỉ đánh dấu
  // đã đọc một lần cho mỗi cuộc trò chuyện.
  const markedRead = useRef<string | null>(null);

  // Bản mới nhất của danh sách tin, để vòng hỏi tin biết tin nào đã có
  // mà không phải đưa `items` vào phụ thuộc của effect.
  const itemsRef = useRef<Pending[]>(initialMessages);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Mọi object URL (blob:) đang sống — để thu hồi hết khi rời khung chat,
  // nếu không ảnh đính kèm cứ nằm trong bộ nhớ trình duyệt mãi.
  const blobUrls = useRef<Set<string>>(new Set());
  // File gốc của tin gửi hỏng, để bấm "Gửi lại" không phải chọn ảnh lại.
  const tempFiles = useRef<Map<string, File>>(new Map());

  useEffect(() => {
    const urls = blobUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const revokeBlob = useCallback((url: string | null | undefined) => {
    if (!url || !blobUrls.current.has(url)) return;
    URL.revokeObjectURL(url);
    blobUrls.current.delete(url);
  }, []);

  const markRead = useCallback(() => {
    if (markedRead.current === conversationId) return;
    markedRead.current = conversationId;
    void markConversationReadAction(conversationId);
  }, [conversationId]);

  // Bỏ qua tin tạm: giờ của chúng lấy từ đồng hồ máy người dùng, lấy làm
  // mốc hỏi tin thì có thể bỏ sót tin thật.
  const lastRealAt = items.reduce<string | null>(
    (acc, m) =>
      isTemp(m) ? acc : !acc || m.createdAt > acc ? m.createdAt : acc,
    null,
  );

  // Cuộn đúng khung tin. `scrollIntoView` cuộn luôn cả trang cha, đẩy
  // header co/giãn theo và làm khung chat giật.
  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
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

      const known = new Set(itemsRef.current.map((m) => m.id));
      const fresh = result.messages.filter((m) => !known.has(m.id));
      if (fresh.length === 0) return;

      setItems((current) => mergeIncoming(current, fresh, viewerId));

      // Chỉ khi THẬT SỰ có tin mới từ người kia mới đánh dấu đã đọc lại.
      // Xét trên `result.messages` thì tin cũ trả về lặp lại cũng tính, và
      // mỗi lần hỏi lại bắn một lệnh UPDATE vô ích.
      if (fresh.some((m) => m.senderId !== viewerId)) {
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
    if (file) nhanAnh(file);
  }

  /**
   * Lấy ảnh từ khay nhớ tạm (Ctrl+V) hoặc từ cú kéo thả. Trả về true nếu
   * có ảnh — khi đó nơi gọi chặn hành vi mặc định (không dán chữ rác / mở
   * ảnh ra tab mới).
   */
  function layAnhTu(data: DataTransfer | null): boolean {
    const file = Array.from(data?.files ?? []).find((f) =>
      f.type.startsWith("image/"),
    );
    if (!file) return false;
    nhanAnh(file);
    return true;
  }

  function nhanAnh(file: File) {
    if (!(UPLOAD.allowedMimeTypes as readonly string[]).includes(file.type)) {
      setError("Chỉ gửi được ảnh JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > UPLOAD.maxBytes) {
      setError(`Ảnh tối đa ${Math.round(UPLOAD.maxBytes / 1024 / 1024)}MB.`);
      return;
    }
    setError(null);
    if (attachment) revokeBlob(attachment.url);
    const url = URL.createObjectURL(file);
    blobUrls.current.add(url);
    setAttachment({ file, url });
  }

  function clearAttachment() {
    if (attachment) revokeBlob(attachment.url);
    setAttachment(null);
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

  /** Bỏ một tin tạm (gửi hỏng) — chỉ ở máy mình, máy chủ chưa hề có nó. */
  function discardTemp(m: Pending) {
    revokeBlob(m.imageUrl);
    tempFiles.current.delete(m.id);
    setItems((current) => current.filter((x) => x.id !== m.id));
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

    const previewUrl = attachment?.url ?? null;

    setDraft("");
    setEmojiOpen(false);
    // Không thu hồi object URL ở đây: bản tạm còn đang dùng nó để hiện ảnh.
    setAttachment(null);
    if (fileRef.current) fileRef.current.value = "";

    dispatch(content, file, previewUrl);
  }

  /** Gửi lại một tin hỏng: gỡ bản hỏng, gửi lại đúng chữ và ảnh cũ. */
  function retry(m: Pending) {
    const file = tempFiles.current.get(m.id) ?? null;
    tempFiles.current.delete(m.id);
    setItems((current) => current.filter((x) => x.id !== m.id));
    dispatch(m.content, file, file ? m.imageUrl : null);
  }

  function dispatch(
    content: string,
    file: File | null,
    previewUrl: string | null,
  ) {
    const tempId = newTempId();

    setError(null);
    stickToBottom.current = true;
    if (file) tempFiles.current.set(tempId, file);

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

      tempFiles.current.delete(tempId);

      // Lấy bản thật về ngay; bỏ bản tạm đi.
      const fresh = await fetchNewMessagesAction(
        conversationId,
        lastRealAt ?? new Date(Date.now() - 60_000).toISOString(),
      );
      setItems((current) => {
        const withoutTemp = current.filter((m) => m.id !== tempId);
        if (!fresh.ok) return withoutTemp;
        return mergeIncoming(withoutTemp, fresh.messages, viewerId);
      });
      revokeBlob(previewUrl);
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
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
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
            <p className="mt-1 text-[13.5px] text-ink-500">Chào một câu đi.</p>
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
                      // Tin gửi hỏng chưa có trên máy chủ (id "tam-…"), gọi
                      // action xoá chỉ nhận lỗi — bỏ tại chỗ là đủ.
                      onClick={() =>
                        isTemp(m) ? discardTemp(m) : removeMessage(m.id)
                      }
                      aria-label={
                        isTemp(m) ? "Bỏ tin gửi hỏng" : "Xoá tin nhắn"
                      }
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
                      {m.failed ? (
                        <>
                          Không gửi được ·{" "}
                          <button
                            type="button"
                            onClick={() => retry(m)}
                            className="underline underline-offset-2 hover:text-rose-700 dark:hover:text-rose-300"
                          >
                            Gửi lại
                          </button>
                        </>
                      ) : m.pending ? (
                        "Đang gửi…"
                      ) : (
                        clockLabel(m.createdAt)
                      )}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Ô soạn tin — cùng dáng ô bình luận ở bảng tin */}
      {/*
        Kéo ảnh từ máy thả vào khung soạn tin là đính kèm luôn, có viền vàng
        đứt báo chỗ thả.
      */}
      <form
        onSubmit={send}
        onDragOver={(e) => {
          if (!Array.from(e.dataTransfer.types).includes("Files")) return;
          e.preventDefault();
          setDangKeoAnh(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setDangKeoAnh(false);
          }
        }}
        onDrop={(e) => {
          setDangKeoAnh(false);
          if (layAnhTu(e.dataTransfer)) e.preventDefault();
        }}
        className={cn(
          "relative border-t border-ink-800 bg-ink-900 px-3 pt-3 pb-3 sm:px-4",
          dangKeoAnh &&
            "after:pointer-events-none after:absolute after:inset-1.5 after:rounded-xl after:border-2 after:border-dashed after:border-gold-400 after:bg-gold-400/5",
        )}
      >
        {attachment && (
          <div className="animate-rise relative mb-2.5 ml-1 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.url}
              alt="Ảnh sắp gửi"
              className="size-28 rounded-2xl object-cover ring-1 ring-ink-800 sm:size-32"
            />
            <button
              type="button"
              onClick={clearAttachment}
              aria-label="Bỏ ảnh"
              className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 pointer-coarse:size-8"
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
                      aria-label={`Chèn ${emoji}`}
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
            /*
              DÁN ẢNH (Ctrl+V): ảnh copy từ web, ảnh chụp màn hình… thành
              ảnh đính kèm. Khay nhớ chỉ có ảnh thì chặn dán mặc định; có cả
              chữ (copy một đoạn kèm hình) thì vẫn để chữ dán vào như thường.
            */
            onPaste={(e) => {
              const coChu = e.clipboardData.getData("text/plain").trim() !== "";
              if (layAnhTu(e.clipboardData) && !coChu) e.preventDefault();
            }}
            rows={1}
            maxLength={LIMITS.commentContent}
            placeholder={`Nhắn cho ${partnerName}…`}
            aria-label="Nội dung tin nhắn"
            data-tu-vien-focus
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
          Enter để gửi · Shift+Enter để xuống dòng · Ctrl+V để dán ảnh
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
