import { AuthReveal } from "@/components/auth-reveal";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Bảng thương hiệu — ảnh thật của team, phủ navy. */}
      <aside className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/feed-1.jpg"
          alt="Team Light Human trên sân cầu lông"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="bg-gradient-navy absolute inset-0 opacity-[0.93]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_15%,rgba(220,174,66,0.22),transparent_70%)]" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          {/* Logo gốc có nền trắng nên đặt trên navy sẽ thành ô trắng.
              Ở đây dùng khoá chữ, để dành ảnh cho nền sáng. */}
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-xl font-bold text-white">
              Light Human
            </span>
            <span className="h-4 w-px bg-white/25" aria-hidden />
            <span className="text-[10.5px] font-semibold tracking-[0.2em] text-gold-300 uppercase">
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
              Chỗ để anh em chốt kèo cầu lông, đi bơi, ghi tỉ số và theo dõi
              xem ai còn nợ ai bữa sáng.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
            {[
              { k: "Kèo 1v1 & 2v2", v: "Mở hoặc thách đích danh" },
              { k: "Sổ nợ", v: "Cả đội thua bao cả đội thắng" },
              { k: "Bảng phong thần", v: "Vua kèo, chúa nợ" },
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

      {/* Bảng biểu mẫu */}
      {/* Nền phẳng riêng: gradient của body vắt ngang chỗ nối hai cột
          trông như vệt bẩn. */}
      <main
        id="noi-dung"
        className="flex items-center justify-center bg-ink-950 px-5 py-12 sm:px-8"
      >
        <AuthReveal>
          {/* Khoá thương hiệu cho màn hình nhỏ */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Light Human"
              className="h-20 w-auto object-contain mix-blend-multiply"
            />
            <p className="mt-1 text-[10.5px] font-semibold tracking-[0.2em] text-gold-600 uppercase">
              Sport Hub
            </p>
          </div>

          {children}

          <p className="mt-8 text-center text-xs leading-relaxed text-ink-500">
            Dành riêng cho nhân viên Light Human.
            <br className="sm:hidden" /> Vui lòng không chia sẻ link ra ngoài.
          </p>
        </AuthReveal>
      </main>
    </div>
  );
}
