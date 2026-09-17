"use client";

import {
  Bell,
  Home,
  CalendarDays,
  BookOpen,
  Newspaper,
  Swords,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  MagneticIcon,
  MagneticItem,
  MagneticRow,
  useMagnetic,
} from "@/components/magnetic-nav";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  short: string;
  icon: ReactNode;
  badge?: number;
};

function useItems(unread: number): Item[] {
  return [
    {
      href: "/",
      label: "Trang chủ",
      short: "Nhà",
      icon: <Home className="size-[18px]" strokeWidth={2} />,
    },
    {
      href: "/bang-tin",
      label: "Bảng tin",
      short: "Tin",
      icon: <Newspaper className="size-[18px]" strokeWidth={2} />,
    },
    {
      href: "/keo",
      label: "Kèo",
      short: "Kèo",
      icon: <Swords className="size-[18px]" strokeWidth={2} />,
    },
    {
      href: "/buoi-tap",
      label: "Buổi tập",
      short: "Buổi tập",
      icon: <CalendarDays className="size-[18px]" strokeWidth={2} />,
    },
    {
      href: "/cam-nang",
      label: "Cẩm nang",
      short: "Cẩm nang",
      icon: <BookOpen className="size-[18px]" strokeWidth={2} />,
    },
    {
      href: "/bang-phong-than",
      label: "Xếp hạng",
      short: "Hạng",
      icon: <Trophy className="size-[18px]" strokeWidth={2} />,
    },
    {
      href: "/thong-bao",
      label: "Thông báo",
      short: "Báo",
      icon: <Bell className="size-[18px]" strokeWidth={2} />,
      badge: unread,
    },
  ];
}

function isActive(pathname: string, href: string) {
  // "/" phải so khớp tuyệt đối, nếu không mọi đường dẫn đều tính là đang ở trang chủ.
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Counter({ value }: { value: number }) {
  return (
    <span
      aria-label={`${value} thông báo chưa đọc`}
      className="absolute -top-1.5 -right-2 grid min-w-[17px] place-items-center rounded-full bg-rose-600 px-1 text-[10px] leading-[17px] font-bold text-white ring-2 ring-ink-900"
    >
      {value > 9 ? "9+" : value}
    </span>
  );
}

/** Thanh dưới cùng — dùng trên điện thoại. */
export function BottomNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  // 7 mục là quá chật trên điện thoại. Xếp hạng và Cẩm nang đã có ở menu
  // tài khoản và ở thanh trên, nên cắt khỏi thanh dưới.
  const items = useItems(unread).filter(
    (i) => i.href !== "/bang-phong-than" && i.href !== "/cam-nang",
  );

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-lg px-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2"
              >
                <span
                  className={cn(
                    "relative grid h-7 w-12 place-items-center rounded-lg transition-all duration-200",
                    active ? "bg-navy-900 text-gold-300" : "text-ink-500",
                  )}
                >
                  {item.icon}
                  {item.badge ? <Counter value={item.badge} /> : null}
                </span>
                <span
                  className={cn(
                    "text-[10.5px] leading-none font-semibold transition-colors",
                    active ? "text-navy-900" : "text-ink-500",
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

/**
 * Một mục của thanh trên, nở ra và nhấc lên khi con trỏ lại gần.
 *
 * Tách thành component riêng vì `useMagnetic` là hook — không gọi được
 * trong thân vòng lặp `map`.
 */
function TopNavItem({ item, active }: { item: Item; active: boolean }) {
  const { ref, scale, y, iconScale } = useMagnetic();

  return (
    <MagneticItem
      ref={ref}
      style={{ scale, y }}
      // `origin-bottom` để mục nở lên trên chứ không đội vào mép dưới của
      // thanh header và tràn ra ngoài.
      className="origin-bottom"
    >
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors duration-200",
          active
            ? "bg-ink-850 text-navy-900"
            : "text-ink-500 hover:bg-ink-850/70 hover:text-ink-200",
        )}
      >
        <MagneticIcon style={{ scale: iconScale }} className="relative block">
          {item.icon}
          {item.badge ? <Counter value={item.badge} /> : null}
        </MagneticIcon>
        {item.label}
        {active && (
          <span
            aria-hidden
            className="bg-gradient-gold absolute inset-x-3 -bottom-px h-[2.5px] rounded-full"
          />
        )}
      </Link>
    </MagneticItem>
  );
}

/** Điều hướng ngang — dùng trên màn hình lớn. */
export function TopNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  const items = useItems(unread);

  return (
    <nav aria-label="Điều hướng chính" className="hidden md:block">
      <MagneticRow className="flex items-center gap-0.5">
        {items.map((item) => (
          <TopNavItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
      </MagneticRow>
    </nav>
  );
}
