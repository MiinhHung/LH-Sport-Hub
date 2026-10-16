import Link from "next/link";
import { Fragment, type CSSProperties } from "react";

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
        <div className="group/hero lg:col-span-6">
          <p
            className="hero-in flex items-center gap-3 text-[14px] font-semibold text-gold-300"
            style={step(0)}
          >
            {/* Vạch vàng dài ra khi rê vào khối chữ */}
            <span
              aria-hidden
              className="h-0.5 w-6 rounded-full bg-gold-400 transition-[width] duration-500 ease-out group-hover/hero:w-12 motion-reduce:transition-none"
            />
            LH Sport Hub
          </p>

          {/*
            RÊ CHUỘT VÀO TỪNG CHỮ: chữ nảy lên, nghiêng nhẹ, sáng vàng (lớp
            `hero-tu`). Rê vào cả tiêu đề: một vệt sáng quét qua "Light
            Human" như ánh kim loại (lớp `hero-vang`). Chỉ CSS, server
            component vẫn không cần một dòng JavaScript. aria-label giữ
            nguyên câu cho trình đọc màn hình, khỏi đọc rời từng chữ.
          */}
          <h1
            className="hero-in hero-tieu-de font-sport mt-4 text-white text-[clamp(2.9rem,6.4vw,5.1rem)] leading-[0.98] font-extrabold tracking-tight uppercase"
            style={step(1)}
            aria-label="Sân cầu lông của team Light Human"
          >
            {/* Dấu cách nằm NGOÀI ô chữ: ô inline-block nuốt dấu cách ở
                cuối, đặt bên trong thì các chữ dính liền nhau. */}
            <span aria-hidden>
              {["Sân", "cầu", "lông", "của", "team"].map((tu) => (
                <Fragment key={tu}>
                  <span className="hero-tu">{tu}</span>{" "}
                </Fragment>
              ))}
              <span className="hero-tu hero-tu-vang">
                <span className="hero-vang">Light</span>
              </span>{" "}
              <span className="hero-tu hero-tu-vang">
                <span className="hero-vang">Human</span>
              </span>
            </span>
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
            {/* Nút chính: nhô lên, phát sáng, một vệt sáng quét qua */}
            <Link
              href={signedIn ? "/bang-tin" : "/dang-nhap"}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gold-400 px-7 py-3.5 text-[15px] font-bold whitespace-nowrap text-navy-950 transition-[transform,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-[0_14px_34px_-10px_rgba(220,174,66,0.75)] active:translate-y-0 active:scale-[0.98] motion-reduce:hover:translate-y-0"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-[60%] w-1/2 -skew-x-[20deg] bg-gradient-to-r from-transparent via-white/55 to-transparent transition-[left] duration-700 ease-out group-hover:left-[130%] motion-reduce:hidden"
              />
              <span className="relative">
                {signedIn ? "Vào bảng tin" : "Đăng nhập"}
              </span>
              <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            {/* Nút phụ: nền sáng lên, viền vàng, mũi tên chỉ xuống nhún nhẹ */}
            <a
              href="#trong-nay-co-gi"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-[15px] font-semibold whitespace-nowrap text-white/90 transition-[background-color,border-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold-300 hover:bg-white/[0.08] hover:text-white active:translate-y-0 active:scale-[0.98] motion-reduce:hover:translate-y-0"
            >
              Xem có gì
              <ArrowRight
                aria-hidden
                className="size-4 rotate-90 text-gold-300 opacity-60 transition-[opacity,transform] duration-300 group-hover:translate-y-0.5 group-hover:opacity-100 motion-safe:group-hover:animate-bounce"
              />
            </a>
          </div>
        </div>

        {/* Visual bên phải: Quả cầu vàng phóng to + Lớp chữ ký kỷ niệm trên mặt lưới */}
        <HeroVisual />
      </div>
    </section>
  );
}
