"use client";

import Image from "next/image";
import * as React from "react";

/**
 * Đường dây tự vẽ theo tiến độ cuộn, có quả cầu nhỏ chạy dọc theo.
 *
 * Cách làm: một đường SVG duy nhất, tô bằng nét đứt dài đúng bằng chính nó
 * (`stroke-dasharray = độ dài`). Đẩy `stroke-dashoffset` từ full về 0 thì
 * nét hiện dần ra — đó là toàn bộ mẹo "tự vẽ". Quả cầu lấy toạ độ từ
 * `getPointAtLength`, nên nó luôn nằm đúng trên đường.
 *
 * KHUNG NHÌN ĐO BẰNG PIXEL THẬT, và đây là chỗ dễ sai nhất.
 *
 * Cách làm quen thuộc là đặt khung nhìn 0–100 rồi `preserveAspectRatio="none"`
 * cho nó giãn đầy khối. Nhưng như vậy hai trục bị kéo méo khác nhau, nét vẽ
 * sẽ chỗ dày chỗ mỏng, mà cách chữa thông thường — `vector-effect:
 * non-scaling-stroke` — lại khiến `stroke-dasharray` được tính theo hệ toạ
 * độ MÀN HÌNH, trong khi `getTotalLength()` vẫn trả về độ dài theo hệ NGƯỜI
 * DÙNG. Hai con số không cùng đơn vị thì đường vẽ sai nhịp, và mức sai còn
 * tuỳ trình duyệt.
 *
 * Nên ở đây khối được đo thật rồi khung nhìn đặt đúng bằng số pixel đó.
 * Không còn phép kéo méo nào: một đơn vị người dùng là một pixel, nét đều,
 * `getTotalLength` và `dasharray` cùng hệ.
 *
 * Vòng cuộn ghi thẳng vào `style` qua ref, không đụng state của React — đặt
 * tiến độ vào state thì mỗi khung hình cuộn là một lần render lại cả cây.
 */

/** Ảnh mở đầu. Thả ảnh động tác vào `public/images/landing/` rồi đổi ở đây. */
const LEAD_PHOTO = "/images/feed-3.jpg";

type Stop = {
  /** Vị trí theo chiều dọc, phần trăm chiều cao khối. */
  y: number;
  side: "left" | "right";
  eyebrow: string;
  title: string;
  body: string;
  photo: string;
};

const STOPS: Stop[] = [
  {
    y: 20,
    side: "left",
    eyebrow: "Tối thứ 6",
    title: "Chốt kèo",
    body: "Ai thách ai, mấy điểm, thua thì bao gì. Ghi ra hết cho khỏi cãi sáng hôm sau.",
    photo: "/images/feed-1.jpg",
  },
  {
    y: 40,
    side: "right",
    eyebrow: "7 giờ sáng",
    title: "Sân mở",
    body: "Trời còn mát, sân còn vắng. Khởi động mười lăm phút rồi mới vào ván đầu.",
    photo: "/images/feed-2.jpg",
  },
  {
    y: 60,
    side: "left",
    eyebrow: "Hai tiếng sau",
    title: "Đánh",
    body: "Cầu bay, người hò, thỉnh thoảng có quả chạm vạch rồi cãi nhau một lúc.",
    photo: "/images/feed-4.jpg",
  },
  {
    y: 80,
    side: "right",
    eyebrow: "Chín giờ",
    title: "Trả kèo",
    body: "Đội thua bao đội thắng. Xong vẫn còn nguyên ngày thứ 7 phía trước.",
    photo: "/images/feed-3.jpg",
  },
];

/**
 * Đường đi, ghi theo phần trăm khối (0–100 cho cả hai trục) rồi mới quy ra
 * pixel. Để ở dạng số thay vì chuỗi để đổi kích thước là tính lại được.
 */
type Cmd = [string, ...number[]];

/** Uốn lượn so le hai bên — màn hình rộng. */
const WIDE: Cmd[] = [
  ["M", 50, 2],
  ["C", 50, 10, 22, 12, 22, 20],
  ["C", 22, 30, 78, 30, 78, 40],
  ["C", 78, 50, 22, 50, 22, 60],
  ["C", 22, 70, 78, 70, 78, 80],
  ["C", 78, 88, 50, 90, 50, 98],
];

/** Men sát mép trái, thẻ xếp một cột — màn hình hẹp. */
const NARROW: Cmd[] = [
  ["M", 10, 2],
  ["C", 10, 12, 7, 14, 7, 20],
  ["C", 7, 30, 13, 32, 13, 40],
  ["C", 13, 50, 7, 52, 7, 60],
  ["C", 7, 70, 13, 72, 13, 80],
  ["C", 13, 88, 10, 90, 10, 98],
];

/** Quy đường từ phần trăm ra pixel. Số lẻ là x, số chẵn là y. */
function toPath(cmds: Cmd[], w: number, h: number) {
  return cmds
    .map(([op, ...nums]) => {
      const scaled = nums.map((n, i) =>
        ((n / 100) * (i % 2 === 0 ? w : h)).toFixed(1),
      );
      return `${op} ${scaled.join(" ")}`;
    })
    .join(" ");
}

export function JourneyLine() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const shuttleRef = React.useRef<HTMLDivElement>(null);
  const stopRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const [narrow, setNarrow] = React.useState(false);
  const [calm, setCalm] = React.useState(false);

  // Đo khối thật. Chiều cao tính theo vh nên đổi cỡ cửa sổ là phải đo lại.
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Quyết định sau khi mount: máy chủ không biết bề ngang màn hình.
  React.useEffect(() => {
    const narrowQ = window.matchMedia("(max-width: 767px)");
    const calmQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setNarrow(narrowQ.matches);
      setCalm(calmQ.matches);
    };
    apply();
    narrowQ.addEventListener("change", apply);
    calmQ.addEventListener("change", apply);
    return () => {
      narrowQ.removeEventListener("change", apply);
      calmQ.removeEventListener("change", apply);
    };
  }, []);

  const ready = box.w > 0 && box.h > 0;
  const d = ready ? toPath(narrow ? NARROW : WIDE, box.w, box.h) : "";

  React.useEffect(() => {
    const path = pathRef.current;
    const section = sectionRef.current;
    if (!path || !section || !d) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    const paint = (p: number) => {
      path.style.strokeDashoffset = `${length * (1 - p)}`;

      const pt = path.getPointAtLength(length * p);
      const shuttle = shuttleRef.current;
      if (shuttle) {
        // Khung nhìn tính bằng pixel nên toạ độ trả về dùng thẳng được.
        shuttle.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%)`;
        shuttle.style.opacity = p > 0.01 && p < 0.995 ? "1" : "0";
      }

      // Thẻ hiện ra khi đường đã vẽ tới ngang nó.
      STOPS.forEach((stop, i) => {
        const el = stopRefs.current[i];
        if (!el) return;
        const shown = p * 100 >= stop.y - 6;
        el.style.opacity = shown ? "1" : "0";
        el.style.transform = shown ? "translateY(0)" : "translateY(18px)";
      });
    };

    if (calm) {
      paint(1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Bắt đầu vẽ khi đỉnh khối lên tới 70% chiều cao màn hình, và vẽ xong
      // trước khi đáy khối rời khỏi màn hình.
      const total = rect.height - vh * 0.4;
      const travelled = vh * 0.7 - rect.top;
      paint(total > 0 ? Math.min(1, Math.max(0, travelled / total)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [d, calm]);

  return (
    <section className="relative overflow-hidden bg-[#000d26]">
      {/* Mở đầu: ảnh lớn, chữ đè lên */}
      <div className="relative h-[70svh] min-h-[420px] w-full">
        <Image
          src={LEAD_PHOTO}
          alt="Thành viên team Light Human trên sân cầu lông"
          fill
          sizes="100vw"
          priority={false}
          className="object-cover"
          style={{ filter: "grayscale(0.55) contrast(1.05) brightness(0.7)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000d26] via-[#000d26]/35 to-[#000d26]" />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-16 text-center sm:px-10">
          <div className="mx-auto max-w-2xl">
            <p className="text-[10px] font-semibold tracking-[0.32em] text-gold-400 uppercase">
              Một buổi sáng thứ 7
            </p>
            <h2 className="font-display mt-4 text-[32px] leading-[1.08] font-bold text-[#f2ede3] sm:text-[48px]">
              Từ lúc chốt kèo
              <br />
              tới lúc trả kèo
            </h2>
          </div>
        </div>
      </div>

      {/* Đường dây */}
      <div
        ref={sectionRef}
        className="relative mx-auto h-[280vh] w-full max-w-5xl px-5 sm:px-10"
      >
        {ready && (
          <svg
            viewBox={`0 0 ${box.w} ${box.h}`}
            width={box.w}
            height={box.h}
            className="pointer-events-none absolute inset-0"
            aria-hidden
          >
            {/* Đường mờ — cho thấy trước quãng còn lại */}
            <path
              d={d}
              fill="none"
              stroke="#f2ede3"
              strokeOpacity={0.12}
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Đường vàng, vẽ dần theo cuộn */}
            <path
              ref={pathRef}
              d={d}
              fill="none"
              stroke="#dcae42"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Quả cầu chạy trên đường. Đặt ở gốc toạ độ rồi dời bằng transform,
            nên chỉ chạm tới compositor chứ không bắt tính lại bố cục. */}
        <div
          ref={shuttleRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 opacity-0 transition-opacity duration-300 will-change-transform"
        >
          <span className="absolute inset-0 -z-10 m-auto block size-10 rounded-full bg-gold-400/25 blur-md" />
          <ShuttleMark />
        </div>

        {/* Các chặng */}
        {STOPS.map((stop, i) => (
          <div
            key={stop.title}
            ref={(el) => {
              stopRefs.current[i] = el;
            }}
            className={[
              "absolute -translate-y-1/2 opacity-0 transition-all duration-700 ease-out",
              narrow
                ? "right-5 left-[22%]"
                : stop.side === "left"
                  ? "left-10 w-[38%]"
                  : "right-10 w-[38%]",
            ].join(" ")}
            style={{ top: `${stop.y}%` }}
          >
            <div className="overflow-hidden rounded-2xl ring-1 ring-[#f2ede3]/15">
              <div className="relative aspect-[16/10]">
                <Image
                  src={stop.photo}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 78vw, 420px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000d26] via-[#000d26]/15 to-transparent" />
              </div>
            </div>
            <p className="mt-4 text-[10px] font-semibold tracking-[0.28em] text-gold-400 uppercase">
              {stop.eyebrow}
            </p>
            <h3 className="font-display mt-1.5 text-[24px] leading-tight font-bold text-[#f2ede3] sm:text-[28px]">
              {stop.title}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#f2ede3]/60">
              {stop.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Quả cầu lông nhỏ, vẽ tối giản cho cỡ 28px. */
function ShuttleMark() {
  return (
    <svg width="28" height="28" viewBox="-16 -16 32 32" aria-hidden>
      <path
        d="M -3 2 L -9 -11 A 9 3 0 0 0 9 -11 L 3 2 Z"
        fill="#dcae42"
        fillOpacity={0.3}
        stroke="#e8c56a"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <g stroke="#e8c56a" strokeWidth={0.9} opacity={0.75}>
        <line x1={-1.5} y1={2} x2={-4.5} y2={-11} />
        <line x1={1.5} y1={2} x2={4.5} y2={-11} />
      </g>
      <circle cx={0} cy={5} r={4.5} fill="#dcae42" />
    </svg>
  );
}
