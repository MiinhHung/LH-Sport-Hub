"use client";

import {
  Bell,
  Menu,
  MessagesSquare,
  Swords,
  X,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme";
import { UserMenu } from "@/components/user-menu";
import type { RoleKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export type NavItem = {
  href: string;
  label: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/bang-tin", label: "Bảng tin" },
  { href: "/keo", label: "Kèo" },
  { href: "/buoi-tap", label: "Buổi tập" },
  { href: "/bang-phong-than", label: "Xếp hạng" },
  { href: "/thanh-vien", label: "Thành viên" },
  { href: "/cam-nang", label: "Cẩm nang" },
];

function isItemActive(pathname: string, href: string) {
  const base = href.split("?")[0];
  if (base === "/" || base === "/gioi-thieu") {
    return pathname === "/" || pathname === "/gioi-thieu";
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

export interface SiteHeaderProps {
  profile?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: RoleKey;
  } | null;
  unread?: number;
  unreadMessages?: number;
  variant?: "default" | "landing";
}

/**
 * SiteHeader thể thao cao cấp:
 * - Dấu gạch vàng layoutId="nav-underline" trượt mượt giữa các mục khi hover, hồi về active khi rời chuột.
 * - Sticky, tự động co nhỏ (80px -> 64px) và bật kính mờ backdrop-blur-xl khi cuộn > 24px.
 * - Tự động ẩn khi cuộn xuống và trượt hiện khi cuộn lên.
 * - Nút "Vào bảng tin" quét sáng thể thao + icon xoay.
 * - Mobile Sheet trượt từ bên phải với mục active có thanh vàng bên trái.
 */
export function SiteHeader({
  profile,
  unread = 0,
  unreadMessages = 0,
  variant = "landing",
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [hoveredHref, setHoveredHref] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const diff = latest - lastScrollY.current;

    // Trạng thái co nhỏ & kính mờ
    if (latest > 24 && !scrolled) {
      setScrolled(true);
    } else if (latest <= 24 && scrolled) {
      setScrolled(false);
    }

    // Trạng thái ẩn/hiện theo chiều cuộn
    if (latest > 120 && diff > 8) {
      // Đang cuộn xuống
      setVisible(false);
    } else if (diff < -6 || latest <= 60) {
      // Đang cuộn lên hoặc đang ở đỉnh trang
      setVisible(true);
    }

    lastScrollY.current = latest;
  });

  // Tìm mục đang active trong danh sách
  const activeItem = React.useMemo(() => {
    return NAV_ITEMS.find((item) => isItemActive(pathname, item.href)) || NAV_ITEMS[0];
  }, [pathname]);

  // Mục được hiển thị gạch vàng: mục đang hover hoặc mục active
  const currentIndicatorHref = hoveredHref || activeItem.href;

  // Đóng mobile sheet khi đổi route theo pattern chuẩn của React
  const [prevPath, setPrevPath] = React.useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
  }

  // Khoá cuộn body khi mobile sheet mở
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /*
   * MENU MOBILE LÀ HỘP THOẠI: mở ra thì đưa con trỏ bàn phím vào trong,
   * Esc thì đóng, Tab không lọt ra trang phía sau, đóng xong trả con trỏ
   * về đúng chỗ cũ (thường là nút hamburger).
   */
  const drawerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!mobileOpen) return;
    const truocKhiMo = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    drawer?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawer) return;
      const nutBam = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (nutBam.length === 0) return;
      const dau = nutBam[0];
      const cuoi = nutBam[nutBam.length - 1];
      const dangO = document.activeElement;
      if (e.shiftKey && (dangO === dau || dangO === drawer)) {
        e.preventDefault();
        cuoi.focus();
      } else if (!e.shiftKey && dangO === cuoi) {
        e.preventDefault();
        dau.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      truocKhiMo?.focus?.();
    };
  }, [mobileOpen]);

  const isDarkNavy = true; // Header thể thao luôn giữ nhận diện navy đậm đồng nhất

  const goToHomeWithIntro = React.useCallback((e: React.MouseEvent) => {
    // Ctrl/Cmd/Shift + bấm hoặc bấm chuột giữa là mở tab mới: để trình
    // duyệt làm việc của nó, đừng chặn.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (window.location.pathname === "/" || window.location.pathname === "/gioi-thieu") {
      window.location.reload();
    } else {
      window.location.href = "/";
    }
  }, []);

  return (
    <>
      <header
        className={cn(
          variant === "landing"
            ? "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out"
            : "sticky top-0 z-50 transition-all duration-300 ease-out",
          visible ? "translate-y-0" : "-translate-y-full",
          scrolled
            ? "border-b border-white/10 bg-navy-950/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,13,38,0.45)]"
            : variant === "landing"
              ? "bg-transparent border-b border-transparent"
              : "border-b border-white/10 bg-navy-950/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,13,38,0.3)]",
        )}
      >
        {/* Lưới cầu lông đan xéo chìm nghệ thuật khi cuộn */}
        {scrolled && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(45deg,rgba(232,197,106,0.08)_0,rgba(232,197,106,0.08)_1px,transparent_0,transparent_28px),repeating-linear-gradient(-45deg,rgba(232,197,106,0.08)_0,rgba(232,197,106,0.08)_1px,transparent_0,transparent_28px)]"
          />
        )}
        <div
          className={cn(
            "relative mx-auto flex max-w-7xl items-center justify-between px-3.5 transition-all duration-300 sm:px-5 lg:px-6 xl:px-8",
            scrolled ? "h-15 sm:h-16" : "h-16 sm:h-[70px]",
          )}
        >
          {/* Cụm Logo bên trái */}
          <Link
            href="/"
            onClick={goToHomeWithIntro}
            className="group flex shrink-0 items-center gap-2 transition-transform duration-200 hover:scale-[1.02] sm:gap-2.5"
            aria-label="Light Human Sport Hub"
          >
            <div className="relative shrink-0">
              <Image
                src="/logo-light.png"
                alt=""
                width={656}
                height={562}
                priority
                className={cn(
                  "w-auto object-contain transition-all duration-300",
                  scrolled ? "h-7.5 sm:h-8" : "h-8 sm:h-9",
                )}
              />
            </div>
            <div className="leading-tight shrink-0">
              <span
                className={cn(
                  "font-display block font-black tracking-tight text-white transition-colors duration-200",
                  scrolled ? "text-[14.5px]" : "text-[15.5px] sm:text-[16.5px]",
                )}
              >
                Light Human
              </span>
              <span className="block text-[10.5px] font-bold tracking-wider text-gold-400 uppercase sm:text-[11px]">
                Sport Hub
              </span>
            </div>
          </Link>

          {/* Cụm Menu trung tâm với gạch vàng trượt (layoutId="nav-underline") */}
          <nav
            aria-label="Điều hướng chính"
            onMouseLeave={() => setHoveredHref(null)}
            className="hidden items-center shrink-0 lg:flex"
          >
            <ul className="flex items-center gap-0.5 xl:gap-1 flex-nowrap shrink-0">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(pathname, item.href);
                const isIndicatorTarget = currentIndicatorHref === item.href;
                const isHome = item.href === "/" || item.href === "/gioi-thieu";

                return (
                  <li key={item.href} className="relative shrink-0">
                    <Link
                      href={item.href}
                      prefetch={false}
                      onClick={isHome ? goToHomeWithIntro : undefined}
                      onMouseEnter={() => setHoveredHref(item.href)}
                      onFocus={() => setHoveredHref(item.href)}
                      onBlur={() => setHoveredHref(null)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-9 items-center justify-center rounded-lg px-2 text-[13px] transition-colors duration-200 outline-none whitespace-nowrap shrink-0 xl:h-9.5 xl:px-3 xl:text-[13.5px]",
                        active
                          ? "font-semibold text-white"
                          : "font-medium text-white/70 hover:text-white",
                        "focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950",
                      )}
                    >
                      <span className="whitespace-nowrap">{item.label}</span>

                      {/* Dấu gạch vàng mượt trượt theo hover / active */}
                      {isIndicatorTarget && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute bottom-1 inset-x-2 h-[2px] rounded-full bg-gold-400 shadow-[0_0_12px_rgba(212,160,23,0.7)]"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Cụm Thao tác bên phải */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {profile ? (
              <>
                {/* Nút hành động thể thao phong cách "Smash" (Tạo kèo khi ở bảng tin, hoặc Vào bảng tin khi ở trang khác) */}
                <Link
                  href={pathname === "/bang-tin" ? "/keo/tao" : "/bang-tin"}
                  prefetch={false}
                  aria-label={pathname === "/bang-tin" ? "Tạo kèo mới" : "Vào bảng tin"}
                  className="group relative hidden shrink-0 overflow-hidden rounded-full border border-gold-400/40 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 px-3 py-1.5 text-xs font-bold text-navy-950 shadow-[0_2px_14px_rgba(212,160,23,0.35)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_4px_20px_rgba(212,160,23,0.55)] active:scale-95 sm:inline-flex items-center gap-1.5 xl:px-3.5 xl:py-2 xl:text-[13px]"
                >
                  {/* Vệt sáng quét ngang qua nút khi hover */}
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />

                  <Swords
                    className="size-3.5 text-navy-950 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 xl:size-4"
                    strokeWidth={2.2}
                  />
                  <span className="whitespace-nowrap font-extrabold tracking-tight">
                    {pathname === "/bang-tin" ? "Tạo kèo" : "Vào bảng tin"}
                  </span>
                </Link>

                <div className="hidden h-4 w-px bg-white/15 sm:block shrink-0" aria-hidden />

                {/* Tin nhắn & chuông thông báo */}
                <div className="hidden items-center gap-1 sm:flex shrink-0">
                  <Link
                    href="/tin-nhan"
                    prefetch={false}
                    aria-label={`Tin nhắn, ${unreadMessages} cuộc trò chuyện chưa đọc`}
                    className="relative flex size-8.5 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white shrink-0 sm:size-9"
                  >
                    <MessagesSquare className="size-[18px]" strokeWidth={2} />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs ring-2 ring-navy-950">
                        <span className="relative">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/thong-bao"
                    prefetch={false}
                    aria-label={`Thông báo, ${unread} thông báo chưa đọc`}
                    className="relative flex size-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Bell className="size-[18px]" strokeWidth={2} />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-gold-400 text-[10px] font-bold text-navy-950 shadow-xs ring-2 ring-navy-950">
                        <span className="relative">{unread > 9 ? "9+" : unread}</span>
                      </span>
                    )}
                  </Link>
                </div>

                <div className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden />

                <ThemeToggle />

                {/* Avatar người dùng */}
                <UserMenu
                  id={profile.id}
                  fullName={profile.fullName}
                  avatarUrl={profile.avatarUrl}
                  role={profile.role}
                />
              </>
            ) : (
              <>
                <Link
                  href="/dang-nhap"
                  prefetch={false}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-gold-400/40 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 px-4 py-2 text-[13.5px] font-extrabold text-navy-950 shadow-[0_2px_14px_rgba(212,160,23,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-95"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                  <span>Đăng nhập</span>
                </Link>

                <ThemeToggle />
              </>
            )}

            {/* Nút Hamburger cho Mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
              className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white/90 hover:bg-white/10 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Sheet trượt từ bên phải */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Lớp phủ mờ nền */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm lg:hidden"
              aria-hidden
            />

            {/* Sheet nội dung trượt từ phải sang */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu điều hướng"
              tabIndex={-1}
              className="fixed inset-y-0 right-0 z-50 flex outline-none w-full max-w-xs flex-col border-l border-white/10 bg-navy-950/95 p-6 shadow-2xl backdrop-blur-2xl lg:hidden"
            >
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <Link
                  href="/"
                  onClick={(e) => {
                    setMobileOpen(false);
                    goToHomeWithIntro(e);
                  }}
                  className="font-display text-[15px] font-black text-white hover:text-gold-300 transition-colors"
                >
                  LH SPORT HUB
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Đóng menu"
                  className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Danh sách mục menu xuất hiện so le (stagger) */}
              <nav className="flex-1 overflow-y-auto py-6">
                <ul className="space-y-1.5">
                  {NAV_ITEMS.map((item, index) => {
                    const active = isItemActive(pathname, item.href);
                    const isHome = item.href === "/" || item.href === "/gioi-thieu";

                    return (
                      <motion.li
                        key={item.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * index, duration: 0.3 }}
                      >
                        <Link
                          href={item.href}
                          prefetch={false}
                          onClick={(e) => {
                            setMobileOpen(false);
                            if (isHome) {
                              goToHomeWithIntro(e);
                            }
                          }}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group flex items-center justify-between rounded-xl px-4 py-3 text-[15px] transition-colors",
                            active
                              ? "bg-white/10 font-bold text-gold-300"
                              : "font-medium text-white/75 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            {/* Thanh gạch vàng ở mép trái chỉ mục active */}
                            <span
                              className={cn(
                                "h-4 w-1 rounded-full bg-gold-400 transition-opacity",
                                active ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span>{item.label}</span>
                          </span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Chân menu mobile */}
              <div className="border-t border-white/10 pt-4">
                <Link
                  href={profile ? "/bang-tin" : "/dang-nhap"}
                  prefetch={false}
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 py-3 text-[14px] font-bold text-navy-950 shadow-md transition-all active:scale-95"
                >
                  <Swords className="size-4" strokeWidth={2.2} />
                  <span>{profile ? "Vào bảng tin" : "Đăng nhập ngay"}</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
