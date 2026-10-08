"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Nút có mũi tên trượt qua và một vòng tròn loang ra lấp đầy khi rê chuột.
 *
 * Dựng lại từ mẫu 21st.dev, sửa bốn chỗ:
 *
 *  1. CHẠY BẰNG `transform`, KHÔNG PHẢI `left`/`right`/`width`/`height`.
 *     Mẫu cho hai mũi tên chạy bằng `left`/`right` và cho vòng tròn phình
 *     từ 16px lên 220px bằng `width`/`height`. Cả bốn thuộc tính đó đều
 *     bắt trình duyệt tính lại bố cục ở mỗi khung hình. Ở đây mũi tên
 *     trượt bằng `translate` và vòng tròn để nguyên cỡ rồi phóng bằng
 *     `scale` — nhìn y hệt, nhưng do tầng ghép ảnh lo.
 *
 *  2. MÀU LẤY TỪ HỆ MÀU, không phải #111111 viết cứng. Nút này phải sống
 *     ở ba chỗ khác hẳn nhau: nền trắng của app, nền tối của app, và nền
 *     navy của hero. Một màu cứng thì hai chỗ còn lại hỏng.
 *
 *  3. RA ĐƯỢC CẢ THẺ LINK. Mẫu chỉ có `button`, mà bốn chỗ cần dùng đều
 *     là đường dẫn — bọc `button` trong thẻ a là HTML sai.
 *
 *  4. CÓ VIỀN TIÊU ĐIỂM. Mẫu không có, nên người dùng bàn phím không biết
 *     mình đang ở nút nào.
 */

/**
 * Ba bảng màu.
 *
 * `hero` và `heroQuiet` viết cứng mã màu, không dùng token: hero nằm
 * trong trang giới thiệu vốn đã ghim nền sáng, nhưng bản thân nó lại là
 * một khối nền navy — token nền sáng đặt lên đó sẽ chìm.
 */
const TONES = {
  /** Trên nền trang của app, đổi theo chế độ sáng/tối. */
  app: {
    nut: "border-gold-600/45 text-ink-100 hover:border-transparent hover:text-navy-950",
    nen: "bg-transparent",
    vong: "bg-gradient-gold",
  },
  /** Viền vàng trên nền navy. Dùng cho hành động phụ có sức nặng. */
  hero: {
    nut: "border-[#dcae42]/60 text-[#f2ede3] hover:border-transparent hover:text-[#00112e]",
    nen: "bg-transparent",
    vong: "bg-[#dcae42]",
  },
  /**
   * HÀNH ĐỘNG CHÍNH CỦA HERO — TÔ ĐẶC, KHÔNG PHẢI VIỀN.
   *
   * Trước đây nút chính và nút phụ đều là viền rỗng, chỉ khác nhau ở
   * màu viền. Đo trên nền navy: viền vàng của nút chính đạt 1,09:1,
   * viền kem của nút phụ 1,15:1 — cả hai đều dưới ngưỡng nhìn thấy,
   * nên thực tế hai nút giống hệt nhau. Tệ hơn, nút phụ còn RỘNG hơn
   * (210px so với 183px), nên nếu mắt có chọn một cái thì nó chọn nhầm.
   *
   * Nền vàng đặc với chữ navy đạt 9,0:1 — khỏi cần ai so sánh viền.
   * Vòng loang khi rê chuột đổi sang màu kem (navy trên kem 16,1:1) để
   * nút vẫn giữ được cú chuyển động riêng của nó.
   */
  heroSolid: {
    nut: "border-transparent text-[#00112e] hover:text-[#00112e]",
    nen: "bg-[#dcae42]",
    vong: "bg-[#f2ede3]",
  },
  /** Hành động phụ trên nền navy của hero. */
  heroQuiet: {
    nut: "border-[#f2ede3]/35 text-[#f2ede3] hover:border-transparent hover:text-[#00112e]",
    nen: "bg-transparent",
    vong: "bg-[#f2ede3]",
  },
} as const;

const SIZES = {
  md: "h-11 pr-9 pl-9 text-[12px] tracking-[0.14em] uppercase",
  lg: "h-12 pr-10 pl-10 text-[12.5px] tracking-[0.16em] uppercase",
} as const;

export type FlowTone = keyof typeof TONES;
export type FlowSize = keyof typeof SIZES;

function noiDung(text: string, tone: FlowTone) {
  const { vong } = TONES[tone];
  return (
    <>
      {/*
        Mũi tên đi vào từ bên trái. Đứng sẵn ở vị trí cuối rồi đẩy ra
        ngoài bằng translate, chứ không đổi `left` — xem ghi chú đầu tệp.
      */}
      <ArrowRight
        aria-hidden
        className="absolute left-4 z-10 size-4 -translate-x-[320%] opacity-0 transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-0 group-hover:opacity-100"
      />

      <span className="relative z-10 -translate-x-3 transition-transform duration-[800ms] ease-out group-hover:translate-x-3">
        {text}
      </span>

      {/* Vòng tròn loang ra. Để sẵn cỡ lớn rồi thu về 0 bằng scale. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-1/2 size-[280px] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full opacity-0 transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-100 group-hover:opacity-100",
          vong,
        )}
      />

      {/* Mũi tên đi ra phía phải */}
      <ArrowRight
        aria-hidden
        className="absolute right-4 z-10 size-4 transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-[320%] group-hover:opacity-0"
      />
    </>
  );
}

function lop(tone: FlowTone, size: FlowSize, className?: string) {
  return cn(
    "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden",
    "rounded-full border-[1.5px] font-bold whitespace-nowrap outline-none",
    TONES[tone].nen,
    "transition-[color,border-color,border-radius] duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
    "hover:rounded-[14px] active:scale-[0.97]",
    "focus-visible:ring-4 focus-visible:ring-gold-400/35",
    TONES[tone].nut,
    SIZES[size],
    className,
  );
}

export function FlowButton({
  text,
  tone = "app",
  size = "md",
  className,
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  text: string;
  tone?: FlowTone;
  size?: FlowSize;
}) {
  return (
    <button className={lop(tone, size, className)} {...props}>
      {noiDung(text, tone)}
    </button>
  );
}

export function FlowLink({
  text,
  tone = "app",
  size = "md",
  className,
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "children"> & {
  text: string;
  tone?: FlowTone;
  size?: FlowSize;
}) {
  // Neo trong cùng trang (href bắt đầu bằng "#") thì dùng thẻ a thường:
  // cho `Link` một đường dẫn chỉ có mảnh neo là bắt bộ định tuyến làm
  // việc thừa, trong khi trình duyệt tự cuộn được.
  const laNeo = typeof href === "string" && href.startsWith("#");

  if (laNeo) {
    return (
      <a href={href as string} className={lop(tone, size, className)}>
        {noiDung(text, tone)}
      </a>
    );
  }

  return (
    <Link href={href} className={lop(tone, size, className)} {...props}>
      {noiDung(text, tone)}
    </Link>
  );
}
