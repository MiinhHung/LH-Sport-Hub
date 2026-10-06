import { MessagesSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BottomNav, TopNav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme";
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
        {/*
          LƯỚI BA CỘT, KHÔNG PHẢI MỘT HÀNG FLEX.

          Trước đây thanh điều hướng nằm trong một ô `flex-1` ngay sau
          logo, nên nó bắt đầu từ mép phải logo chứ không nằm giữa — logo
          rộng bao nhiêu thì nó lệch phải bấy nhiêu, và bên trái bên phải
          không bao giờ cân.

          `1fr auto 1fr` thì cột giữa luôn nằm đúng tâm khung, không phụ
          thuộc hai bên rộng hẹp thế nào. Hai cột ngoài tự chia đều phần
          còn lại.
        */}
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:gap-5">
          <Link
            href="/bang-tin"
            // Cùng lý do với thanh điều hướng — xem ghi chú ở components/nav.tsx.
            prefetch={false}
            aria-label="Light Human Sport Hub — về bảng tin"
            className="group col-start-1 flex shrink-0 items-center gap-2.5"
          >
            {/*
              HAI BẢN LOGO, ĐỔI THEO NỀN.

              logo.png có nền TRẮNG ĐẶC; ở nền sáng nó tan đi được là nhờ
              mix-blend-multiply. Nhưng multiply với nền tối cho ra tối —
              nghĩa là trên nền tối cái logo biến mất hẳn, không phải mờ
              đi. Nên nền tối dùng bản đã tách nền sẵn.

              Cả hai đều dựng ra HTML từ máy chủ và để CSS chọn hiện cái
              nào; chọn bằng JavaScript sẽ nháy sai logo một nhịp mỗi lần
              tải trang.

              next/image để file logo 340KB không tải nguyên cỡ cho ô 36px.
            */}
            <Image
              src="/logo.png"
              alt=""
              aria-hidden
              width={36}
              height={36}
              priority
              className="h-9 w-9 object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 dark:hidden"
              style={{ objectPosition: "center 28%" }}
            />
            <Image
              src="/logo-light.png"
              alt=""
              aria-hidden
              width={656}
              height={562}
              priority
              className="hidden h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 dark:block"
            />
            <span className="hidden leading-none sm:block">
              <span className="font-display block text-[15px] font-bold text-ink-100">
                Light Human
              </span>
              <span className="mt-0.5 block text-[13px] font-semibold tracking-[0.14em] text-gold-600 dark:text-gold-300 uppercase">
                Sport Hub
              </span>
            </span>
          </Link>

          <TopNav unread={unread} />

          {/*
            `col-start-3` LÀ BẮT BUỘC, KHÔNG PHẢI CHO CHẮC.

            Dưới md, `TopNav` mang `display: none` nên lưới KHÔNG đặt nó
            vào ô nào cả. Phần tử sau đó tự rơi vào ô trống kế tiếp —
            tức cột GIỮA — nên trên điện thoại cả nhóm chuông và ảnh đại
            diện sẽ nằm lệch vào giữa thay vì sát phải, còn cột ba bỏ
            trống. Ghim cột cho cả hai bên thì lưới đúng dù giữa có hay
            không.
          */}
          <div className="col-start-3 flex items-center justify-end gap-3 sm:gap-5">
            {/* Tin nhắn riêng nằm ở thanh trên thay vì thanh điều hướng —
              thanh dưới trên điện thoại đã đủ 5 mục. */}
            <Link
              href="/tin-nhan"
              prefetch={false}
              aria-label={
                unreadMessages > 0
                  ? `Tin nhắn — ${unreadMessages} cuộc chưa đọc`
                  : "Tin nhắn"
              }
              className="relative hidden size-9 shrink-0 place-items-center rounded-xl text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-100 md:grid"
            >
              <MessagesSquare className="size-[18px]" strokeWidth={2} />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 size-2.5 rounded-full bg-gold-500 ring-2 ring-ink-950" />
              )}
            </Link>

            {/* Công tắc sáng/tối. Ẩn trên điện thoại — thanh trên ở đó đã
              chật, nên bản nhỏ nằm trong menu tài khoản. */}
            <ThemeToggle className="hidden sm:block" />

            <UserMenu
              id={profile.id}
              fullName={profile.fullName}
              avatarUrl={profile.avatarUrl}
              role={profile.role}
            />
          </div>
        </div>
      </header>

      <main
        id="noi-dung"
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-7 pb-28 sm:pt-9 md:pb-16"
      >
        {children}
      </main>

      <BottomNav unread={unread} unreadMessages={unreadMessages} />
    </div>
  );
}
