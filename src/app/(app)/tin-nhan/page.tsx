import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StartChatTile } from "@/components/chat/start-chat";
import { Avatar } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { listChatPartners, listConversations } from "@/lib/chat";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Tin nhắn" };

export default async function MessagesPage() {
  const profile = await requireProfile();
  const [conversations, partners] = await Promise.all([
    listConversations(profile.id),
    listChatPartners(profile.id),
  ]);

  // Người chưa từng nhắn — đưa lên hàng "bắt đầu trò chuyện".
  const chattedWith = new Set(conversations.map((c) => c.partner.id));
  const fresh = partners.filter((p) => !chattedWith.has(p.id));

  return (
    <div className="mx-auto max-w-2xl">
      <header className="pb-10">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-gold-600 uppercase">
          Riêng tư
        </p>
        <h1 className="font-display mt-2 text-[40px] leading-[1.05] font-bold text-ink-100 sm:text-[52px]">
          Tin nhắn
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
          Nhắn riêng cho từng người trong team. Chỉ hai người trong cuộc
          trò chuyện đọc được.
        </p>
      </header>

      {/* Bắt đầu trò chuyện mới */}
      {fresh.length > 0 && (
        <section aria-labelledby="bat-dau" className="pb-10">
          <h2
            id="bat-dau"
            className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-ink-500 uppercase"
          >
            Bắt đầu trò chuyện
          </h2>
          <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4">
            {fresh.map((p) => (
              <StartChatTile key={p.id} person={p} />
            ))}
          </div>
        </section>
      )}

      {/* Danh sách cuộc trò chuyện */}
      {conversations.length === 0 ? (
        <div className="border-t border-ink-800 py-20 text-center">
          <MessagesSquare
            className="mx-auto size-7 text-ink-600"
            aria-hidden
          />
          <p className="mt-4 text-[15px] font-semibold text-ink-200">
            Chưa có cuộc trò chuyện nào
          </p>
          <p className="mt-1.5 text-sm text-ink-500">
            Chọn một người ở trên để nhắn câu đầu tiên.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-800 border-y border-ink-800">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/tin-nhan/${c.id}`}
                className="group flex items-center gap-4 py-5 transition-colors hover:bg-ink-850/50"
              >
                <div className="relative shrink-0">
                  <Avatar
                    name={c.partner.fullName}
                    src={c.partner.avatarUrl}
                    seed={c.partner.id}
                    size="lg"
                  />
                  {c.unread && (
                    <span
                      aria-label="Có tin chưa đọc"
                      className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-gold-500 ring-2 ring-ink-950"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "truncate text-[16.5px] transition-colors group-hover:text-navy-700",
                        c.unread
                          ? "font-bold text-ink-100"
                          : "font-semibold text-ink-200",
                      )}
                    >
                      {c.partner.fullName}
                    </p>
                    <time
                      className="shrink-0 text-[11.5px] text-ink-500"
                      dateTime={c.lastMessageAt.toISOString()}
                    >
                      {timeAgo(c.lastMessageAt)}
                    </time>
                  </div>
                  <p
                    className={cn(
                      "mt-1 truncate text-[14px]",
                      c.unread ? "font-medium text-ink-300" : "text-ink-500",
                    )}
                  >
                    {c.lastMessagePreview
                      ? `${c.lastSenderId === profile.id ? "Bạn: " : ""}${c.lastMessagePreview}`
                      : "Chưa có tin nhắn nào"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
