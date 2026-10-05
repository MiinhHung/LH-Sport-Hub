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
                /*
                KHÔNG TẢI TRƯỚC TOÀN BỘ THANH ĐIỀU HƯỚNG.

                Đo trên bản build: mở MỘT trang sinh ra 18 lần gọi
                `auth.getUser()`. Chỉ 2 lần là của trang đang mở; 16 lần
                còn lại là Next tự tải trước tám đường dẫn trên thanh
                điều hướng — và tám cái đó bị đếm hai lần vì thanh trên
                lẫn thanh dưới cùng dựng một bộ link, một cái chỉ ẩn bằng
                CSS chứ vẫn nằm trong cây.

                Mỗi lần tải trước là một yêu cầu đầy đủ: qua proxy, xác
                minh phiên với Supabase (5 truy vấn nội bộ cộng một vòng
                mạng), rồi dựng cả trang ở máy chủ. Tức mở một trang kéo
                theo chín trang nữa mà người dùng chưa hề bấm vào.

                `prefetch={false}` KHÔNG tắt hẳn: Next vẫn tải trước khi
                con trỏ rê vào link. Nghĩa là vẫn nhanh đúng lúc cần, chỉ
                bỏ phần đoán mò tám trang một lúc.
              */
                prefetch={false}
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
                    active ? "text-ink-100" : "text-ink-500",
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
        // Cùng lý do với thanh dưới — xem ghi chú dài ở trên.
        prefetch={false}
        aria-current={active ? "page" : undefined}
        // Nhãn bị ẩn ở màn hình vừa nên luôn kèm tên đầy đủ cho máy đọc
        // màn hình và cho mẹo chỉ dẫn khi rê chuột.
        aria-label={item.label}
        title={item.label}
        className={cn(
          "relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-200 min-[1180px]:px-3",
          active
            ? "bg-ink-850 text-ink-100"
            : "text-ink-500 hover:bg-ink-850/70 hover:text-ink-200",
        )}
      >
        <MagneticIcon style={{ scale: iconScale }} className="relative block">
          {item.icon}
          {item.badge ? <Counter value={item.badge} /> : null}
        </MagneticIcon>
        {/*
          CHỮ KHÔNG ĐƯỢC XUỐNG DÒNG, và chỉ hiện khi đủ chỗ.

          Đo được: bảy mục kèm nhãn chiếm 668px, phần còn lại của thanh
          (logo, chuông tin nhắn, công tắc nền, ảnh đại diện) chiếm 293px,
          cộng lề và khoảng cách thì cần khoảng 1113px. Khung chứa chúng co lại
          theo cửa sổ. Trước đây không chặn xuống dòng nên mỗi nhãn tự bẻ
          làm hai — "Trang / chủ" — trông như chữ dựng đứng.

          Chỉ thêm `whitespace-nowrap` thôi thì hết bẻ dòng nhưng cả hàng
          tràn ra đè lên chuông tin nhắn và ảnh đại diện. Nên dưới ngưỡng
          1180px chỉ để lại biểu tượng; tên vẫn còn ở `aria-label` và
          `title`.

          Ngưỡng 1180 chọn vì thanh header bị chặn ở max-w-6xl = 1152px:
          từ 1184px trở lên, cửa sổ rộng thêm cũng không cho thêm chỗ nào,
          nên bố cục ở mọi màn hình lớn là MỘT trường hợp duy nhất. Đo
          trường hợp đó: vừa đủ, còn hở 20px tới chuông tin nhắn. Nghĩa là
          thêm mục mới hoặc đặt nhãn dài hơn thì phải đo lại chỗ này.
        */}
        <span className="hidden min-[1180px]:inline">{item.label}</span>
        {active && (
          <span
            aria-hidden
            className="bg-gradient-gold absolute inset-x-2.5 -bottom-px h-[2.5px] rounded-full min-[1180px]:inset-x-3"
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
