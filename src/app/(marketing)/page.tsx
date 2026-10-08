import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ConTroCau } from "@/components/landing/con-tro-cau";
import { HeroAlert } from "@/components/landing/hero-alert";
import { IntroCurtain } from "@/components/landing/intro-curtain";
import { Eyebrow, Quote, WordFade } from "@/components/landing/text-bits";
import { CutReveal } from "@/components/ui/cut-reveal";
import { LineToVideo } from "@/components/landing/line-to-video";
import { ShowcaseVideo } from "@/components/landing/showcase-video";
import { Reveal } from "@/components/landing/reveal";
import { JourneyLine } from "@/components/landing/journey-line";
import { ShuttleHero } from "@/components/landing/shuttle-hero";
import { DoVui } from "@/components/landing/do-vui";
import { type Feature } from "@/components/landing/feature-index";
import { VongQuayMuc } from "@/components/landing/vong-quay-muc";
import { FlowLink } from "@/components/ui/flow-button";
import { NamCham } from "@/components/ui/nam-cham";
import { NghiengCuon } from "@/components/ui/nghieng-cuon";
import { redirect } from "next/navigation";

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
 * Vàng dùng gold-700 chứ không phải gold-400: #dcae42 đẹp trên nền navy
 * nhưng đặt lên trắng thì chỉ còn khoảng 2:1, chữ nhỏ đọc không ra.
 *
 * (Ghi chú cũ viết nhầm là gold-600; hằng số GOLD bên dưới xưa nay vẫn
 *  là gold-700. Chính chỗ ghi nhầm này là lý do phần app đi lạc sang
 *  gold-600 — xem ghi chú ở globals.css.)
 */
const PAPER = "#ffffff";
const INK = "#001a4a"; // ink-100, cũng là navy thương hiệu
const MUTED = "#4c5a72"; // ink-400
const GOLD = "#855c12"; // gold-700 — 5,9:1 trên trắng, đạt AA cho cả chữ 10px
const LINE = "#e4e9f2"; // ink-800

/** Nền của khối video — navy đậm, không theo bảng màu sáng của trang. */
const ON_DARK_NAVY = "#00112e";

/** Mỗi mục trỏ thẳng vào trang tương ứng trong app. Khách chưa đăng nhập
 *  sẽ được chuyển sang trang đăng nhập rồi quay lại đúng chỗ đó. */
const FEATURES: Feature[] = [
  {
    href: "/keo",
    title: "Kèo",
    body: "Thách nhau 1v1 hay 2v2, đặt mốc điểm, ghi rõ cược gì. Cả đội thua bao cả đội thắng — đã chốt thì khỏi cãi.",
    anh: "/images/landing/muc-keo.jpg",
  },
  {
    href: "/buoi-tap",
    title: "Buổi tập",
    body: "Ai đứng ra đặt sân thì lên lịch, mọi người bấm báo đi hay không. Kèm bản đồ cho người tới lần đầu.",
    anh: "/images/landing/muc-buoi-tap.jpg",
  },
  {
    href: "/cam-nang",
    title: "Cẩm nang",
    body: "Luật, kỹ thuật, khởi động, chọn vợt chọn giày. Mười ba bài, đủ để không phải tra Google giữa trận.",
    anh: "/images/cam-nang/di-chuyen.webp",
  },
  {
    href: "/bang-tin",
    title: "Bảng tin & nhắn riêng",
    body: "Khoe ảnh buổi vừa đánh, chém gió, hoặc nhắn riêng rủ nhau đi tập.",
    anh: "/images/feed-4.jpg",
  },
];

/** Thêm `?xem=gioi-thieu` để xem trang này dù đã đăng nhập. */
const XEM_DU_DA_DANG_NHAP = "gioi-thieu";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ xem?: string }>;
}) {
  // Biết người xem đã đăng nhập hay chưa để đổi nút bấm cho đúng. Chỉ đọc
  // phiên, không đụng tới hồ sơ — trang này phải mở được cho cả khách.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  /*
    ĐÃ ĐĂNG NHẬP THÌ VÀO THẲNG BẢNG TIN.

    `start_url` của app là "/" chứ không phải "/bang-tin", và lý do đó
    vẫn đúng: "/" là đường dẫn công khai duy nhất, nên phiên có hết hạn
    thì người ta rơi vào trang giới thiệu chứ không đập mặt vào màn hình
    đăng nhập (xem ghi chú đầy đủ ở `app/manifest.ts`).

    Nhưng cái giá của nó là MỖI LẦN mở app đều phải xem trang giới thiệu
    rồi bấm thêm một nút — một trang có quả cầu 3D, vòng quay ghim
    2880px, video và trò đố vui — chỉ để tới chỗ mình thật sự muốn tới.
    Trả một cú chạm mỗi lần mở để phòng một trường hợp thỉnh thoảng mới
    xảy ra là lỗ.

    Chuyển hướng ở đây giữ được cả hai: còn phiên thì vào thẳng app, hết
    phiên thì `user` rỗng và trang giới thiệu hiện ra y như ý đồ cũ.

    `?xem=gioi-thieu` là lối thoát — menu tài khoản có một mục "Giới
    thiệu" trỏ vào đó, để người trong team vẫn xem lại được trang này.
  */
  const { xem } = await searchParams;
  if (signedIn && xem !== XEM_DU_DA_DANG_NHAP) redirect("/bang-tin");

  return (
    <main>
      <ConTroCau />
      <IntroCurtain />

      <ShuttleHero
        eyebrow="Light Human"
        headline="LH Sport Hub"
        meta={["Cầu lông & bơi", "Sáng thứ 7", "Nội bộ công ty"]}
        topRight={<HeroAlert />}
        action={
          <NamCham>
            <FlowLink
              href={signedIn ? "/bang-tin" : "/dang-nhap"}
              text={signedIn ? "Vào bảng tin" : "Đăng nhập"}
              tone="heroSolid"
              size="lg"
            />
          </NamCham>
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
            {/* Chỉ cột chữ nghiêng, không nghiêng cả lưới: tấm ảnh bên
                cạnh mà xiên theo thì thành méo ảnh, không thành quán
                tính. */}
            <NghiengCuon>
              <Eyebrow color={GOLD} viet="Light Human" />

              <CutReveal
                as="h2"
                text="🌿 Không gian thư giãn của Light Human"
                className="font-display mt-5 block text-[30px] leading-[1.14] font-bold sm:text-[40px]"
                delay={120}
                gachChan="Light Human"
                mauGach={GOLD}
              />

              <WordFade
                text="LH Sport Hub không chỉ đơn thuần là một ứng dụng, mà là một điểm hẹn tinh thần cho tập thể Light Human. Đây là nơi lưu giữ những kèo hẹn thể thao, những buổi tập cuối tuần và cả những tấm ảnh đầy tiếng cười, để mọi khoảnh khắc đều được sắp xếp gọn gàng và dễ dàng tìm lại."
                className="mt-7 text-[16px] leading-[1.8]"
                style={{ color: MUTED }}
                delay={420}
              />
            </NghiengCuon>

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

      {/* Đoạn phim của team */}
      <section
        className="px-5 pb-24 sm:px-10 sm:pb-32"
        style={{ background: PAPER }}
      >
        <div className="mx-auto max-w-5xl">
          {/* Đoạn nối tiếp nối đuôi đường dây của dải kể chuyện ngay phía
              trên, dẫn mắt xuống video. */}
          <LineToVideo />

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

      {/* Trong này có gì */}
      <section
        id="co-gi"
        className="scroll-mt-16 px-5 py-24 sm:px-10 sm:py-32"
        style={{ background: PAPER }}
      >
        <div className="mx-auto max-w-5xl">
          {/*
            Mục lục kiểu tạp chí, không phải lưới thẻ.

            Bản trước là lưới ba cột, mỗi ô một icon nhỏ — đúng cái kiểu làm
            mọi trang trông giống hệt nhau. Nó còn kéo theo hai chuyện dở:
            năm mục xếp vào lưới ba cột thì hụt một ô, phải bịa nội dung lấp
            vào; và năm mục trông quan trọng ngang nhau dù rõ ràng không phải.

            Dạng danh sách ngang thì số mục bao nhiêu cũng vừa, tên mục được
            cỡ chữ lớn, và có chỗ cho một việc mà lưới icon không làm được:
            mỗi dòng bấm được để vào thẳng trang đó.

            CẢ KHU NÀY BỎ `NghiengCuon`. Vòng quay giờ ghim lại và chạy
            theo cuộn, mà `NghiengCuon` áp `skewY` lên khối con — transform
            ở phần tử cha tạo ra một khối chứa mới, làm `position: sticky`
            bám sai chỗ. Tiêu đề đi vào trong vòng quay để ghim cùng, nên
            nó cũng không nghiêng được nữa. Đổi một hiệu ứng lấy việc
            người ta luôn nhìn thấy mình đang ở mục nào — đáng.
          */}
          <VongQuayMuc
            items={FEATURES}
            ink={INK}
            muted={MUTED}
            gold={GOLD}
            tieuDe={
              <>
                <Eyebrow color={GOLD}>Trong này có gì</Eyebrow>
                <CutReveal
                  as="h2"
                  text="Một chỗ cho tất cả thay cho năm cái group chat"
                  className="font-display mt-5 block max-w-2xl text-[32px] leading-[1.1] font-bold sm:text-[46px]"
                  delay={120}
                />
              </>
            }
          />

          {/* Câu cửa miệng của team — cho hẳn một dòng riêng thay vì nhét
              vào ô trống thừa của lưới như trước. */}
          {/* Dấu nháy để riêng, không nhét vào chuỗi của CutReveal: nhét
              vào thì nó dính liền với từ đầu và từ cuối, mất màu vàng và
              trồi lên cùng một nhịp với chữ. Tách ra thì chúng vào trước,
              như hai cái ngoặc mở sẵn chờ câu nói. */}
          <blockquote className="mt-16 text-center">
            <p className="font-display mx-auto max-w-xl text-[26px] leading-tight font-bold italic sm:text-[34px]">
              <Quote color={GOLD} delay={180}>
                “
              </Quote>
              <CutReveal
                text="Thua thì bao, đừng quỵt."
                className="inline"
                style={{ color: INK }}
                delay={380}
                step={80}
              />
              <Quote color={GOLD} delay={980}>
                ”
              </Quote>
            </p>
            <Eyebrow
              color={GOLD}
              className="mt-5 justify-center"
              ruleWidth="1.5rem"
            >
              Luật nhà
            </Eyebrow>
          </blockquote>
        </div>
      </section>

      {/* Kết */}
      <section
        className="border-t px-5 py-24 text-center sm:px-10 sm:py-32"
        style={{ background: PAPER, borderColor: LINE }}
      >
        <Eyebrow color={GOLD} className="justify-center">
          Đố vui
        </Eyebrow>

        {/* Câu này có "được" và "lập" — dấu thò xuống dưới con chữ. Đúng
            chỗ để thấy khe che của CutReveal có xén mất dấu hay không. */}
        <CutReveal
          as="h2"
          text="Light Human được thành lập ngày nào?"
          className="font-display mx-auto mt-5 block max-w-2xl text-[32px] leading-[1.14] font-bold sm:text-[46px]"
          step={75}
          gachChan="Light Human"
          mauGach={GOLD}
        />

        <div className="mt-12">
          <DoVui ink={INK} muted={MUTED} gold={GOLD} line={LINE} />
        </div>

        <div className="mt-9">
          <NamCham>
            <Link
              href={signedIn ? "/bang-tin" : "/dang-nhap"}
              className="inline-flex h-12 items-center rounded-full px-9 text-[12px] font-bold tracking-[0.16em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: GOLD, color: PAPER }}
            >
              {signedIn ? "Vào bảng tin" : "Đăng nhập"}
            </Link>
          </NamCham>
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
