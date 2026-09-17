import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { IntroCurtain } from "@/components/landing/intro-curtain";
import { CutReveal } from "@/components/landing/cut-reveal";
import { ShowcaseVideo } from "@/components/landing/showcase-video";
import { Reveal } from "@/components/landing/reveal";
import { JourneyLine } from "@/components/landing/journey-line";
import { ShuttleHero } from "@/components/landing/shuttle-hero";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  // `absolute` để không bị khuôn mẫu ở layout gốc nối thêm "· LH Sport Hub"
  // vào sau — tên app đã nằm sẵn trong tiêu đề này rồi.
  title: { absolute: "LH Sport Hub — Sân chơi của team Light Human" },
  description:
    "Chốt kèo cầu lông, lên lịch ra sân, ghi tỉ số và tra cứu luật. Nội bộ team Light Human.",
};

/*
 * Bảng màu của trang giới thiệu, lấy thẳng từ hệ màu của app.
 *
 * Vàng dùng gold-600 chứ không phải gold-400: #dcae42 đẹp trên nền navy
 * nhưng đặt lên trắng thì chỉ còn khoảng 2:1, chữ nhỏ đọc không ra.
 */
const PAPER = "#ffffff";
const INK = "#001a4a"; // ink-100, cũng là navy thương hiệu
const MUTED = "#4c5a72"; // ink-400
const GOLD = "#855c12"; // gold-700 — 5,9:1 trên trắng, đạt AA cho cả chữ 10px
const LINE = "#e4e9f2"; // ink-800

/*
 * Hero có nền tối riêng nên hai cái nút nằm trong đó phải dùng bảng màu
 * của nền tối. Dùng nhầm bảng sáng thì chữ navy nằm trên nền navy —
 * nút thứ hai biến mất hoàn toàn.
 */
const ON_DARK_GOLD = "#dcae42"; // gold-400
const ON_DARK_TEXT = "#f2ede3";
const ON_DARK_NAVY = "#00112e";

/** Mỗi mục trỏ thẳng vào trang tương ứng trong app. Khách chưa đăng nhập
 *  sẽ được chuyển sang trang đăng nhập rồi quay lại đúng chỗ đó. */
const FEATURES = [
  {
    href: "/keo",
    title: "Kèo",
    body: "Thách nhau 1v1 hay 2v2, đặt mốc điểm, ghi rõ cược gì. Cả đội thua bao cả đội thắng — đã chốt thì khỏi cãi.",
  },
  {
    href: "/buoi-tap",
    title: "Buổi tập",
    body: "Ai đứng ra đặt sân thì lên lịch, mọi người bấm báo đi hay không. Kèm bản đồ cho người tới lần đầu.",
  },
  {
    href: "/bang-phong-than",
    title: "Bảng phong thần",
    body: "Vua kèo, chuỗi thắng, người chăm nhất. Chỉ tính những trận cả hai đội đã xác nhận kết quả.",
  },
  {
    href: "/cam-nang",
    title: "Cẩm nang",
    body: "Luật, kỹ thuật, khởi động, chọn vợt chọn giày. Mười ba bài, đủ để không phải tra Google giữa trận.",
  },
  {
    href: "/bang-tin",
    title: "Bảng tin & nhắn riêng",
    body: "Khoe ảnh buổi vừa đánh, chém gió, hoặc nhắn riêng rủ nhau đi tập.",
  },
];


export default async function LandingPage() {
  // Biết người xem đã đăng nhập hay chưa để đổi nút bấm cho đúng. Chỉ đọc
  // phiên, không đụng tới hồ sơ — trang này phải mở được cho cả khách.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  return (
    <main>
      <IntroCurtain />

      <ShuttleHero
        eyebrow="Light Human"
        headline="LH Sport Hub"
        meta={["Cầu lông & bơi", "Sáng thứ 7", "Nội bộ công ty"]}
        action={
          <Link
            href={signedIn ? "/bang-tin" : "/dang-nhap"}
            className="inline-flex h-11 items-center rounded-full px-7 text-[12px] font-bold tracking-[0.16em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: ON_DARK_GOLD, color: ON_DARK_NAVY }}
          >
            {signedIn ? "Vào bảng tin" : "Đăng nhập"}
          </Link>
        }
        secondaryAction={
          <a
            href="#co-gi"
            className="inline-flex h-11 items-center rounded-full border px-7 text-[12px] font-bold tracking-[0.16em] uppercase transition-colors duration-300 hover:bg-white/10"
            style={{ borderColor: `${ON_DARK_TEXT}4d`, color: ON_DARK_TEXT }}
          >
            Có gì trong này
          </a>
        }
      />

      {/*
        Light Human là ai — đặt ngay sau hero vì người lạ mở trang lên thì
        câu hỏi đầu tiên là "đây là cái gì của ai", không phải "có tính năng
        gì".

        KÉO LÊN NẰM DƯỚI TẤM HERO bằng margin âm đúng một màn hình.

        Tấm hero dính cứng ở đỉnh nhưng vẫn CHIẾM CHỖ trọn chiều cao của nó
        trong tài liệu. Nên khi vệt quét cắt xong, khung nhìn rơi đúng vào
        vùng đó — một màn hình trắng trơn — rồi phải cuộn thêm nguyên một màn
        nữa phần này mới tới.

        Kéo lên thì chỗ vệt quét cắt đi không còn là nền trắng, mà chính là
        phần này. Vệt quét trở thành phép lộ ra giữa hai lớp: cảnh tối mất
        dần, bài viết hiện ra ngay sau lưng nó.
      */}
      <section
        className="relative z-0 -mt-[100svh] px-5 pt-[26vh] pb-24 sm:px-10 sm:pb-32"
        style={{ background: PAPER }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-x-14 gap-y-10 lg:grid-cols-2">
            <Reveal>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-px w-8"
                  style={{ background: GOLD, opacity: 0.7 }}
                />
                <span
                  className="text-[10px] font-semibold tracking-[0.32em] uppercase"
                  style={{ color: GOLD }}
                >
                  Light Human
                </span>
              </div>

              <CutReveal
                as="h2"
                text="🌿 Không gian thư giãn của Light Human"
                className="font-display mt-5 block text-[30px] leading-[1.14] font-bold sm:text-[40px]"
              />

              <p
                className="mt-7 text-[16px] leading-[1.8]"
                style={{ color: MUTED }}
              >
                LH Sport Hub không chỉ đơn thuần là một ứng dụng, mà là một
                điểm hẹn tinh thần cho tập thể Light Human. Đây là nơi lưu giữ
                những kèo hẹn thể thao, những buổi tập cuối tuần và cả những
                tấm ảnh đầy tiếng cười, để mọi khoảnh khắc đều được sắp xếp
                gọn gàng và dễ dàng tìm lại.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="overflow-hidden rounded-3xl ring-1 ring-ink-800">
                <div className="relative aspect-[1024/666]">
                  <Image
                    src="/images/landing/khong-gian-thu-gian.webp"
                    alt="Không gian thư giãn của team Light Human"
                    fill
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="object-cover"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <JourneyLine />

      {/* Trong này có gì */}
      <section
        id="co-gi"
        className="scroll-mt-16 px-5 py-24 sm:px-10 sm:py-32"
        style={{ background: PAPER }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-px w-8"
              style={{ background: GOLD, opacity: 0.7 }}
            />
            <span
              className="text-[10px] font-semibold tracking-[0.32em] uppercase"
              style={{ color: GOLD }}
            >
              Trong này có gì
            </span>
          </div>

          <CutReveal
            as="h2"
            text="Một chỗ cho tất cả, thay cho năm cái group chat"
            className="font-display mt-5 block max-w-2xl text-[32px] leading-[1.1] font-bold sm:text-[46px]"
          />

          {/*
            Mục lục kiểu tạp chí, không phải lưới thẻ.

            Bản trước là lưới ba cột, mỗi ô một icon nhỏ — đúng cái kiểu làm
            mọi trang trông giống hệt nhau. Nó còn kéo theo hai chuyện dở:
            năm mục xếp vào lưới ba cột thì hụt một ô, phải bịa nội dung lấp
            vào; và năm mục trông quan trọng ngang nhau dù rõ ràng không phải.

            Dạng danh sách ngang thì số mục bao nhiêu cũng vừa, tên mục được
            cỡ chữ lớn, và có chỗ cho một việc mà lưới icon không làm được:
            mỗi dòng bấm được để vào thẳng trang đó.
          */}
          <ul className="mt-14 border-t" style={{ borderColor: LINE }}>
            {FEATURES.map(({ href, title, body }, i) => (
              <li key={title} className="border-b" style={{ borderColor: LINE }}>
                <Reveal delay={i * 60}>
                  <Link
                    href={href}
                    className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-5 gap-y-1.5 py-6 md:grid-cols-[3.5rem_minmax(0,15rem)_minmax(0,1fr)_2rem] md:gap-x-8 md:py-7"
                  >
                    <span
                      aria-hidden
                      className="font-display tabular text-[15px] leading-none font-bold transition-colors duration-300 md:text-[17px]"
                      style={{ color: GOLD, opacity: 0.55 }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <h3
                      className="font-display text-[22px] leading-tight font-bold transition-colors duration-300 group-hover:text-navy-700 md:text-[26px]"
                      style={{ color: INK }}
                    >
                      {title}
                    </h3>

                    {/* Trên điện thoại câu mô tả xuống dòng riêng, nhảy qua
                        cột số để thẳng hàng với tên mục. */}
                    <p
                      className="col-start-2 col-end-4 text-[14px] leading-relaxed md:col-auto md:text-[14.5px]"
                      style={{ color: MUTED }}
                    >
                      {body}
                    </p>

                    <ArrowRight
                      aria-hidden
                      className="col-start-3 row-start-1 size-4 self-center opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:col-auto md:row-auto"
                      style={{ color: GOLD }}
                    />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>

          {/* Câu cửa miệng của team — cho hẳn một dòng riêng thay vì nhét
              vào ô trống thừa của lưới như trước. */}
          <Reveal delay={220}>
            <blockquote className="mt-16 text-center">
              <p
                className="font-display mx-auto max-w-xl text-[26px] leading-tight font-bold italic sm:text-[34px]"
                style={{ color: INK }}
              >
                <span style={{ color: GOLD }}>“</span>
                Thua thì bao, đừng quỵt.
                <span style={{ color: GOLD }}>”</span>
              </p>
              <footer
                className="mt-4 text-[10px] font-semibold tracking-[0.28em] uppercase"
                style={{ color: GOLD }}
              >
                Luật nhà
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* Đoạn phim của team */}
      <section
        className="border-t px-5 py-24 sm:px-10 sm:py-32"
        style={{ background: PAPER, borderColor: LINE }}
      >
        <div className="mx-auto max-w-5xl">
          {/* Không nhãn, không tiêu đề — để đoạn phim tự nói. */}
          <Reveal>
            <div
              className="overflow-hidden rounded-3xl ring-1"
              style={{ borderColor: LINE, background: ON_DARK_NAVY }}
            >
              <div className="relative aspect-video">
                <ShowcaseVideo
                  src="/videos/video.mp4"
                  poster="/videos/video-poster.webp"
                  label="Đoạn phim team Light Human trên sân cầu lông"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Kết */}
      <section
        className="border-t px-5 py-24 text-center sm:px-10 sm:py-32"
        style={{ background: PAPER, borderColor: LINE }}
      >
        {/* Câu này có "đặt" — dấu nặng thò xuống dưới con chữ. Đúng chỗ để
            thấy khe che của CutReveal có xén mất dấu hay không. */}
        <CutReveal
          as="h2"
          text="Sáng thứ 7, sân đã đặt. Còn thiếu mỗi bạn."
          className="font-display mx-auto block max-w-2xl text-[32px] leading-[1.14] font-bold sm:text-[46px]"
        />
        <div className="mt-9">
          <Link
            href={signedIn ? "/bang-tin" : "/dang-nhap"}
            className="inline-flex h-12 items-center rounded-full px-9 text-[12px] font-bold tracking-[0.16em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: GOLD, color: PAPER }}
          >
            {signedIn ? "Vào bảng tin" : "Đăng nhập"}
          </Link>
        </div>
        <p
          className="mt-8 text-[12.5px]"
          style={{ color: MUTED, opacity: 0.75 }}
        >
          Dành riêng cho nhân viên Light Human. Vui lòng không chia sẻ link ra
          ngoài.
        </p>
      </section>
    </main>
  );
}
