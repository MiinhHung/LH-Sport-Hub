"use client";

import {
  Bell,
  Home,
  CalendarDays,
  BookOpen,
  MessagesSquare,
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
  /** Đơn vị của con số trên chấm báo, cho máy đọc màn hình. */
  badgeDvi?: string;
};

function useItems(unread: number): Item[] {
  return [
    /*
      TRỎ VÀO `/?xem=gioi-thieu`, KHÔNG PHẢI `/` TRƠN.

      Từ lúc "/" tự chuyển sang Bảng tin cho người đã đăng nhập, một
      nút ghi "Trang chủ" mà trỏ vào "/" sẽ lặng lẽ nhảy sang Bảng tin
      — bấm vào thấy mình ở chỗ khác mà không hiểu vì sao, và nút cũng
      không bao giờ sáng lên vì đường dẫn không khớp.

      Đổi luôn nhãn thành "Giới thiệu" cho đúng thứ nó mở ra. Gọi là
      "Trang chủ" thì sai từ lâu rồi: với người trong team, nhà là Bảng
      tin chứ không phải trang bán hàng cho người lạ.
    */
    {
      href: "/?xem=gioi-thieu",
      label: "Giới thiệu",
      short: "Giới thiệu",
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
      badgeDvi: "thông báo",
    },
  ];
}

function isActive(pathname: string, href: string) {
  // Cắt phần truy vấn: mục "Giới thiệu" trỏ vào "/?xem=gioi-thieu", mà
  // `usePathname` chỉ trả về "/" nên so cả chuỗi sẽ không bao giờ khớp.
  const duong = href.split("?")[0];

  // "/" phải so khớp tuyệt đối, nếu không mọi đường dẫn đều tính là đang ở trang chủ.
  if (duong === "/") return pathname === "/";
  return pathname === duong || pathname.startsWith(`${duong}/`);
}

/**
 * `dvi` là đơn vị của con số — "thông báo" hay "cuộc trò chuyện".
 *
 * Trước đây viết cứng "thông báo chưa đọc", đúng khi chấm này chỉ dùng
 * cho chuông. Giờ Tin nhắn cũng có chấm, mà máy đọc màn hình đọc lên
 * thành "3 thông báo chưa đọc" khi thật ra là 3 cuộc trò chuyện.
 */
function Counter({ value, dvi }: { value: number; dvi: string }) {
  return (
    <span
      aria-label={`${value} ${dvi} chưa đọc`}
      className="absolute -top-1.5 -right-2 grid min-w-[17px] place-items-center rounded-full bg-rose-600 px-1 text-[10px] leading-[17px] font-bold text-white ring-2 ring-ink-900"
    >
      {value > 9 ? "9+" : value}
    </span>
  );
}

/**
 * Thanh dưới cùng — dùng trên điện thoại.
 *
 * NĂM SUẤT, VÀ KHÔNG SUẤT NÀO ĐƯỢC PHÍ.
 *
 * Trước đây suất đầu dành cho "Trang chủ" tức trang giới thiệu — trang
 * viết để thuyết phục người CHƯA dùng app. Người trong team đã đăng nhập
 * gần như không bao giờ cần tới nó, mà lỡ chạm vào thì phải tải một quả
 * cầu 3D, một vòng quay ghim 2880px, một video và một trò đố vui. Bảng
 * tin thì đã có hai lối vào (nút "Tin" ở đây và logo ở thanh trên).
 *
 * Hệ quả của suất bị phí đó nằm ngay trong `layout.tsx`: Tin nhắn bị đẩy
 * lên thành một biểu tượng nhỏ ở góc thanh trên, kèm chú thích "thanh
 * dưới trên điện thoại đã đủ 5 mục". Giờ trả suất đó cho Tin nhắn —
 * nhắn riêng là việc người ta làm hằng ngày, trang giới thiệu thì không.
 *
 * Xếp hạng và Cẩm nang vẫn nằm ngoài thanh này, nhưng CẢ HAI phải có
 * trong menu tài khoản với `chiDienThoai: true` — thanh trên chỉ hiện từ
 * `md` nên không đỡ được chỗ này. Trước đây chú thích ở đây nói là "đã
 * có ở menu tài khoản" trong khi Cẩm nang thì chưa, và thế là nó mất lối
 * vào trên điện thoại suốt một thời gian dài.
 */
export function BottomNav({
  unread,
  unreadMessages,
}: {
  unread: number;
  unreadMessages: number;
}) {
  const pathname = usePathname();
  const tatCa = useItems(unread);
  const lay = (href: string) => tatCa.find((i) => i.href === href)!;

  const items: Item[] = [
    lay("/bang-tin"),
    lay("/keo"),
    lay("/buoi-tap"),
    {
      href: "/tin-nhan",
      label: "Tin nhắn",
      short: "Nhắn",
      icon: <MessagesSquare className="size-[18px]" strokeWidth={2} />,
      badge: unreadMessages,
      badgeDvi: "cuộc trò chuyện",
    },
    lay("/thong-bao"),
  ];

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
                  {item.badge ? (
                    <Counter
                      value={item.badge}
                      dvi={item.badgeDvi ?? "thông báo"}
                    />
                  ) : null}
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
        /*
          `aria-label` LÀ THỨ DUY NHẤT CÒN NÓI TÊN MỤC NÀY.

          Từ lúc thanh trên chỉ còn biểu tượng, không còn dòng chữ nào
          trong cây tài liệu để máy đọc màn hình đọc lên. Bỏ dòng này đi
          thì cả thanh điều hướng thành bảy liên kết không tên.

          Không dùng `title` nữa: mẹo chỉ dẫn gốc của trình duyệt đợi
          gần một giây mới hiện, mang kiểu dáng của hệ điều hành chứ
          không phải của app, và không bao giờ hiện khi đi bằng bàn
          phím. Có mẹo riêng ở dưới rồi, để cả hai thì rê chuột một lúc
          sẽ thấy hai cái chồng nhau.
        */
        aria-label={item.label}
        className={cn(
          /* `min-w-10` + `px-2` chứ không `size-10`: khi chỉ có biểu
             tượng thì ô vuông đúng 40px, còn lúc nhãn chữ hiện ra (máy
             cảm ứng màn rộng) thì ô tự nở theo chữ thay vì cắt mất. */
          "group relative flex h-10 min-w-10 items-center justify-center rounded-lg px-2 transition-colors duration-200",
          active
            ? "bg-ink-850 text-ink-100"
            : "text-ink-500 hover:bg-ink-850/70 hover:text-ink-200",
        )}
      >
        <MagneticIcon style={{ scale: iconScale }} className="relative block">
          {item.icon}
          {item.badge ? (
            <Counter value={item.badge} dvi={item.badgeDvi ?? "thông báo"} />
          ) : null}
        </MagneticIcon>
        {/*
          Nhãn chữ giờ chỉ còn hiện trên máy KHÔNG RÊ CHUỘT ĐƯỢC.

          Mẹo chỉ dẫn sống nhờ `:hover`. Máy tính bảng màn rộng (iPad
          ngang là 1366px) không có trạng thái rê chuột, nên nếu cứ ẩn
          nhãn thì ở đó bảy biểu tượng thành bảy câu đố — trước khi sửa
          họ vẫn đọc được chữ. Giữ lại cho họ.

          NGƯỠNG 1180px LÀ SỐ ĐO CŨ, VẪN CÒN ĐÚNG. Bảy mục kèm nhãn
          chiếm 668px, phần còn lại của thanh (logo, chuông tin nhắn,
          công tắc nền, ảnh đại diện) chiếm 293px, cộng lề thì cần
          khoảng 1113px. Chọn 1180 vì header bị chặn ở max-w-6xl =
          1152px: từ đó trở lên cửa sổ rộng thêm cũng không cho thêm
          chỗ, nên mọi màn lớn là MỘT trường hợp duy nhất — đo trường
          hợp đó thì vừa đủ, còn hở 20px. Thêm mục mới hoặc đặt nhãn
          dài hơn thì phải đo lại.

          `whitespace-nowrap` để nhãn không tự bẻ làm hai dòng kiểu
          "Trang / chủ", trông như chữ dựng đứng.
        */}
        <span className="ml-2 hidden text-[13.5px] font-semibold whitespace-nowrap min-[1180px]:pointer-coarse:inline">
          {item.label}
        </span>

        {/*
          Mẹo chỉ dẫn: tên mục, thả xuống dưới biểu tượng.

          `aria-hidden` vì `aria-label` ở trên đã mang đúng chuỗi này —
          để cả hai thì máy đọc màn hình đọc tên mục hai lần.

          Hiện cả khi đi bằng bàn phím (`group-focus-visible`), không chỉ
          khi rê chuột: người dùng phím Tab cũng cần biết mình đang đứng
          ở mục nào.

          Thả XUỐNG chứ không bật lên: thanh header cao 64px và dính ở
          đỉnh màn hình, không có chỗ phía trên. Header không cắt tràn
          nên mẹo rơi ra ngoài được.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 scale-95 rounded-lg bg-navy-900 px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap text-white opacity-0 shadow-[var(--shadow-card)] transition-[opacity,transform] duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          {item.label}
        </span>
        {active && (
          <span
            aria-hidden
            className="bg-gradient-gold absolute inset-x-2 -bottom-px h-[2.5px] rounded-full"
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
