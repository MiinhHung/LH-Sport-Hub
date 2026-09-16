import { MessagesSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BottomNav, TopNav } from "@/components/nav";
import { UserMenu } from "@/components/user-menu";
import { requireProfile } from "@/lib/auth";
import { unreadConversationCount } from "@/lib/chat";
import { unreadCount } from "@/lib/notifications";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const [unread, unreadMessages] = await Promise.all([
    unreadCount(profile.id),
    unreadConversationCount(profile.id),
  ]);

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-5">
          <Link
            href="/"
            aria-label="Light Human Sport Hub — về bảng tin"
            className="group flex shrink-0 items-center gap-2.5"
          >
            {/* next/image để file logo 340KB không tải nguyên cỡ cho ô 36px. */}
            <Image
              src="/logo.png"
              alt=""
              aria-hidden
              width={36}
              height={36}
              priority
              className="h-9 w-9 object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
              style={{ objectPosition: "center 28%" }}
            />
            <span className="hidden leading-none sm:block">
              <span className="font-display block text-[15px] font-bold text-navy-900">
                Light Human
              </span>
              <span className="mt-0.5 block text-[13px] font-semibold tracking-[0.14em] text-gold-600 uppercase">
                Sport Hub
              </span>
            </span>
          </Link>

          <div className="flex-1">
            <TopNav unread={unread} />
          </div>

          {/* Tin nhắn riêng nằm ở thanh trên thay vì thanh điều hướng —
              thanh dưới trên điện thoại đã đủ 5 mục. */}
          <Link
            href="/tin-nhan"
            aria-label={
              unreadMessages > 0
                ? `Tin nhắn — ${unreadMessages} cuộc chưa đọc`
                : "Tin nhắn"
            }
            className="relative grid size-9 shrink-0 place-items-center rounded-xl text-ink-500 transition-colors hover:bg-ink-850 hover:text-navy-900"
          >
            <MessagesSquare className="size-[18px]" strokeWidth={2} />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 size-2.5 rounded-full bg-gold-500 ring-2 ring-ink-950" />
            )}
          </Link>

          <UserMenu
            id={profile.id}
            fullName={profile.fullName}
            avatarUrl={profile.avatarUrl}
            role={profile.role}
          />
        </div>
      </header>

      <main
        id="noi-dung"
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-7 pb-28 sm:pt-9 md:pb-16"
      >
        {children}
      </main>

      <footer className="hidden border-t border-ink-800 py-6 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 text-xs text-ink-500">
          <p>Light Human Sport Hub — nội bộ công ty.</p>
          <p>Thua thì bao, đừng quỵt.</p>
        </div>
      </footer>

      <BottomNav unread={unread} />
    </div>
  );
}
