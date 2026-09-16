import {
  BookOpen,
  CalendarDays,
  MessagesSquare,
  Swords,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ShuttleHero } from "@/components/landing/shuttle-hero";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  // `absolute` để không bị khuôn mẫu ở layout gốc nối thêm "· LH Sport Hub"
  // vào sau — tên app đã nằm sẵn trong tiêu đề này rồi.
  title: { absolute: "LH Sport Hub — Sân chơi của team Light Human" },
  description:
    "Chốt kèo cầu lông, lên lịch ra sân, ghi tỉ số và tra cứu luật. Nội bộ team Light Human.",
};

const NAVY = "#000d26";
const GOLD = "#dcae42";
const CREAM = "#f2ede3";

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
            style={{ background: GOLD, color: NAVY }}
          >
            {signedIn ? "Vào bảng tin" : "Đăng nhập"}
          </Link>
        }
        secondaryAction={
          <a
            href="#co-gi"
            className="inline-flex h-11 items-center rounded-full border px-7 text-[12px] font-bold tracking-[0.16em] uppercase transition-colors duration-300 hover:bg-white/5"
            style={{ borderColor: `${CREAM}3d`, color: CREAM }}
          >
            Có gì trong này
          </a>
        }
      />

      {/* Trong này có gì */}
      <section
        id="co-gi"
        className="scroll-mt-16 px-5 py-24 sm:px-10 sm:py-32"
        style={{ background: NAVY }}
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
            style={{ color: CREAM }}
          >
            Một chỗ cho tất cả, thay cho năm cái group chat
          </h2>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-3"
            style={{ background: `${CREAM}14` }}
          >
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="p-7 sm:p-8"
                style={{ background: NAVY }}
              >
                <Icon
                  className="size-5"
                  style={{ color: GOLD }}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3
                  className="font-display mt-5 text-[21px] font-bold"
                  style={{ color: CREAM }}
                >
                  {title}
                </h3>
                <p
                  className="mt-2.5 text-[14px] leading-relaxed"
                  style={{ color: CREAM, opacity: 0.6 }}
                >
                  {body}
                </p>
              </div>
            ))}

            {/* Ô cuối để trống có chủ đích: lưới 3 cột với 5 mục sẽ hụt một
                ô, lấp bằng một câu còn hơn để hổng. */}
            <div
              className="flex items-end p-7 sm:p-8"
              style={{ background: NAVY }}
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
        style={{ background: NAVY, borderColor: `${CREAM}14` }}
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
            {STEPS.map((s) => (
              <div key={s.n}>
                <p
                  className="font-display tabular text-[42px] leading-none font-bold"
                  style={{ color: GOLD, opacity: 0.3 }}
                >
                  {s.n}
                </p>
                <h3
                  className="font-display mt-4 text-[20px] font-bold"
                  style={{ color: CREAM }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-2 text-[14px] leading-relaxed"
                  style={{ color: CREAM, opacity: 0.6 }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kết */}
      <section
        className="border-t px-5 py-24 text-center sm:px-10 sm:py-32"
        style={{ background: NAVY, borderColor: `${CREAM}14` }}
      >
        <h2
          className="font-display mx-auto max-w-2xl text-[32px] leading-[1.1] font-bold sm:text-[46px]"
          style={{ color: CREAM }}
        >
          Sáng thứ 7, sân đã đặt.
          <br />
          Còn thiếu mỗi bạn.
        </h2>
        <div className="mt-9">
          <Link
            href={signedIn ? "/bang-tin" : "/dang-nhap"}
            className="inline-flex h-12 items-center rounded-full px-9 text-[12px] font-bold tracking-[0.16em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: GOLD, color: NAVY }}
          >
            {signedIn ? "Vào bảng tin" : "Đăng nhập"}
          </Link>
        </div>
        <p
          className="mt-8 text-[12.5px]"
          style={{ color: CREAM, opacity: 0.45 }}
        >
          Dành riêng cho nhân viên Light Human. Vui lòng không chia sẻ link ra
          ngoài.
        </p>
      </section>
    </main>
  );
}
