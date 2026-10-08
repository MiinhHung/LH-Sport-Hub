import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentBlock } from "@/components/handbook/blocks";
import { CoverArt } from "@/components/handbook/cover-art";
import { requireProfile } from "@/lib/auth";
import { ARTICLES, getArticle } from "@/content/cam-nang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Cẩm nang" };
  return { title: article.title, description: article.summary };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireProfile();
  const { slug } = await params;

  const article = getArticle(slug);
  if (!article) notFound();

  const index = ARTICLES.findIndex((a) => a.slug === slug);
  const next = ARTICLES[(index + 1) % ARTICLES.length];

  return (
    <article className="mx-auto max-w-[44rem]">
      <Link
        href="/cam-nang"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Cẩm nang
      </Link>

      <header className="pt-6 pb-2">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-gold-700 dark:text-gold-300 uppercase">
          {article.category}
        </p>
        <h1 className="font-display mt-3 text-[34px] leading-[1.08] font-bold text-ink-100 sm:text-[44px]">
          {article.title}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-400">
          {article.summary}
        </p>
        <p className="mt-5 flex items-center gap-1.5 border-t border-ink-800 pt-5 text-[12.5px] font-semibold text-ink-500">
          <Clock className="size-3.5" aria-hidden />
          {article.minutes} phút đọc
        </p>
      </header>

      {/*
        CHẶN TỈ LỆ 16:9, KHÔNG ĐỂ ẢNH TỰ QUYẾT CHIỀU CAO.

        Bản trước dùng `h-auto w-full`, nghĩa là chiều cao lấy theo tỉ lệ
        THẬT của tệp ảnh — hai con số `width={1200} height={700}` chỉ là
        gợi ý cho trình duyệt, không ràng buộc gì. Phần lớn ảnh cẩm nang
        là 640×400 nằm ngang nên không ai thấy vấn đề; riêng bài "Khởi
        động" lấy `/images/feed-2.jpg` — một ảnh DỌC chụp bằng điện thoại,
        768×1024 — và nó dựng thành 704×939, chiếm 41% chiều cao cả trang
        trước khi tới dòng chữ đầu tiên.

        Nhánh `article.art` ngay dưới vốn đã chặn `aspect-[16/9]`; chỉ
        nhánh ảnh bìa bị sót. Giờ hai nhánh cùng một luật.
      */}
      {article.cover ? (
        <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-2xl ring-1 ring-ink-800">
          <Image
            src={article.cover}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 704px"
            className="object-cover"
          />
        </div>
      ) : article.art ? (
        <div className="mt-4 aspect-[16/9] overflow-hidden rounded-2xl ring-1 ring-ink-800">
          <CoverArt motif={article.art} />
        </div>
      ) : null}

      {/*
        THÂN BÀI HẸP HƠN KHUNG, CỐ Ý.

        Khung chung rộng 44rem (704px) cho tiêu đề và ảnh bìa — ở đó rộng
        là đúng. Nhưng chữ thường ở bề ngang đó ra 83 ký tự một dòng, mà
        ngưỡng đọc không mỏi là 45–75: dài quá thì mắt nhảy dòng hay bị
        lạc, đọc hết một đoạn thấy mệt mà không hiểu vì sao.

        38rem (608px) cho ra khoảng 70 ký tự. Giữ ảnh và tiêu đề ở khổ
        rộng, bóp riêng phần chữ — đúng cách báo giấy vẫn làm.
      */}
      <div className="mx-auto max-w-[38rem] pb-4">
        {article.blocks.map((block, i) => (
          <ContentBlock key={i} block={block} />
        ))}
      </div>

      {/* Bài kế tiếp */}
      <nav className="mt-12 border-t border-ink-800 pt-6">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-ink-500 uppercase">
          Đọc tiếp
        </p>
        <Link
          href={`/cam-nang/${next.slug}`}
          className="group mt-3 flex items-center justify-between gap-4"
        >
          <span className="min-w-0">
            <span className="font-display block text-[20px] leading-tight font-bold text-ink-100 transition-colors group-hover:text-link">
              {next.title}
            </span>
            <span className="mt-1 block truncate text-[13.5px] text-ink-500">
              {next.summary}
            </span>
          </span>
          <ArrowRight
            className="size-5 shrink-0 text-ink-500 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </nav>
    </article>
  );
}
