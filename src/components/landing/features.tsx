import Image from "next/image";
import Link from "next/link";

import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Swords,
  Trophy,
  type IconType,
} from "@/components/icons";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

/**
 * "Trong này có gì": bốn mục chính của app, mỗi ô dẫn thẳng vào trang đó.
 *
 * Thay cho khối ghim 380vh cũ. Khối đó gọi setState ở MỖI khung hình cuộn
 * nên cả section (sân SVG, thẻ xem trước, thanh tiến trình) dựng lại liên
 * tục, và kèm số liệu bịa ("14/16 đã đăng ký", "1,420 Elo"). Ở đây không có
 * gì chạy theo cuộn, không có số nào không có thật.
 *
 * Lưới 6 cột, hai hàng 4+2 rồi 3+3. Hai ô có ảnh thật, hai ô tô màu thương
 * hiệu. Màn hẹp: một cột.
 */
type Item = {
  href: string;
  title: string;
  body: string;
  icon: IconType;
  span: string;
  tone: "photo" | "navy" | "gold";
  image?: string;
  alt?: string;
};

const ITEMS: Item[] = [
  {
    href: "/keo",
    title: "Kèo thách đấu",
    body: "Thách 1v1 hoặc 2v2, chốt điểm và phần thưởng trước khi ra sân. Thua thì bao.",
    icon: Swords,
    span: "lg:col-span-4",
    tone: "photo",
    image: "/images/landing/muc-keo.jpg",
    alt: "Hai cây vợt bắt chéo trên mặt sân xanh",
  },
  {
    href: "/buoi-tap",
    title: "Buổi tập",
    body: "Lịch ra sân sáng thứ 7, ai đi thì điểm danh một chạm.",
    icon: CalendarDays,
    span: "lg:col-span-2",
    tone: "photo",
    image: "/images/landing/muc-buoi-tap.jpg",
    alt: "Người chơi cầu lông trong nhà thi đấu, quả cầu nằm trên vạch sân",
  },
  {
    href: "/bang-phong-than",
    title: "Xếp hạng",
    body: "Bảng phong thần theo tỉ lệ thắng, tự cập nhật sau mỗi trận có tỉ số.",
    icon: Trophy,
    span: "lg:col-span-3",
    tone: "navy",
  },
  {
    href: "/cam-nang",
    title: "Cẩm nang",
    body: "Luật thi đấu, cách cầm vợt, đánh đôi và phép lịch sự trên sân.",
    icon: BookOpen,
    span: "lg:col-span-3",
    tone: "gold",
  },
];

function Tile({ item }: { item: Item }) {
  const Icon = item.icon;
  const onPhoto = item.tone === "photo";

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex h-full min-h-[260px] flex-col justify-end overflow-hidden rounded-2xl p-6 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 active:scale-[0.99] sm:p-7 lg:min-h-[300px]",
        item.tone === "navy" && "bg-navy-900 text-white",
        item.tone === "gold" && "bg-gold-100 text-navy-900",
        onPhoto && "bg-navy-950 text-white",
      )}
    >
      {onPhoto && item.image && (
        <>
          <Image
            src={item.image}
            alt={item.alt ?? ""}
            fill
            sizes="(max-width: 1024px) 100vw, 760px"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
          {/* Lớp tối dưới chân ảnh để chữ trắng đạt tương phản. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/45 to-navy-950/0"
          />
        </>
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <Icon
            className={cn(
              "size-6",
              item.tone === "gold" ? "text-gold-700" : "text-gold-300",
            )}
          />
          <h3 className="font-display mt-4 text-[24px] leading-tight font-bold sm:text-[26px]">
            {item.title}
          </h3>
          <p
            className={cn(
              "mt-2 max-w-[40ch] text-[15px] leading-relaxed",
              item.tone === "gold" ? "text-ink-300" : "text-white/80",
            )}
          >
            {item.body}
          </p>
        </div>
        <ArrowUpRight
          className={cn(
            "size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            item.tone === "gold" ? "text-navy-900" : "text-white",
          )}
        />
      </div>
    </Link>
  );
}

export function LandingFeatures() {
  return (
    <section
      id="trong-nay-co-gi"
      className="scroll-mt-20 bg-navy-50 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-display text-[32px] leading-[1.12] font-bold text-navy-900 sm:text-[44px]">
            Trong này có gì
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-6 lg:gap-5">
          {ITEMS.map((item, i) => (
            <Reveal key={item.href} delay={(i % 2) * 90} className={item.span}>
              <Tile item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
