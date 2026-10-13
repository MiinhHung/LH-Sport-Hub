"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  BookOpen,
  CalendarDays,
  Home,
  MessagesSquare,
  Newspaper,
  Swords,
  Trophy,
  Users,
  type IconType,
} from "@/components/icons";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  short: string;
  icon: IconType;
  badge?: number;
  /** Đơn vị của con số trên chấm báo, cho máy đọc màn hình. */
  badgeDvi?: string;
};

const TRANG_CHU: Item = {
  href: "/gioi-thieu",
  label: "Trang chủ",
  short: "Chủ",
  icon: Home,
};
const BANG_TIN: Item = {
  href: "/bang-tin",
  label: "Bảng tin",
  short: "Tin",
  icon: Newspaper,
};
const KEO: Item = { href: "/keo", label: "Kèo", short: "Kèo", icon: Swords };
const BUOI_TAP: Item = {
  href: "/buoi-tap",
  label: "Buổi tập",
  short: "Buổi tập",
  icon: CalendarDays,
};
const XEP_HANG: Item = {
  href: "/bang-phong-than",
  label: "Xếp hạng",
  short: "Hạng",
  icon: Trophy,
};
const CAM_NANG: Item = {
  href: "/cam-nang",
  label: "Cẩm nang",
  short: "Cẩm nang",
  icon: BookOpen,
};
const THANH_VIEN: Item = {
  href: "/thanh-vien",
  label: "Thành viên",
  short: "Thành viên",
  icon: Users,
};

function tinNhan(unread: number): Item {
  return {
    href: "/tin-nhan",
    label: "Tin nhắn",
    short: "Nhắn",
    icon: MessagesSquare,
    badge: unread,
    badgeDvi: "cuộc trò chuyện",
  };
}

function thongBao(unread: number): Item {
  return {
    href: "/thong-bao",
    label: "Thông báo",
    short: "Báo",
    icon: Bell,
    badge: unread,
    badgeDvi: "thông báo",
  };
}

function isActive(pathname: string, href: string) {
  const duong = href.split("?")[0];
  if (duong === "/") return pathname === "/" || pathname === "/gioi-thieu";
  if (duong === "/gioi-thieu") return pathname === "/gioi-thieu" || pathname === "/";
  return pathname === duong || pathname.startsWith(`${duong}/`);
}

/**
 * `dvi` là đơn vị của con số — "thông báo" hay "cuộc trò chuyện" — để máy
 * đọc màn hình không đọc "3 thông báo chưa đọc" cho 3 cuộc trò chuyện.
 */
function Counter({
  value,
  dvi,
  className,
}: {
  value: number;
  dvi: string;
  className?: string;
}) {
  return (
    <span
      aria-label={`${value} ${dvi} chưa đọc`}
      className={cn(
        "tabular grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-600 px-1 text-[10.5px] leading-none font-bold text-white",
        className,
      )}
    >
      {value > 9 ? "9+" : value}
    </span>
  );
}

/*
 * KHÔNG TẢI TRƯỚC TOÀN BỘ THANH ĐIỀU HƯỚNG.
 *
 * Đo trên bản build: mỗi lần Next tự tải trước một đường dẫn là một yêu
 * cầu đầy đủ — qua proxy, xác minh phiên với Supabase, dựng cả trang ở máy
 * chủ. Thanh điều hướng có cả chục link, nên mở một trang kéo theo chín
 * trang nữa mà người dùng chưa hề bấm vào.
 *
 * `prefetch={false}` không tắt hẳn: Next vẫn tải trước khi con trỏ rê vào
 * link, nghĩa là vẫn nhanh đúng lúc cần.
 */

/* ------------------------------------------------------------------ */
/* Thanh bên — màn rộng                                                */
/* ------------------------------------------------------------------ */

function SideLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] transition-colors duration-150",
        // Vạch vàng bên trái cho mục đang chọn, chữ navy đậm, không nền màu.
        "before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:transition-opacity",
        active
          ? "bg-ink-850 font-semibold text-ink-100 before:bg-gold-500 before:opacity-100"
          : "font-medium text-ink-400 before:opacity-0 hover:bg-ink-850 hover:text-ink-100",
      )}
    >
      <Icon
        weight="bold"
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active ? "text-ink-100" : "text-ink-500 group-hover:text-ink-200",
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <Counter value={item.badge} dvi={item.badgeDvi ?? "thông báo"} />
      ) : null}
    </Link>
  );
}

/**
 * Điều hướng chính trên màn rộng: một cột dọc CÓ CHỮ.
 *
 * Bản trước là dãy bảy biểu tượng trơn trên thanh trên, phóng to theo con
 * trỏ kiểu dock macOS. Đẹp mắt lúc rê chuột, nhưng người mới phải rê qua
 * từng cái mới biết cái nào là gì — "kèo" và "xếp hạng" không có hình
 * nào nói được. Cột dọc có chỗ cho chữ, cho số chưa đọc, và cho thêm mục
 * sau này mà không phải đo lại bề ngang header.
 */
export function SideNav({
  unread,
  unreadMessages,
}: {
  unread: number;
  unreadMessages: number;
}) {
  const pathname = usePathname();

  const nhom: { ten: string; items: Item[] }[] = [
    { ten: "Sân chơi", items: [BANG_TIN, KEO, BUOI_TAP, XEP_HANG] },
    {
      ten: "Cá nhân",
      items: [tinNhan(unreadMessages), thongBao(unread), THANH_VIEN, CAM_NANG],
    },
  ];

  return (
    <nav aria-label="Điều hướng chính" className="space-y-6">
      {nhom.map((n) => (
        <div key={n.ten}>
          <p className="px-3 pb-2 text-[12px] font-semibold text-ink-500">
            {n.ten}
          </p>
          <ul className="space-y-0.5">
            {n.items.map((item) => (
              <li key={item.href}>
                <SideLink item={item} active={isActive(pathname, item.href)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Thanh tren (Header) — man rong                                     */
/* ------------------------------------------------------------------ */

function HeaderLink({
  item,
  active,
  variant = "default",
}: {
  item: Item;
  active: boolean;
  variant?: "default" | "landing" | "v2";
}) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center justify-center rounded-lg px-3 text-[14px] transition-colors xl:px-3.5",
        variant !== "default" ? "duration-[var(--m-instant)] ease-[var(--m-ease)]" : "duration-150",
        // Mục đang chọn: vạch vàng ở chân + chữ đậm, không nền màu.
        "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-opacity xl:after:inset-x-3.5",
        variant === "v2"
          ? active
            ? "font-semibold text-white after:bg-[var(--v2-green)] after:opacity-100"
            : "font-medium text-white/75 after:opacity-0 hover:text-white"
          : variant === "landing"
          ? active
            ? "font-semibold text-white after:bg-gold-300 after:opacity-100 group-data-[solid=true]/h:text-navy-900 group-data-[solid=true]/h:after:bg-gold-500"
            : "font-medium text-white/80 after:opacity-0 hover:text-white group-data-[solid=true]/h:text-ink-400 group-data-[solid=true]/h:hover:bg-ink-850 group-data-[solid=true]/h:hover:text-navy-900"
          : active
            ? "font-semibold text-ink-100 after:bg-gold-500 after:opacity-100"
            : "font-medium text-ink-400 after:opacity-0 hover:bg-ink-850 hover:text-ink-100",
      )}
    >
      <span>{item.label}</span>
      {item.badge ? (
        <span
          aria-hidden
          className="ml-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] leading-none font-bold text-white"
        >
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Thanh điều hướng trung tâm trên header: dạng danh sách thoáng đãng,
 * mục active nổi bật dạng capsule mờ như mẫu thiết kế kridx.
 */
export function HeaderNav({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "landing" | "v2";
}) {
  const pathname = usePathname();

  const items: Item[] = [
    TRANG_CHU,
    BANG_TIN,
    KEO,
    BUOI_TAP,
    XEP_HANG,
    THANH_VIEN,
    CAM_NANG,
  ];

  return (
    <nav
      aria-label="Điều hướng chính"
      className={cn("flex items-center justify-center", className)}
    >
      <ul className="flex items-center gap-1 lg:gap-1.5 xl:gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <HeaderLink
              item={item}
              active={isActive(pathname, item.href)}
              variant={variant}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Cụm nút thao tác nhanh trên Header: Tin nhắn & Thông báo (icon + badge).
 * Đặt cạnh Avatar ở góc phải theo chuẩn UX của các ứng dụng hiện đại.
 */
export function HeaderQuickActions({
  unread,
  unreadMessages,
  className,
  variant = "default",
}: {
  unread: number;
  unreadMessages: number;
  className?: string;
  variant?: "default" | "landing" | "v2";
}) {
  // Trang giới thiệu: trên hero (nền navy) icon trắng, qua hero icon navy.
  const landing = variant !== "default";
  const iconLanding =
    "text-white/80 hover:bg-white/10 hover:text-white group-data-[solid=true]/h:text-ink-400 group-data-[solid=true]/h:hover:bg-ink-850 group-data-[solid=true]/h:hover:text-navy-900";
  const pathname = usePathname();
  const isTinNhanActive = isActive(pathname, "/tin-nhan");
  const isThongBaoActive = isActive(pathname, "/thong-bao");

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Nút Tin nhắn */}
      <Link
        href="/tin-nhan"
        prefetch={false}
        aria-label={
          unreadMessages > 0
            ? `Tin nhắn, ${unreadMessages} cuộc trò chuyện chưa đọc`
            : "Tin nhắn"
        }
        aria-current={isTinNhanActive ? "page" : undefined}
        title="Tin nhắn"
        className={cn(
          "relative grid size-10 place-items-center rounded-lg transition-colors",
          landing
            ? iconLanding
            : isTinNhanActive
              ? "bg-ink-850 text-ink-100"
              : "text-ink-400 hover:bg-ink-850 hover:text-ink-100",
        )}
      >
        <MessagesSquare weight="bold" className="size-[18px]" />
        {unreadMessages > 0 ? (
          <span
            aria-hidden
            className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-ink-950 group-data-[solid=false]/h:ring-navy-900"
          >
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        ) : null}
      </Link>

      {/* Nút Thông báo */}
      <Link
        href="/thong-bao"
        prefetch={false}
        aria-label={
          unread > 0 ? `Thông báo, ${unread} thông báo chưa đọc` : "Thông báo"
        }
        aria-current={isThongBaoActive ? "page" : undefined}
        title="Thông báo"
        className={cn(
          "relative grid size-10 place-items-center rounded-lg transition-colors",
          landing
            ? iconLanding
            : isThongBaoActive
              ? "bg-ink-850 text-ink-100"
              : "text-ink-400 hover:bg-ink-850 hover:text-ink-100",
        )}
      >
        <Bell weight="bold" className="size-[18px]" />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-ink-950 group-data-[solid=false]/h:ring-navy-900"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thanh dưới — điện thoại, máy tính bảng                              */
/* ------------------------------------------------------------------ */

/**
 * NĂM SUẤT, VÀ KHÔNG SUẤT NÀO ĐƯỢC PHÍ.
 *
 * Xếp hạng, Cẩm nang, Thành viên nằm trong menu tài khoản với
 * `chiDienThoai: true` — thanh bên chỉ hiện từ `lg` nên không đỡ được chỗ
 * này. Thêm mục vào thanh bên mà không có ở đây thì phải thêm vào menu.
 */
export function BottomNav({
  unread,
  unreadMessages,
}: {
  unread: number;
  unreadMessages: number;
}) {
  const pathname = usePathname();
  const items = [
    BANG_TIN,
    KEO,
    BUOI_TAP,
    tinNhan(unreadMessages),
    thongBao(unread),
  ];

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                prefetch={false}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex min-h-14 flex-col items-center justify-center gap-1 pt-2 pb-1.5"
              >
                {/* Vạch vàng trên mép, chỉ mục đang mở */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-gold-500 transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="relative">
                  <Icon
                    weight="bold"
                    className={cn(
                      "size-[22px] transition-colors",
                      active ? "text-ink-100" : "text-ink-500",
                    )}
                  />
                  {item.badge ? (
                    <Counter
                      value={item.badge}
                      dvi={item.badgeDvi ?? "thông báo"}
                      className="absolute -top-1.5 -right-2.5 ring-2 ring-ink-950"
                    />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-none transition-colors",
                    active
                      ? "font-bold text-ink-100"
                      : "font-medium text-ink-500",
                  )}
                >
                  {item.short}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
