import type { Metadata } from "next";

import { IntroOverlay } from "@/components/intro/intro-overlay";
import { DoVui } from "@/components/landing/do-vui";
import { LandingFeatures } from "@/components/landing/features";
import { LandingHero } from "@/components/landing/hero";
import { JourneyLine } from "@/components/landing/journey-line";
import { AnhNghieng, SoLieuDem } from "@/components/landing/khong-gian";
import { DELAY } from "@/components/landing/motion";
import { Reveal } from "@/components/landing/reveal";
import { ShowcaseVideo } from "@/components/landing/showcase-video";
import { LinkButton } from "@/components/ui/button";
import { CutReveal } from "@/components/ui/cut-reveal";
import { db } from "@/db";
import { challenges, playSessions, profiles } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { absolute: "LH Sport Hub: sân chơi của team Light Human" },
  description:
    "Chốt kèo cầu lông, lên lịch ra sân, ghi tỉ số và tra cứu luật. Nội bộ team Light Human.",
};

/*
 * Bốn màu cho trò đố vui, là bản sao HEX của token trong globals.css. Phải
 * là hex (không phải var()) vì DoVui ghép thêm hai chữ số độ mờ vào cuối,
 * kiểu `${ink}22`.
 */
const INK = "#001a4a";
const MUTED = "#4c5a72";
const GOLD = "#855c12";
const LINE = "#e4e9f2";

/**
 * Đếm số liệu thật từ database qua Drizzle (server-side).
 * Không dựa vào Supabase RLS của anon client để khách ghé thăm vẫn xem được số liệu chính xác.
 */
async function demSoLieu() {
  try {
    const [membersRes, sessionsRes, challengesRes] = await Promise.all([
      db.select({ count: count() }).from(profiles),
      db
        .select({ count: count() })
        .from(playSessions)
        .where(eq(playSessions.status, "open")),
      db
        .select({ count: count() })
        .from(challenges)
        .where(eq(challenges.status, "open")),
    ]);
    const so = (n: number | null | undefined) =>
      typeof n === "number" && n > 0 ? n : null;
    return [
      { value: so(membersRes[0]?.count), label: "thành viên" },
      { value: so(sessionsRes[0]?.count), label: "buổi tập đang mở" },
      { value: so(challengesRes[0]?.count), label: "kèo đang chờ" },
    ].filter((s): s is { value: number; label: string } => s.value !== null);
  } catch {
    return [];
  }
}

export default async function GioiThieuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);
  const soLieu = await demSoLieu();

  return (
    <main id="noi-dung">
      <IntroOverlay />

      <LandingHero signedIn={signedIn} />

      {/* Light Human là ai: chữ hẹp bên trái, ảnh rộng bên phải. */}
      <section className="bg-white px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <div className="lg:col-span-5">
            <CutReveal
              as="h2"
              text="Không gian thư giãn của Light Human"
              className="font-display block text-[32px] leading-[1.14] font-bold text-navy-900 sm:text-[44px]"
              delay={DELAY.heading}
              gachChan="Light Human"
              mauGach={GOLD}
            />

            <Reveal delay={DELAY.body}>
              <p className="mt-7 max-w-[52ch] text-[16px] leading-[1.8] text-ink-400">
                Nơi lưu lại những kèo hẹn, những buổi tập cuối tuần và cả những
                tấm ảnh đầy tiếng cười của team, gọn gàng và dễ tìm lại.
              </p>
            </Reveal>

            {soLieu.length > 0 && (
              <Reveal delay={DELAY.body + DELAY.item}>
                <SoLieuDem items={soLieu} />
              </Reveal>
            )}
          </div>

          {/* pr/pb chừa chỗ cho khung vàng lệch phía sau ảnh */}
          <Reveal delay={DELAY.body} className="pr-6 pb-6 lg:col-span-7">
            <AnhNghieng
              src="/images/landing/khong-gian-team.webp"
              alt="Cả team Light Human chụp ảnh chung trên sân cầu lông WaveStation"
            />
          </Reveal>
        </div>
      </section>

      {/* Hai người chơi đánh qua lưới, mỗi cú rơi vào một tấm ảnh của team. */}
      <JourneyLine />

      {/* Phim: một khối rộng, chỉ tải khi sắp cuộn tới. */}
      {/* pt: JourneyLine ghim kín màn hình nên đáy của nó sát mép; không có
          khoảng đệm thì video dính ngay dưới tấm ảnh cuối. */}
      <section className="bg-white px-5 pt-16 pb-24 sm:px-8 sm:pt-24 sm:pb-32">
        <Reveal className="mx-auto max-w-6xl">
          <div
            data-on-navy
            className="relative aspect-video overflow-hidden rounded-2xl bg-navy-950"
          >
            <ShowcaseVideo
              src="/videos/video.mp4"
              poster="/videos/video-poster.webp"
              label="Đoạn phim team Light Human trên sân cầu lông"
            />
          </div>
        </Reveal>
      </section>

      <LandingFeatures />

      {/*
        Luật nhà: một câu, chữ lớn, lệch trái.

        Rê chuột: từng chữ chuyển vàng (lớp `luat-tu`), hai dấu ngoặc
        nghiêng nhẹ ra hai bên và gạch vàng dưới "Luật nhà của team" dài
        ra khi rê vào cả câu (nhóm `luat`).
      */}
      <section className="bg-white px-5 py-24 sm:px-8 sm:py-36">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12">
          <blockquote className="group/luat lg:col-span-10 lg:col-start-2">
            <p className="font-display text-[38px] leading-[1.1] font-bold text-navy-900 sm:text-[60px] lg:text-[76px]">
              <span className="inline-block origin-bottom-right text-gold-700 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/luat:-translate-x-1 group-hover/luat:-rotate-12 motion-reduce:transition-none">
                “
              </span>
              <CutReveal
                text="Thua thì bao, đừng quỵt."
                className="inline"
                tuClassName="luat-tu"
                delay={DELAY.heading}
              />
              <span className="inline-block origin-bottom-left text-gold-700 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/luat:translate-x-1 group-hover/luat:rotate-12 motion-reduce:transition-none">
                ”
              </span>
            </p>
            <footer className="mt-6 flex items-center gap-3 text-[14px] font-semibold text-ink-400">
              <span
                aria-hidden
                className="h-0.5 w-6 rounded-full bg-gold-400 transition-[width] duration-500 ease-out group-hover/luat:w-14 motion-reduce:transition-none"
              />
              Luật nhà của team
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Đố vui rồi vào app. */}
      <section className="border-t border-ink-800 bg-white px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-gold-100 px-4 py-1.5 font-sport text-[13px] font-bold tracking-[0.25em] text-gold-700 uppercase ring-1 ring-gold-400/40">
            <span aria-hidden className="size-1.5 rounded-full bg-gold-500" />
            Đố vui
          </p>
        </Reveal>
        <CutReveal
          as="h2"
          text="Light Human được thành lập ngày nào?"
          className="font-display mx-auto block max-w-2xl text-[32px] leading-[1.14] font-bold text-navy-900 sm:text-[44px]"
          gachChan="Light Human"
          mauGach={GOLD}
        />

        <div className="mt-12">
          <DoVui ink={INK} muted={MUTED} gold={GOLD} line={LINE} />
        </div>

        <div className="mt-10">
          <LinkButton
            href={signedIn ? "/bang-tin" : "/dang-nhap"}
            size="lg"
            className="rounded-full bg-navy-900 px-8 text-white hover:bg-navy-800 active:scale-[0.98] dark:bg-navy-900 dark:text-white dark:hover:bg-navy-800"
          >
            {signedIn ? "Vào bảng tin" : "Đăng nhập"}
          </LinkButton>
        </div>
        <p className="mx-auto mt-8 max-w-md text-[13px] leading-relaxed text-ink-400">
          Dành riêng cho nhân viên Light Human. Vui lòng không chia sẻ link ra
          ngoài.
        </p>
      </section>
    </main>
  );
}
