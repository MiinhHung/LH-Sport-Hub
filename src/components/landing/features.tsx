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
 * "Trong này có gì": bốn mục chính của app, mỗi tấm dẫn thẳng vào trang đó.
 *
 * MÀN RỘNG: bốn tấm đứng cạnh nhau như một dải accordion. Rê chuột (hoặc
 * Tab tới) tấm nào thì tấm đó giãn ra, ảnh sáng lên, chữ hiện dần; các tấm
 * khác co lại, tối đi và chỉ còn tên dọc. Không ai rê thì tấm đầu mở sẵn.
 * Toàn bộ là CSS (flex-grow + group/has), không có state, không chạy theo
 * cuộn. MÀN HẸP: xếp chồng, tấm nào cũng mở đủ.
 *
 * Màu chữ ghi thẳng trên từng phần tử: h3 toàn cục mặc định màu navy, trước
 * đây tiêu đề chìm mất trên nền tối.
 */
type Item = {
  href: string;
  title: string;
  body: string;
  cta: string;
  icon: IconType;
  image: string;
  alt: string;
  /** Lấy nét ảnh ở đâu khi khung cắt hẹp hơn ảnh. */
  focus?: string;
};

const ITEMS: Item[] = [
  {
    href: "/keo",
    title: "Kèo thách đấu",
    body: "Thách 1v1 hoặc 2v2, chốt điểm và phần thưởng trước khi ra sân. Thua thì bao.",
    cta: "Xem kèo đang mở",
    icon: Swords,
    image: "/images/landing/muc-keo.jpg",
    alt: "Hai cây vợt bắt chéo trên mặt sân xanh",
  },
  {
    href: "/buoi-tap",
    title: "Buổi tập",
    body: "Lịch ra sân sáng thứ 7, ai đi thì điểm danh một chạm.",
    cta: "Xem lịch tuần này",
    icon: CalendarDays,
    image: "/images/landing/muc-buoi-tap.jpg",
    alt: "Người chơi cầu lông trong nhà thi đấu, quả cầu nằm trên vạch sân",
    focus: "object-[40%_center]",
  },
  {
    href: "/bang-phong-than",
    title: "Xếp hạng",
    body: "Bảng phong thần theo tỉ lệ thắng, tự cập nhật sau mỗi trận có tỉ số.",
    cta: "Xem ai đang dẫn đầu",
    icon: Trophy,
    image: "/images/cam-nang/danh-doi.webp",
    alt: "Một cặp đánh đôi áo đỏ đứng thủ trước lưới",
    focus: "object-[55%_center]",
  },
  {
    href: "/cam-nang",
    title: "Cẩm nang",
    body: "Luật thi đấu, cách cầm vợt, đánh đôi và phép lịch sự trên sân.",
    cta: "Đọc cẩm nang",
    icon: BookOpen,
    image: "/images/cam-nang/cam-vot-va-cu-danh.webp",
    alt: "Các kiểu cầm vợt và tư thế đánh cầu",
    focus: "object-[70%_center]",
  },
];

/*
 * "Đang mở" trên màn rộng:
 *  - tấm đang được rê/Tab tới (group-hover/p, group-focus-visible/p);
 *  - hoặc tấm ĐẦU khi trong dải chưa có tấm nào được rê/Tab tới.
 * `group-has-[a:hover]/dai` chỉ bật khi chuột nằm TRÊN một tấm, nên rê vào
 * khe giữa hai tấm thì tấm đầu vẫn mở, không cả dải cùng co lại.
 */
const MO = {
  // Độ giãn của tấm.
  grow: {
    first:
      "lg:grow-[3.2] lg:group-has-[a:hover]/dai:grow lg:group-has-[a:focus-visible]/dai:grow lg:hover:grow-[3.2]! lg:focus-visible:grow-[3.2]!",
    rest: "lg:grow lg:hover:grow-[3.2] lg:focus-visible:grow-[3.2]",
  },
  // Thứ chỉ hiện khi mở (chữ ngang).
  hien: {
    first:
      "lg:opacity-100 lg:group-has-[a:hover]/dai:opacity-0 lg:group-has-[a:focus-visible]/dai:opacity-0 lg:group-hover/p:opacity-100! lg:group-focus-visible/p:opacity-100!",
    rest: "lg:opacity-0 lg:group-hover/p:opacity-100 lg:group-focus-visible/p:opacity-100",
  },
  // Thứ chỉ hiện khi đóng (tên dọc).
  an: {
    first:
      "lg:opacity-0 lg:group-has-[a:hover]/dai:opacity-100 lg:group-has-[a:focus-visible]/dai:opacity-100 lg:group-hover/p:opacity-0! lg:group-focus-visible/p:opacity-0!",
    rest: "lg:opacity-100 lg:group-hover/p:opacity-0 lg:group-focus-visible/p:opacity-0",
  },
  // Ảnh: đóng thì tối và hơi phóng, mở thì sáng và về cỡ thật.
  anh: {
    first:
      "lg:scale-100 lg:brightness-100 lg:group-has-[a:hover]/dai:scale-110 lg:group-has-[a:hover]/dai:brightness-[0.45] lg:group-has-[a:focus-visible]/dai:scale-110 lg:group-has-[a:focus-visible]/dai:brightness-[0.45] lg:group-hover/p:scale-100! lg:group-hover/p:brightness-100! lg:group-focus-visible/p:scale-100! lg:group-focus-visible/p:brightness-100!",
    rest: "lg:scale-110 lg:brightness-[0.45] lg:group-hover/p:scale-100 lg:group-hover/p:brightness-100 lg:group-focus-visible/p:scale-100 lg:group-focus-visible/p:brightness-100",
  },
  // Vạch vàng dưới đáy chạy từ trái sang khi mở.
  vach: {
    first:
      "lg:scale-x-100 lg:group-has-[a:hover]/dai:scale-x-0 lg:group-has-[a:focus-visible]/dai:scale-x-0 lg:group-hover/p:scale-x-100! lg:group-focus-visible/p:scale-x-100!",
    rest: "lg:scale-x-0 lg:group-hover/p:scale-x-100 lg:group-focus-visible/p:scale-x-100",
  },
};

function Panel({ item, index }: { item: Item; index: number }) {
  const Icon = item.icon;
  const k = index === 0 ? "first" : "rest";
  const so = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={item.href}
      className={cn(
        "group/p relative isolate flex h-[300px] flex-col justify-end overflow-hidden rounded-3xl bg-navy-900 text-white ring-1 ring-white/10 outline-none sm:h-[340px] lg:h-[540px] lg:min-w-0 lg:basis-0",
        "transition-[flex-grow,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        "hover:shadow-[0_30px_80px_-30px_rgba(220,174,66,0.45)] focus-visible:ring-2 focus-visible:ring-gold-300",
        MO.grow[k],
      )}
    >
      <Image
        src={item.image}
        alt={item.alt}
        fill
        sizes="(max-width: 1024px) 100vw, 720px"
        className={cn(
          "-z-20 object-cover transition-[transform,filter] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          item.focus,
          MO.anh[k],
        )}
      />
      {/* Lớp tối: đậm dưới chân cho chữ, nhạt dần lên đỉnh. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/55 to-navy-950/5"
      />
      {/* Vệt sáng quét chéo qua tấm mỗi lần rê vào. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 -z-10 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-[left,opacity] duration-1000 ease-out group-hover/p:left-[120%] group-hover/p:opacity-100 motion-reduce:hidden"
      />

      {/* Số + icon ở góc trên, luôn hiện. */}
      <div className="absolute inset-x-5 top-5 flex items-center justify-between sm:inset-x-6 sm:top-6">
        <span className="font-sport text-[15px] font-bold tracking-[0.25em] text-gold-300 tabular-nums">
          {so}
        </span>
        <span className="grid size-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md transition-colors duration-500 group-hover/p:bg-gold-400 group-hover/p:ring-gold-300">
          <Icon
            className="size-[22px] text-gold-300 transition-colors duration-500 group-hover/p:text-navy-950"
            aria-hidden
          />
        </span>
      </div>

      {/* Tên dọc: chỉ hiện khi tấm đang co (màn rộng). */}
      <span
        aria-hidden
        className={cn(
          "font-display pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 rotate-180 text-[24px] font-bold whitespace-nowrap text-white/90 transition-opacity duration-300 [writing-mode:vertical-rl] lg:block",
          MO.an[k],
        )}
      >
        {item.title}
      </span>

      {/* Nội dung chính: luôn hiện trên màn hẹp, hiện dần khi mở trên màn rộng. */}
      <div
        className={cn(
          "relative p-6 transition-opacity duration-500 sm:p-8 lg:w-[30rem] lg:max-w-full lg:delay-150 motion-reduce:transition-none",
          MO.hien[k],
        )}
      >
        <h3 className="font-display text-[28px] leading-tight font-bold text-white sm:text-[34px]">
          {item.title}
        </h3>
        <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-white/80 sm:text-[16px]">
          {item.body}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 py-2 pr-2 pl-4 text-[14px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md transition-colors duration-300 group-hover/p:bg-gold-400 group-hover/p:text-navy-950 group-hover/p:ring-gold-300">
          {item.cta}
          <span className="grid size-7 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover/p:translate-x-0.5 group-hover/p:-translate-y-0.5">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </span>
      </div>

      {/* Vạch vàng dưới đáy. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-[3px] origin-left bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          MO.vach[k],
        )}
      />
    </Link>
  );
}

export function LandingFeatures() {
  return (
    <section
      id="trong-nay-co-gi"
      data-on-navy
      className="relative isolate scroll-mt-20 overflow-hidden bg-navy-950 py-24 sm:py-32"
    >
      {/* Nền: lưới mờ + hai quầng vàng/xanh, cùng chất với hero. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="absolute -top-40 -left-32 -z-10 size-[520px] rounded-full bg-gold-400/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute -right-40 -bottom-48 -z-10 size-[560px] rounded-full bg-navy-600/30 blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <span className="font-sport text-[13px] font-bold tracking-[0.3em] text-gold-300 uppercase">
              LH Sport Hub
            </span>
            <h2 className="font-display mt-3 text-[36px] leading-[1.08] font-bold text-white sm:text-[52px]">
              Trong này có <span className="text-gold-300">gì</span>
            </h2>
          </Reveal>
          <Reveal delay={90}>
            <p className="max-w-[40ch] text-[16px] leading-relaxed text-white/65 lg:text-right">
              Bốn góc của sân nhà, bấm vào là tới.
              <span className="hidden lg:inline">
                {" "}
                Rê chuột qua từng tấm để xem trước.
              </span>
            </p>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="group/dai mt-12 flex flex-col gap-4 lg:mt-16 lg:flex-row lg:gap-3">
            {ITEMS.map((item, i) => (
              <Panel key={item.href} item={item} index={i} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
