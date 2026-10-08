import { Info, TriangleAlert } from "lucide-react";
import Image from "next/image";

import { CourtDiagram, DoublesFormation } from "./court-diagram";
import type { Block } from "@/content/cam-nang";

/** Vẽ một khối nội dung của bài cẩm nang. */
export function ContentBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "para":
      return (
        <p className="mt-5 text-[16.5px] leading-[1.75] text-ink-300">
          {block.text}
        </p>
      );

    case "heading":
      return (
        <h2 className="font-display mt-11 mb-1 text-[24px] leading-tight font-bold text-ink-100">
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
                className="mt-[11px] size-1.5 shrink-0 rounded-full bg-gold-400"
              />
              {item}
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="mt-6 space-y-5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4">
              <span
                aria-hidden
                className="font-display grid size-9 shrink-0 place-items-center rounded-xl bg-navy-900 text-[15px] font-bold text-gold-300"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="text-[16px] font-bold text-ink-100">
                    {item.title}
                  </span>
                  {item.meta && (
                    <span className="text-[12px] font-semibold text-gold-700 dark:text-gold-300">
                      {item.meta}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[15.5px] leading-[1.7] text-ink-400">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "note": {
      const tip = block.tone === "tip";
      const Icon = tip ? Info : TriangleAlert;
      return (
        <aside
          className={
            tip
              ? "mt-7 flex gap-3 rounded-2xl border border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-500/10 p-4"
              : "mt-7 flex gap-3 rounded-2xl border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/10 p-4"
          }
        >
          <Icon
            className={
              tip
                ? "mt-0.5 size-[18px] shrink-0 text-sky-600"
                : "mt-0.5 size-[18px] shrink-0 text-amber-600"
            }
            aria-hidden
          />
          <p
            className={
              tip
                ? "text-[15px] leading-relaxed text-sky-900 dark:text-sky-200"
                : "text-[15px] leading-relaxed text-amber-900 dark:text-amber-200"
            }
          >
            {block.text}
          </p>
        </aside>
      );
    }

    case "facts":
      return (
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-800 bg-ink-800 sm:grid-cols-4">
          {block.items.map((item) => (
            <div key={item.label} className="bg-ink-900 p-4">
              <dt className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                {item.label}
              </dt>
              <dd className="tabular font-display mt-1.5 text-[19px] leading-tight font-bold text-ink-100">
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
            sizes="(max-width: 768px) 100vw, 720px"
            className="h-auto w-full rounded-2xl object-cover ring-1 ring-ink-800"
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
