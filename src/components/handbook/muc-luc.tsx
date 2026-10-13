"use client";

import { ArrowRight, BookOpen, Clock, Search } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { CoverArt } from "@/components/handbook/cover-art";
import type { Article } from "@/content/cam-nang";
import { cn } from "@/lib/utils";

/** Bỏ dấu để gõ "khoi dong" vẫn tìm ra "khởi động". */
function khongDau(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** Bìa của một bài: ảnh chụp, không có thì bìa vẽ, không có nữa thì nền navy. */
function Bia({
  article,
  sizes,
  priority,
  className,
}: {
  article: Article;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("relative block overflow-hidden bg-navy-900", className)}
    >
      {article.cover ? (
        <Image
          src={article.cover}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      ) : article.art ? (
        <CoverArt
          motif={article.art}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <span className="grid size-full place-items-center">
          <BookOpen className="size-6 text-gold-300/60" />
        </span>
      )}
    </span>
  );
}

/** Chip chủ đề, vàng nhạt. */
function ChipNhom({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-gold-100 px-2 py-0.5 text-[12px] font-semibold text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
      {children}
    </span>
  );
}

function PhutDoc({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-500">
      <Clock className="size-3.5" />
      <span className="tabular">{minutes} phút đọc</span>
    </span>
  );
}

/** Bài nổi bật: bìa lớn bên trái, chữ bên phải; dưới md thì xếp chồng. */
function BaiNoiBat({ article, nhan }: { article: Article; nhan?: string }) {
  return (
    <Link
      href={`/cam-nang/${article.slug}`}
      className="group grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition-[border-color,transform] duration-200 hover:border-ink-700 active:scale-[0.995] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
    >
      <Bia
        article={article}
        sizes="(max-width: 768px) 100vw, 560px"
        priority
        className="aspect-[16/9] md:aspect-auto md:min-h-[300px]"
      />
      <span className="flex flex-col justify-center p-5 sm:p-7">
        <span className="flex flex-wrap items-center gap-2">
          <ChipNhom>{article.category}</ChipNhom>
          {nhan && (
            <span className="text-[12.5px] font-semibold text-ink-500">
              {nhan}
            </span>
          )}
        </span>
        <span className="font-display mt-3 block text-[24px] leading-[1.15] font-bold text-ink-100 transition-colors group-hover:text-link sm:text-[28px]">
          {article.title}
        </span>
        <span className="mt-2.5 block text-[15px] leading-relaxed text-ink-400">
          {article.summary}
        </span>
        <span className="mt-5 flex items-center justify-between gap-3">
          <PhutDoc minutes={article.minutes} />
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-link">
            Đọc bài
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </span>
    </Link>
  );
}

/** Thẻ vừa: bìa 16:9 trên, tiêu đề và câu dẫn dưới. */
function BaiVua({ article }: { article: Article }) {
  return (
    <Link
      href={`/cam-nang/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition-[border-color,transform] duration-200 hover:border-ink-700 active:scale-[0.99]"
    >
      <Bia
        article={article}
        sizes="(max-width: 640px) 100vw, 420px"
        className="aspect-[16/9]"
      />
      <span className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
          {article.category}
        </span>
        <span className="mt-1 block text-[17px] leading-snug font-bold text-ink-100 transition-colors group-hover:text-link">
          {article.title}
        </span>
        <span className="mt-1.5 line-clamp-2 block text-[13.5px] leading-relaxed text-ink-500">
          {article.summary}
        </span>
        <span className="mt-auto pt-3">
          <PhutDoc minutes={article.minutes} />
        </span>
      </span>
    </Link>
  );
}

/** Hàng gọn: ảnh nhỏ bên trái, tiêu đề hai dòng. Dùng cho phần còn lại và lúc tìm. */
function BaiHang({ article }: { article: Article }) {
  return (
    <Link
      href={`/cam-nang/${article.slug}`}
      className="group flex items-center gap-3.5 rounded-lg p-2 transition-colors hover:bg-ink-850"
    >
      {/* Ảnh nhỏ: đủ để mắt bám theo mà không biến mỗi hàng thành một tấm
          bưu thiếp. */}
      <Bia
        article={article}
        sizes="80px"
        className="aspect-[4/3] w-20 shrink-0 rounded-lg"
      />
      <span className="min-w-0 flex-1">
        {/* Hai dòng, không phải `truncate`: trên màn 390 một dòng cắt tiêu
            đề thành "Khởi động 10 phút trước khi…", mất đúng phần nói bài
            này về cái gì. Tiêu đề là thứ người ta quét để tìm. */}
        <span className="line-clamp-2 block text-[14.5px] leading-snug font-semibold text-ink-100 transition-colors group-hover:text-link">
          {article.title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-500">
          <span>{article.category}</span>
          <span aria-hidden className="text-ink-600">
            ·
          </span>
          <span className="tabular">{article.minutes} phút</span>
        </span>
      </span>
    </Link>
  );
}

function DanhSachHang({
  articles,
  title,
}: {
  articles: Article[];
  title?: string;
}) {
  return (
    <section aria-label={title ?? "Các bài khác"}>
      {title && (
        <h2 className="mb-3 text-[16px] font-semibold text-ink-100">{title}</h2>
      )}
      <div className="rounded-xl border border-ink-800 bg-ink-900 p-2">
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-x-2 md:grid-cols-2">
          {articles.map((a) => (
            <li key={a.slug}>
              <BaiHang article={a} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Mục lục cẩm nang.
 *
 * MỘT BÀI NỔI BẬT, HAI THẺ VỪA, CÒN LẠI LÀ HÀNG GỌN.
 *
 * Bản đầu là bìa tạp chí cao 480px: bài thứ HAI nằm ở y=1072, phải cuộn
 * qua hơn một màn mới thấy. Bản sau toàn hàng gọn thì tra nhanh nhưng
 * mười ba bài trông như nhau. Bản này giữ cả hai: bìa nổi bật nằm ngang
 * trên md (cao khoảng 300px, không phải 480px), và phần lớn bài vẫn là
 * hàng gọn hai cột, nên màn đầu đã thấy được bốn năm bài.
 *
 * Đang gõ tìm thì bỏ hẳn bìa lớn: lúc đó người ta TRA, chỉ cần danh sách.
 *
 * CHIP DANH MỤC BẤM ĐƯỢC. Trước đây chúng là thẻ `span` chỉ hiện số đếm,
 * trông hệt nút lọc mà bấm không có gì xảy ra.
 */
export function MucLucCamNang({
  articles,
  categories,
}: {
  articles: Article[];
  categories: readonly Article["category"][];
}) {
  const [tim, setTim] = React.useState("");
  const [nhom, setNhom] = React.useState<Article["category"] | null>(null);

  const tu = khongDau(tim.trim());
  const loc = React.useMemo(
    () =>
      articles.filter((a) => {
        if (nhom && a.category !== nhom) return false;
        if (!tu) return true;
        return (
          khongDau(a.title).includes(tu) ||
          khongDau(a.summary).includes(tu) ||
          khongDau(a.category).includes(tu)
        );
      }),
    [articles, tu, nhom],
  );

  const [noiBat, ...conLai] = loc;
  const vua = conLai.slice(0, 2);
  const hang = conLai.slice(2);

  const pill = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold whitespace-nowrap transition-colors",
      active
        ? "border-navy-900 bg-navy-900 text-white dark:border-ink-600 dark:bg-ink-700"
        : "border-ink-800 text-ink-400 hover:border-ink-700 hover:text-ink-100",
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Giữ đúng thứ tự khai báo của `CATEGORIES`, không sắp lại theo số
            bài: thứ tự đó là thứ tự người mới nên đọc. */}
        <div
          role="group"
          aria-label="Lọc theo chủ đề"
          className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0"
        >
          <button
            type="button"
            onClick={() => setNhom(null)}
            aria-pressed={nhom === null}
            className={pill(nhom === null)}
          >
            Tất cả
            <span className="tabular opacity-60">{articles.length}</span>
          </button>
          {categories.map((c) => {
            const n = articles.filter((a) => a.category === c).length;
            if (n === 0) return null;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setNhom(nhom === c ? null : c)}
                aria-pressed={nhom === c}
                className={pill(nhom === c)}
              >
                {c}
                <span className="tabular opacity-60">{n}</span>
              </button>
            );
          })}
        </div>

        <div className="relative md:w-64 md:shrink-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={tim}
            onChange={(e) => setTim(e.target.value)}
            placeholder="Tìm trong cẩm nang"
            aria-label="Tìm bài trong cẩm nang"
            className="h-10 w-full rounded-lg border border-ink-700 bg-ink-900 pr-3 pl-9 text-[14px] text-ink-200 outline-none transition-[border-color,box-shadow] placeholder:text-ink-500 hover:border-ink-600 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/25"
          />
        </div>
      </div>

      {loc.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-700 px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-ink-200">
            Không có bài nào khớp với “{tim.trim()}”
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-500">
            Thử gõ ngắn hơn, ví dụ “giao cầu” hay “khởi động”.
          </p>
          <button
            type="button"
            onClick={() => {
              setTim("");
              setNhom(null);
            }}
            className="mt-4 text-[13px] font-semibold text-link hover:underline"
          >
            Xem tất cả bài
          </button>
        </div>
      ) : tu ? (
        <DanhSachHang
          articles={loc}
          title={`${loc.length} bài khớp với “${tim.trim()}”`}
        />
      ) : (
        <>
          <BaiNoiBat
            article={noiBat}
            nhan={nhom ? undefined : "Nên đọc trước"}
          />

          {vua.length > 0 && (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              {vua.map((a) => (
                <li key={a.slug}>
                  <BaiVua article={a} />
                </li>
              ))}
            </ul>
          )}

          {hang.length > 0 && (
            <DanhSachHang articles={hang} title="Các bài khác" />
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mục lục trong một bài                                               */
/* ------------------------------------------------------------------ */

/**
 * Mục lục dính bên phải trang bài, chỉ hiện trên màn rộng.
 *
 * Tô đậm mục đang đọc bằng IntersectionObserver: đề mục nào vừa qua mép
 * trên một phần ba màn hình thì là mục hiện tại.
 */
export function MucLucBai({ items }: { items: { id: string; text: string }[] }) {
  const [dangDoc, setDangDoc] = React.useState<string | null>(null);

  React.useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const thay = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (thay[0]) setDangDoc(thay[0].target.id);
      },
      { rootMargin: "0px 0px -66% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Trong bài này">
      <p className="text-[12.5px] font-semibold text-ink-500">Trong bài này</p>
      <ol className="mt-3 space-y-0.5 border-l border-ink-800">
        {items.map((i) => {
          const active = dangDoc === i.id;
          return (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition-colors",
                  active
                    ? "border-gold-500 font-semibold text-ink-100"
                    : "border-transparent text-ink-500 hover:border-ink-700 hover:text-ink-100",
                )}
              >
                {i.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
