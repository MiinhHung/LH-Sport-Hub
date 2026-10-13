import Link from "next/link";
import type { CSSProperties } from "react";

import { ArrowRight } from "@/components/icons";
import { HeroVisual } from "./hero-visual";

/**
 * Hero trang giới thiệu: chữ bên trái, quả cầu vàng bên phải.
 *
 * Server component, không một dòng JavaScript. Lúc vào trang dùng lớp
 * `hero-in` (globals.css): mỗi phần tử có `--i` là thứ tự so le. Khi màn mở
 * đầu đang chiếu, CSS tự cộng thêm độ trễ để chữ vào đúng lúc màn kéo lên,
 * nên không còn phải chờ một sự kiện từ màn mở đầu mới dám hiện.
 */
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export function LandingHero({ signedIn }: { signedIn: boolean }) {
  return (
    <section
      data-landing-hero
      data-on-navy
      className="relative overflow-hidden bg-navy-950 text-white"
    >
      {/* Họa tiết lưới cầu lông đan xéo nghệ thuật (Diagonal Badminton Net Mesh) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <svg
          className="absolute inset-0 size-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Lưới đan xéo góc 45 độ hình quả trám đặc trưng của vợt & lưới thi đấu */}
            <pattern
              id="hero-diagonal-net"
              width="38"
              height="38"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="38"
                stroke="#e8c56a"
                strokeOpacity="0.10"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="0"
                x2="38"
                y2="0"
                stroke="#e8c56a"
                strokeOpacity="0.10"
                strokeWidth="1"
              />
              {/* Nút thắt cước giao nhau tinh tế */}
              <circle cx="0" cy="0" r="1.3" fill="#ffffff" fillOpacity="0.25" />
            </pattern>

            {/* Mặt nạ tỏa sáng nghệ thuật, tập trung ở khu vực header & tâm sân */}
            <radialGradient id="hero-net-glow" cx="50%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <mask id="hero-net-mask">
              <rect width="100%" height="100%" fill="url(#hero-net-glow)" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#hero-diagonal-net)"
            mask="url(#hero-net-mask)"
          />
        </svg>

        {/* Quầng sáng đèn nhà thi đấu rọi qua mắt lưới xuống sân */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[440px] w-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(232,197,106,0.13)_0%,rgba(255,255,255,0.03)_50%,transparent_75%)] blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pt-28 pb-16 sm:px-8 lg:min-h-[100dvh] lg:grid-cols-12 lg:gap-10 lg:pt-24 lg:pb-20">
        <div className="lg:col-span-6">
          <p
            className="hero-in text-[14px] font-semibold text-gold-300"
            style={step(0)}
          >
            LH Sport Hub
          </p>

          <h1
            className="hero-in font-sport mt-4 text-white text-[clamp(2.9rem,6.4vw,5.1rem)] leading-[0.98] font-extrabold tracking-tight uppercase"
            style={step(1)}
          >
            Sân cầu lông của team{" "}
            <span className="text-gold-400">Light Human</span>
          </h1>

          <p
            className="hero-in mt-6 max-w-[46ch] text-[16.5px] leading-relaxed text-white/75"
            style={step(2)}
          >
            Chốt kèo, lên lịch sáng thứ 7, ghi tỉ số và tra luật. Một chỗ thay
            cho năm cái group chat.
          </p>

          <div
            className="hero-in mt-9 flex flex-wrap items-center gap-3"
            style={step(3)}
          >
            <Link
              href={signedIn ? "/bang-tin" : "/dang-nhap"}
              className="group inline-flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3.5 text-[15px] font-bold whitespace-nowrap text-navy-950 transition-[transform,background-color] duration-200 hover:bg-gold-300 active:scale-[0.98]"
            >
              {signedIn ? "Vào bảng tin" : "Đăng nhập"}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#trong-nay-co-gi"
              className="inline-flex items-center rounded-full border border-white/20 px-6 py-3.5 text-[15px] font-semibold whitespace-nowrap text-white/90 transition-colors duration-200 hover:border-gold-300 hover:text-white active:scale-[0.98]"
            >
              Xem có gì
            </a>
          </div>
        </div>

        {/* Visual bên phải: Quả cầu vàng phóng to + Lớp chữ ký kỷ niệm trên mặt lưới */}
        <HeroVisual />
      </div>
    </section>
  );
}
