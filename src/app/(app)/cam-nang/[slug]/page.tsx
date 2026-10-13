import { ArrowLeft, ArrowRight, Clock } from "@/components/icons";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentBlock, idDeMuc } from "@/components/handbook/blocks";
import { CoverArt } from "@/components/handbook/cover-art";
import { MucLucBai } from "@/components/handbook/muc-luc";
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

  // Đánh số đề mục một lượt ở đây, để thân bài và mục lục chắc chắn cùng mã neo.
  const khoi = article.blocks.map((block, i) => ({
    block,
    id:
      block.type === "heading"
        ? idDeMuc(
            article.blocks.slice(0, i).filter((b) => b.type === "heading")
              .length,
          )
        : undefined,
  }));
  const deMuc = khoi.flatMap(({ block, id }) =>
    block.type === "heading" && id ? [{ id, text: block.text }] : [],
  );

  return (
    <div className="mx-auto grid max-w-[60rem] grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_200px] xl:gap-14">
      <article className="min-w-0">
        <Link
          href="/cam-nang"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
        >
          <ArrowLeft className="size-4" />
          Cẩm nang
        </Link>

        <header className="pt-6">
          <p className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-lg bg-gold-100 px-2 py-0.5 text-[12px] font-semibold text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-500">
              <Clock className="size-3.5" />
              <span className="tabular">{article.minutes} phút đọc</span>
            </span>
          </p>
          <h1 className="font-display mt-4 text-[30px] leading-[1.1] font-bold text-ink-100 sm:text-[40px]">
            {article.title}
          </h1>
          <p className="mt-4 max-w-[65ch] text-[17px] leading-relaxed text-ink-400">
            {article.summary}
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
          <div className="relative mt-7 aspect-[16/9] overflow-hidden rounded-xl bg-navy-900 ring-1 ring-ink-800">
            <Image
              src={article.cover}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
            />
          </div>
        ) : article.art ? (
          <div className="mt-7 aspect-[16/9] overflow-hidden rounded-xl ring-1 ring-ink-800">
            <CoverArt motif={article.art} />
          </div>
        ) : null}

        {/*
          THÂN BÀI HẸP HƠN KHUNG, CỐ Ý.

          Tiêu đề và ảnh bìa ăn hết bề ngang cột — ở đó rộng là đúng. Chữ
          thường thì ngưỡng đọc không mỏi là 45–75 ký tự một dòng: dài quá
          thì mắt nhảy dòng hay bị lạc. 68ch giữ mỗi dòng quanh 70 ký tự.
        */}
        <div className="max-w-[65ch] pt-2 pb-4">
          {khoi.map(({ block, id }, i) => (
            <ContentBlock key={i} block={block} id={id} />
          ))}
        </div>

        {/* Bài kế tiếp */}
        <nav aria-label="Bài kế tiếp" className="mt-12 border-t border-ink-800 pt-6">
          <p className="text-[12.5px] font-semibold text-ink-500">Đọc tiếp</p>
          <Link
            href={`/cam-nang/${next.slug}`}
            className="group mt-3 flex items-center gap-4 rounded-xl border border-ink-800 bg-ink-900 p-3 transition-[border-color,transform] hover:border-ink-700 active:scale-[0.99]"
          >
            <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg bg-navy-900 sm:w-28">
              {next.cover ? (
                <Image
                  src={next.cover}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : next.art ? (
                <CoverArt motif={next.art} />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
                {next.category}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-[16px] leading-snug font-semibold text-ink-100 transition-colors group-hover:text-link">
                {next.title}
              </span>
            </span>
            <ArrowRight className="mr-1 size-5 shrink-0 text-ink-500 transition-transform group-hover:translate-x-1" />
          </Link>
        </nav>
      </article>

      {/* Mục lục dính bên phải, chỉ trên màn rộng */}
      {deMuc.length > 0 && (
        <aside className="hidden lg:block">
          <div className="sticky top-10 pt-[52px]">
            <MucLucBai items={deMuc} />
          </div>
        </aside>
      )}
    </div>
  );
}
