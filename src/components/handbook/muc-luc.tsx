"use client";

import { BookOpen, Clock, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { CoverArt } from "@/components/handbook/cover-art";
import type { Article } from "@/content/cam-nang";
import { cn } from "@/lib/utils";

const ACCENTS: Record<Article["accent"], string> = {
  navy: "from-navy-800 to-navy-950",
  gold: "from-gold-500 to-gold-700",
  sky: "from-sky-600 to-sky-800",
  rose: "from-rose-500 to-rose-700",
  emerald: "from-emerald-600 to-emerald-800",
};

/** Bỏ dấu để gõ "khoi dong" vẫn tìm ra "khởi động". */
function khongDau(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Mục lục cẩm nang.
 *
 * ĐÂY LÀ SÁCH TRA, KHÔNG PHẢI TẠP CHÍ.
 *
 * Bản trước mở đầu bằng một dải bìa cao 340px rồi một thẻ bài nổi bật
 * cao 480px. Đo trên bản dựng: bài thứ HAI nằm ở y=1072 — phải cuộn qua
 * hơn một màn hình mới thấy bài thứ hai, trong khi mục này có 13 bài.
 * Màn đầu tiên cho xem đúng một bài.
 *
 * Mà người ta vào đây phần lớn không phải để đọc dạo: họ vào để TRA —
 * "giao cầu thế nào cho đúng luật", "khởi động mấy phút". Một bìa tạp
 * chí trả lời rất tệ câu hỏi đó.
 *
 * Nên: hàng gọn, nhóm theo chủ đề, có ô tìm. Mười ba bài nằm vừa một
 * màn. Ảnh lớn dành cho trang bài, nơi nó thật sự có việc để làm.
 *
 * CHIP DANH MỤC GIỜ BẤM ĐƯỢC. Trước đây chúng là thẻ `span` chỉ hiện số
 * đếm — trông hệt như nút lọc nhưng bấm không có gì xảy ra, kiểu hứa hão
 * khó chịu nhất trong giao diện.
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

  const loc = React.useMemo(() => {
    const tu = khongDau(tim.trim());
    return articles.filter((a) => {
      if (nhom && a.category !== nhom) return false;
      if (!tu) return true;
      return (
        khongDau(a.title).includes(tu) ||
        khongDau(a.summary).includes(tu) ||
        khongDau(a.category).includes(tu)
      );
    });
  }, [articles, tim, nhom]);

  // Giữ đúng thứ tự khai báo của `CATEGORIES`, không sắp lại theo số bài:
  // thứ tự đó là thứ tự người mới nên đọc.
  const theoNhom = categories
    .map((c) => ({ ten: c, bai: loc.filter((a) => a.category === c) }))
    .filter((g) => g.bai.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500"
            aria-hidden
          />
          <input
            value={tim}
            onChange={(e) => setTim(e.target.value)}
            placeholder="Tìm trong cẩm nang..."
            aria-label="Tìm bài trong cẩm nang"
            className="h-10 w-full rounded-xl border border-ink-800 bg-ink-850 pr-3 pl-9 text-[14px] text-ink-200 outline-none placeholder:text-ink-500 focus:border-ink-700"
          />
        </div>

        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setNhom(null)}
            aria-pressed={nhom === null}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors",
              nhom === null
                ? "bg-navy-900 text-white"
                : "bg-ink-850 text-ink-400 hover:text-ink-200",
            )}
          >
            Tất cả
            <span className="tabular ml-1.5 opacity-60">{articles.length}</span>
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
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors",
                  nhom === c
                    ? "bg-navy-900 text-white"
                    : "bg-ink-850 text-ink-400 hover:text-ink-200",
                )}
              >
                {c}
                <span className="tabular ml-1.5 opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loc.length === 0 ? (
        <p className="py-12 text-center text-[14px] text-ink-500">
          Không có bài nào khớp với “{tim}”.
        </p>
      ) : (
        theoNhom.map((g) => (
          <section key={g.ten} aria-labelledby={`nhom-${g.ten}`}>
            <h2
              id={`nhom-${g.ten}`}
              className="mb-2.5 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase"
            >
              {g.ten}
            </h2>

            <ul className="overflow-hidden rounded-2xl ring-1 ring-ink-800">
              {g.bai.map((a) => (
                <li
                  key={a.slug}
                  className="border-b border-ink-800 last:border-b-0"
                >
                  <Link
                    href={`/cam-nang/${a.slug}`}
                    className="group flex items-center gap-3.5 bg-ink-900 p-3 transition-colors hover:bg-ink-850"
                  >
                    {/* Ảnh nhỏ 56px: đủ để mắt bám theo mà không biến
                        mỗi hàng thành một tấm bưu thiếp. */}
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                      {a.cover ? (
                        <Image
                          src={a.cover}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : a.art ? (
                        <CoverArt motif={a.art} />
                      ) : (
                        <span
                          className={cn(
                            "grid size-full place-items-center bg-gradient-to-br",
                            ACCENTS[a.accent],
                          )}
                        >
                          <BookOpen
                            className="size-5 text-white/40"
                            aria-hidden
                          />
                        </span>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      {/* Hai dòng, không phải `truncate`: trên màn 390
                          một dòng cắt tiêu đề thành "Khởi động 10 phút
                          trước khi…" — mất đúng phần nói bài này về cái
                          gì. Tiêu đề là thứ người ta quét để tìm, cắt nó
                          là hỏng việc chính của trang. */}
                      <span className="line-clamp-2 block text-[15px] leading-snug font-bold text-ink-100 transition-colors group-hover:text-link">
                        {a.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-ink-500">
                        {a.summary}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-ink-500">
                      <Clock className="size-3.5" aria-hidden />
                      {a.minutes}′
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
