import Image from "next/image";

import { AuthReveal } from "@/components/auth-reveal";
import { TiltCard } from "@/components/auth/tilt-card";
import { HeroVideo } from "@/components/hero-video";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Bảng thương hiệu — video cầu lông chạy nền, phủ navy. */}
      <aside className="relative hidden overflow-hidden lg:block">
        <HeroVideo label="Cảnh thi đấu cầu lông" />

        {/* Phủ đậm: video chỉ còn là chuyển động mờ phía sau, chữ vẫn đọc
            được và mọi thương hiệu của YouTube đều bị che. */}
        <div className="bg-gradient-navy absolute inset-0 opacity-[0.88]" />
        <div className="absolute inset-0 bg-navy-950/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_15%,rgba(220,174,66,0.22),transparent_70%)]" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          {/* Logo gốc có nền trắng nên đặt trên navy sẽ thành ô trắng.
              Ở đây dùng khoá chữ, để dành ảnh cho nền sáng. */}
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-xl font-bold text-white">
              Light Human
            </span>
            <span className="h-5 w-px bg-white/25" aria-hidden />
            <span className="text-[15px] font-semibold tracking-[0.18em] text-gold-300 uppercase">
              Sport Hub
            </span>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-4xl leading-[1.12] font-bold text-white xl:text-[44px]">
              Thách nhau một kèo,
              <br />
              thua thì <span className="text-gradient-gold">bao</span>.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/70">
              Chỗ để anh, chị, em trong công ty chốt kèo cầu lông, rủ nhau đi
              bơi, ghi tỉ số sau mỗi trận và tra cứu luật lẫn bài khởi động —
              tất cả gọn trong một nơi.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
            {[
              { k: "Kèo 1v1 & 2v2", v: "Mở hoặc thách đích danh" },
              { k: "Cẩm nang", v: "Luật, kỹ thuật, khởi động" },
              { k: "Bảng phong thần", v: "Vua kèo, chuỗi thắng" },
            ].map((item) => (
              <div key={item.k}>
                <dt className="text-[13px] font-bold text-gold-300">
                  {item.k}
                </dt>
                <dd className="mt-1 text-xs leading-snug text-white/55">
                  {item.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      {/*
        Bảng biểu mẫu.

        NỀN TỐI, KHÔNG PHẢI NỀN SÁNG NHƯ TRƯỚC. Mặt kính mờ, vệt sáng chạy
        viền và quầng vàng đều là hiệu ứng ÁNH SÁNG — chúng chỉ hiện ra khi
        có nền tối để nổi lên. Đặt nguyên bộ đó lên nền ink-950 (vốn là màu
        sáng nhất của hệ màu) thì lớp kính thành một ô xám và bốn vệt sáng
        biến mất hoàn toàn. Đổi luôn cả cột cũng khiến hai nửa trang liền
        một mạch, thay vì tối một bên sáng một bên như trước.
      */}
      <main
        id="noi-dung"
        className="relative flex items-center justify-center overflow-hidden bg-navy-950 px-5 py-12 sm:px-8"
      >
        {/* Hai quầng sáng nằm ngoài luồng, cho nền đỡ phẳng */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1/4 left-1/2 h-[70vh] w-[110vh] -translate-x-1/2 rounded-b-full bg-gold-400/10 blur-[90px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-1/3 left-1/2 h-[70vh] w-[90vh] -translate-x-1/2 rounded-t-full bg-navy-600/20 blur-[90px]"
        />

        <AuthReveal>
          {/* Khoá thương hiệu cho màn hình nhỏ. Dùng bản nét sáng nền trong
              suốt: logo.png có nền TRẮNG ĐẶC, trước đây nó dựa vào
              mix-blend-multiply với nền sáng để tan nền đi — trên navy thì
              thủ thuật đó cho ra đúng một ô trắng. */}
          <div className="mb-7 flex flex-col items-center text-center lg:hidden">
            <Image
              src="/logo-light.png"
              alt="Light Human"
              width={656}
              height={562}
              priority
              className="h-16 w-auto object-contain"
            />
            <p className="mt-1.5 text-[14px] font-semibold tracking-[0.18em] text-gold-300 uppercase">
              Sport Hub
            </p>
          </div>

          <TiltCard>{children}</TiltCard>

          <p className="mt-7 text-center text-xs leading-relaxed text-white/40">
            Dành riêng cho nhân viên Light Human.
            <br className="sm:hidden" /> Vui lòng không chia sẻ link ra ngoài.
          </p>
        </AuthReveal>
      </main>
    </div>
  );
}
