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
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Cẩm nang
      </Link>

      <header className="pt-6 pb-2">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-gold-600 uppercase">
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

      {article.cover ? (
        <Image
          src={article.cover}
          alt=""
          width={1200}
          height={700}
          priority
          sizes="(max-width: 768px) 100vw, 704px"
          className="mt-4 h-auto w-full rounded-2xl object-cover ring-1 ring-ink-800"
        />
      ) : article.art ? (
        <div className="mt-4 aspect-[16/9] overflow-hidden rounded-2xl ring-1 ring-ink-800">
          <CoverArt motif={article.art} />
        </div>
      ) : null}

      <div className="pb-4">
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
            <span className="font-display block text-[20px] leading-tight font-bold text-ink-100 transition-colors group-hover:text-navy-700">
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
