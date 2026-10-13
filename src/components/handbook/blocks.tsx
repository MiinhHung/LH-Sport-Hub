import { Info, TriangleAlert } from "@/components/icons";
import Image from "next/image";

import { CourtDiagram, DoublesFormation } from "./court-diagram";
import type { Block } from "@/content/cam-nang";

/** Mã neo của đề mục thứ `i` trong bài. Trang bài và mục lục dùng chung. */
export function idDeMuc(i: number) {
  return `muc-${i + 1}`;
}

/**
 * Vẽ một khối nội dung của bài cẩm nang.
 *
 * `id` chỉ dùng cho đề mục, để mục lục bên phải nhảy tới được.
 */
export function ContentBlock({ block, id }: { block: Block; id?: string }) {
  switch (block.type) {
    case "para":
      return (
        <p className="mt-5 text-[16px] leading-[1.7] text-ink-300">
          {block.text}
        </p>
      );

    case "heading":
      return (
        <h2
          id={id}
          className="font-display mt-12 mb-1 scroll-mt-20 text-[22px] leading-tight font-bold text-ink-100 sm:text-[24px] lg:scroll-mt-10"
        >
          {block.text}
        </h2>
      );

    case "list":
      return (
        <ul className="mt-5 space-y-2.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-[16px] leading-[1.7] text-ink-300"
            >
              <span
                aria-hidden
                className="mt-[11px] size-1.5 shrink-0 rounded-full bg-gold-500"
              />
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      // Một đường dọc nối các số: đọc ra là một trình tự, không phải năm ý rời.
      return (
        <ol className="mt-6">
          {block.items.map((item, i) => (
            <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
              {i < block.items.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-10 bottom-1 left-[17px] w-px bg-ink-800"
                />
              )}
              <span
                aria-hidden
                className="tabular font-display relative grid size-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-[15px] font-bold text-gold-300"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span className="text-[16px] font-semibold text-ink-100">
                    {item.title}
                  </span>
                  {item.meta && (
                    <span className="text-[12.5px] font-semibold text-gold-700 dark:text-gold-300">
                      {item.meta}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[16px] leading-[1.7] text-ink-400">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "note": {
      // Mẹo dùng tông navy; cảnh báo dùng vàng (trạng thái cần chú ý).
      const tip = block.tone === "tip";
      const Icon = tip ? Info : TriangleAlert;
      return (
        <aside
          className={
            tip
              ? "mt-7 flex gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4 dark:border-navy-600/35 dark:bg-navy-600/15"
              : "mt-7 flex gap-3 rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-gold-400/30 dark:bg-gold-400/10"
          }
        >
          <span
            aria-hidden
            className={
              tip
                ? "grid size-8 shrink-0 place-items-center rounded-lg bg-navy-900 text-gold-300"
                : "grid size-8 shrink-0 place-items-center rounded-lg bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300"
            }
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 pt-0.5">
            <p
              className={
                tip
                  ? "text-[13px] font-semibold text-ink-100"
                  : "text-[13px] font-semibold text-gold-700 dark:text-gold-300"
              }
            >
              {tip ? "Mẹo" : "Lưu ý"}
            </p>
            <p
              className={
                tip
                  ? "mt-0.5 text-[15.5px] leading-relaxed text-ink-300"
                  : "mt-0.5 text-[15.5px] leading-relaxed text-ink-300"
              }
            >
              {block.text}
            </p>
          </div>
        </aside>
      );
    }

    case "facts":
      return (
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-800 bg-ink-800 sm:grid-cols-4">
          {block.items.map((item) => (
            <div key={item.label} className="bg-ink-900 p-4">
              <dt className="text-[12.5px] font-medium text-ink-500">
                {item.label}
              </dt>
              <dd className="tabular font-display mt-1 text-[19px] leading-tight font-bold text-ink-100">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      );

    case "court":
      return (
        <CourtDiagram highlight={block.highlight} caption={block.caption} />
      );

    case "formation":
      return <DoublesFormation mode={block.mode} caption={block.caption} />;

    case "photo":
      return (
        <figure className="my-7">
          <Image
            src={block.src}
            alt={block.alt}
            width={1200}
            height={800}
            sizes="(max-width: 768px) 100vw, 680px"
            className="h-auto w-full rounded-xl object-cover ring-1 ring-ink-800"
          />
          {block.caption && (
            <figcaption className="mt-3 text-center text-[12.5px] text-ink-500">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
  }
}
