import { BookOpen, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CoverArt } from "@/components/handbook/cover-art";
import { HeroVideo } from "@/components/hero-video";
import { requireProfile } from "@/lib/auth";
import { ARTICLES, CATEGORIES, type Article } from "@/content/cam-nang";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cẩm nang" };

const ACCENTS: Record<Article["accent"], string> = {
  navy: "from-navy-800 to-navy-950",
  gold: "from-gold-500 to-gold-700",
  sky: "from-sky-600 to-sky-800",
  rose: "from-rose-500 to-rose-700",
  emerald: "from-emerald-600 to-emerald-800",
};

/** Bài nổi bật: ảnh lớn tràn chiều ngang, chữ đè lên. */
function FeaturedCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/cam-nang/${article.slug}`}
      className="group relative block overflow-hidden rounded-3xl ring-1 ring-ink-800"
    >
      <div className="relative aspect-[16/10] sm:aspect-[21/9]">
        {article.cover ? (
          <Image
            src={article.cover}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
          />
        ) : article.art ? (
          <CoverArt
            motif={article.art}
            className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className={cn("size-full bg-gradient-to-br", ACCENTS[article.accent])}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/10" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-gold-300 uppercase">
          {article.category}
        </p>
        <h2 className="font-display mt-2.5 max-w-xl text-[26px] leading-[1.1] font-bold text-white sm:text-[36px]">
          {article.title}
        </h2>
        <p className="mt-3 hidden max-w-lg text-[15px] leading-relaxed text-white/70 sm:block">
          {article.summary}
        </p>
        <p className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-white/60">
          <Clock className="size-3.5" aria-hidden />
          {article.minutes} phút đọc
        </p>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/cam-nang/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl ring-1 ring-ink-800 transition-all duration-300 hover:-translate-y-0.5 hover:ring-ink-700"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {article.cover ? (
          <Image
            src={article.cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : article.art ? (
          <CoverArt
            motif={article.art}
            className="transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "grid size-full place-items-center bg-gradient-to-br",
              ACCENTS[article.accent],
            )}
          >
            <BookOpen className="size-9 text-white/35" aria-hidden />
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-md bg-ink-950/85 px-2 py-1 text-[10.5px] font-bold tracking-wide text-ink-100 uppercase backdrop-blur-sm">
          {article.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col bg-ink-900 p-4">
        <h3 className="text-[16.5px] leading-snug font-bold text-ink-100 transition-colors group-hover:text-link">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-ink-500">
          {article.summary}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500">
          <Clock className="size-3.5" aria-hidden />
          {article.minutes} phút
        </p>
      </div>
    </Link>
  );
}

export default async function HandbookPage() {
  await requireProfile();

  const [featured, ...rest] = ARTICLES;

  return (
    <div className="space-y-10">
      {/* Bìa tạp chí: video chạy nền, chữ đè lên.
          Tràn ra sát mép trên điện thoại, bo góc từ cỡ sm trở lên. */}
      <header className="relative -mx-4 h-[290px] overflow-hidden sm:mx-0 sm:h-[340px] sm:rounded-3xl">
        <HeroVideo label="Cảnh thi đấu cầu lông" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/88 to-navy-900/65" />
        {/* Ánh vàng chéo góc để dải bìa không phẳng lì một màu navy. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_88%_10%,rgba(220,174,66,0.18),transparent_65%)]" />

        <div className="relative flex h-full max-w-2xl flex-col justify-end p-7 sm:p-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-gold-300 uppercase">
            Cẩm nang
          </p>
          <h1 className="font-display mt-2.5 text-[34px] leading-[1.05] font-bold text-white sm:text-[46px]">
            Đánh cho đúng, giữ cho bền
          </h1>
          <p className="mt-3.5 max-w-[46ch] text-[14.5px] leading-relaxed text-white/70 sm:text-[15px]">
            Tất cả những gì cần biết về luật chơi, kỹ thuật, khởi động và trang bị — gom lại một chỗ để tiện tham khảo.
          </p>
        </div>
      </header>

      <FeaturedCard article={featured} />

      {/* Danh mục */}
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {CATEGORIES.map((c) => {
          const n = ARTICLES.filter((a) => a.category === c).length;
          if (n === 0) return null;
          return (
            <span
              key={c}
              className="rounded-lg bg-ink-850 px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap text-ink-400"
            >
              {c}
              <span className="tabular ml-1.5 text-ink-600">{n}</span>
            </span>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      <p className="border-t border-ink-800 pt-6 text-center text-[13px] text-ink-500">
        Thiếu nội dung nào hoặc thấy chỗ nào chưa đúng? Mọi người nhắn trong bảng tin để em
        bổ sung nhaaaaaa.
      </p>
    </div>
  );
}
