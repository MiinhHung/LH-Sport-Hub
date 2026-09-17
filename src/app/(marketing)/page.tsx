import {
  BookOpen,
  CalendarDays,
  MessagesSquare,
  Swords,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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

const FEATURES = [
  {
    icon: Swords,
    title: "Kèo",
    body: "Thách nhau 1v1 hay 2v2, đặt mốc điểm, ghi rõ cược gì. Cả đội thua bao cả đội thắng — đã chốt thì khỏi cãi.",
  },
  {
    icon: CalendarDays,
    title: "Buổi tập",
    body: "Ai đứng ra đặt sân thì lên lịch, mọi người bấm báo đi hay không. Kèm bản đồ cho người tới lần đầu.",
  },
  {
    icon: Trophy,
    title: "Bảng phong thần",
    body: "Vua kèo, chuỗi thắng, người chăm nhất. Chỉ tính những trận cả hai đội đã xác nhận kết quả.",
  },
  {
    icon: BookOpen,
    title: "Cẩm nang",
    body: "Luật, kỹ thuật, khởi động, chọn vợt chọn giày. Mười ba bài, đủ để không phải tra Google giữa trận.",
  },
  {
    icon: MessagesSquare,
    title: "Bảng tin & nhắn riêng",
    body: "Khoe ảnh buổi vừa đánh, chém gió, hoặc nhắn riêng rủ nhau đi tập.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Tạo kèo",
    body: "Chọn 1v1 hay 2v2, đặt mốc điểm, ghi cược gì. Để mở cho ai nhận cũng được, hoặc thách đích danh.",
  },
  {
    n: "02",
    title: "Đủ người thì chốt",
    body: "Khi tất cả đã nhận, kèo tự khoá lại. Đánh lúc nào cũng được — không bắt buộc gắn vào buổi tập nào.",
  },
  {
    n: "03",
    title: "Nhập tỉ số",
    body: "Đánh xong nhập kết quả, đội kia xác nhận. Xác nhận xong mới tính vào bảng xếp hạng.",
  },
  {
    n: "04",
    title: "Trả kèo",
    body: "Đội thua bao đội thắng. Phần này app không làm hộ được.",
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
      <ShuttleHero
        eyebrow="Light Human"
        headline="Sport Hub"
        description="Chỗ để anh, chị, em trong công ty chốt kèo cầu lông, rủ nhau ra sân sáng thứ 7, ghi tỉ số và tra cứu luật."
        meta={["Cầu lông & bơi", "Sáng thứ 7", "Nội bộ công ty"]}
        action={
          <Link
            href={signedIn ? "/bang-tin" : "/dang-nhap"}
            className="inline-flex h-11 items-center rounded-full px-7 text-[12px] font-bold tracking-[0.16em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: GOLD, color: PAPER }}
          >
            {signedIn ? "Vào bảng tin" : "Đăng nhập"}
          </Link>
        }
        secondaryAction={
          <a
            href="#co-gi"
            className="inline-flex h-11 items-center rounded-full border px-7 text-[12px] font-bold tracking-[0.16em] uppercase transition-colors duration-300 hover:bg-ink-850"
            style={{ borderColor: LINE, color: INK }}
          >
            Có gì trong này
          </a>
        }
      />

      {/* Light Human là ai — đặt ngay sau hero vì người lạ mở trang lên thì
          câu hỏi đầu tiên là "đây là cái gì của ai", không phải "có tính
          năng gì". */}
      <section
        className="px-5 py-24 sm:px-10 sm:py-32"
        style={{ background: PAPER }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
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

              <h2
                className="font-display mt-5 text-[30px] leading-[1.12] font-bold sm:text-[44px]"
                style={{ color: INK }}
              >
                Sân chơi của người
                <br />
                Light Human
              </h2>

              <div
                className="mt-7 space-y-5 text-[15.5px] leading-[1.75]"
                style={{ color: MUTED }}
              >
                <p>
                  Sport Hub không phải sản phẩm bán cho ai. Nó là chỗ nội bộ
                  của team thể thao công ty Light Human — dựng lên vì mấy cái
                  group chat không giải quyết nổi việc tuần nào cũng phải hỏi
                  lại: thứ 7 này ai đi, sân nào, ai còn nợ ai chầu gì.
                </p>
                <p>
                  Team khoảng mười chín người, sáng thứ 7 ra sân, hôm nào
                  không cầu lông thì đi bơi. Đông nhất được mười lăm, có hôm
                  chỉ bảy người — vẫn đánh. Cái hay không nằm ở chỗ ai giỏi
                  hơn ai, mà ở chỗ tuần sau mọi người vẫn muốn dậy sớm.
                </p>
                <p style={{ color: INK }}>
                  Nên app này chỉ làm đúng một việc: giữ cho những cái kèo,
                  những buổi tập và những tấm ảnh nằm yên một chỗ, để không ai
                  phải nhớ hộ ai.
                </p>
              </div>
            </div>

            {/* Vài con số — cột hẹp bên phải, ngăn bằng nét kẻ mảnh */}
            <dl className="grid grid-cols-2 gap-px self-start lg:grid-cols-1"
              style={{ background: LINE }}
            >
              {[
                { k: "19", v: "thành viên" },
                { k: "Sáng T7", v: "lịch cố định" },
                { k: "2 môn", v: "cầu lông & bơi" },
                { k: "13 bài", v: "trong cẩm nang" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="px-5 py-5"
                  style={{ background: PAPER }}
                >
                  <dt
                    className="font-display tabular text-[26px] leading-none font-bold"
                    style={{ color: INK }}
                  >
                    {s.k}
                  </dt>
                  <dd
                    className="mt-1.5 text-[12px] font-semibold tracking-[0.1em] uppercase"
                    style={{ color: MUTED }}
                  >
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
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

          <h2
            className="font-display mt-5 max-w-2xl text-[32px] leading-[1.1] font-bold sm:text-[46px]"
            style={{ color: INK }}
          >
            Một chỗ cho tất cả, thay cho năm cái group chat
          </h2>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-3"
            style={{ background: LINE }}
          >
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal
                key={title}
                delay={i * 70}
                className="p-7 sm:p-8"
                style={{ background: PAPER }}
              >
                <Icon
                  className="size-5"
                  style={{ color: GOLD }}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3
                  className="font-display mt-5 text-[21px] font-bold"
                  style={{ color: INK }}
                >
                  {title}
                </h3>
                <p
                  className="mt-2.5 text-[14px] leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {body}
                </p>
              </Reveal>
            ))}

            {/* Ô cuối để trống có chủ đích: lưới 3 cột với 5 mục sẽ hụt một
                ô, lấp bằng một câu còn hơn để hổng. */}
            <div
              className="flex items-end p-7 sm:p-8"
              style={{ background: PAPER }}
            >
              <p
                className="font-display text-[19px] leading-snug italic"
                style={{ color: GOLD, opacity: 0.85 }}
              >
                “Thua thì bao,
                <br />
                đừng quỵt.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Một cái kèo đi qua bốn bước */}
      <section
        className="border-t px-5 py-24 sm:px-10 sm:py-32"
        style={{ background: PAPER, borderColor: LINE }}
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
              Một cái kèo đi thế nào
            </span>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <p
                  className="font-display tabular text-[42px] leading-none font-bold"
                  style={{ color: GOLD, opacity: 0.4 }}
                >
                  {s.n}
                </p>
                <h3
                  className="font-display mt-4 text-[20px] font-bold"
                  style={{ color: INK }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-2 text-[14px] leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {s.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Kết */}
      <section
        className="border-t px-5 py-24 text-center sm:px-10 sm:py-32"
        style={{ background: PAPER, borderColor: LINE }}
      >
        <h2
          className="font-display mx-auto max-w-2xl text-[32px] leading-[1.1] font-bold sm:text-[46px]"
          style={{ color: INK }}
        >
          Sáng thứ 7, sân đã đặt.
          <br />
          Còn thiếu mỗi bạn.
        </h2>
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
