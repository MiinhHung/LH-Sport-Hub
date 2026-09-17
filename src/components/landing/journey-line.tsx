"use client";

import Image from "next/image";
import * as React from "react";

/**
 * Dải "một buổi sáng thứ 7": người đánh cầu ở góc trái, quả cầu bật ra từ
 * mặt vợt rồi bay dọc một đường tự vẽ theo tiến độ cuộn, đi qua từng chặng.
 *
 * ĐƯỜNG ĐI NỘI SUY QUA CÁC ĐIỂM MỐC, không phải căn tay từng đoạn cong.
 *
 * Bản trước tôi gõ tay các điểm điều khiển Bézier rồi chỉnh cho khớp vị trí
 * thẻ. Cách đó sai về bản chất: dời một cái thẻ là phải căn lại cả đường.
 * Ở đây khai báo điểm mốc trước — mặt vợt, rồi bốn chặng, rồi đuôi — và
 * chuyển Catmull-Rom sang Bézier để đường ĐI ĐÚNG QUA từng điểm đó. Muốn
 * dời thẻ thì chỉ sửa một con số, đường tự bám theo.
 *
 * KHUNG NHÌN ĐO BẰNG PIXEL THẬT.
 *
 * Cách quen thuộc là khung nhìn 0–100 + `preserveAspectRatio="none"` cho
 * giãn đầy khối. Nhưng như vậy hai trục bị kéo méo khác nhau, nét vẽ chỗ dày
 * chỗ mỏng, mà cách chữa thông thường — `vector-effect: non-scaling-stroke`
 * — lại khiến `stroke-dasharray` tính theo hệ toạ độ MÀN HÌNH trong khi
 * `getTotalLength()` vẫn trả độ dài theo hệ NGƯỜI DÙNG. Hai con số khác đơn
 * vị thì đường vẽ sai nhịp, mức sai tuỳ trình duyệt. Nên khối được đo thật
 * rồi khung nhìn đặt đúng số pixel đó.
 *
 * Vòng cuộn ghi thẳng vào `style` qua ref, không đụng state của React — đặt
 * tiến độ vào state thì mỗi khung hình cuộn là một lần render lại cả cây.
 */

const LEAD_PHOTO = "/images/landing/danh-cau.webp";

/**
 * Vị trí đầu vợt trong tấm ảnh, theo tỉ lệ khung ảnh. Quả cầu xuất phát từ
 * đây. Hai số này ĐO ĐƯỢC chứ không ước lượng: quét ảnh tìm điểm cao nhất
 * của vùng tối, vì đầu vợt là thứ nhô lên trên cùng.
 */
const RACKET = { x: 0.401, y: 0.156 };

type Stop = {
  /** Số thứ tự, hiện dạng chữ nhỏ phía trên tiêu đề. */
  eyebrow: string;
  title: string;
  photo: string;
};

const STOPS: Stop[] = [
  {
    eyebrow: "01",
    title: "Chia sẻ niềm đam mê thể thao",
    photo: "/images/feed-1.jpg",
  },
  {
    eyebrow: "02",
    title: "Thư giãn sau những ngày làm việc căng thẳng",
    photo: "/images/feed-2.jpg",
  },
  {
    eyebrow: "03",
    title: "Tạo thêm năng lượng tích cực cho tuần mới",
    photo: "/images/feed-4.jpg",
  },
  {
    eyebrow: "04",
    title: "Kết nối và gắn bó hơn",
    photo: "/images/feed-3.jpg",
  },
];

type Pt = { x: number; y: number };

/** Mốc của bốn chặng, phần trăm khối. Thẻ căn theo đúng mốc này. */
const ANCHORS_WIDE: Pt[] = [
  { x: 72, y: 30 },
  { x: 28, y: 49 },
  { x: 72, y: 68 },
  { x: 28, y: 87 },
];

const ANCHORS_NARROW: Pt[] = [
  { x: 9, y: 30 },
  { x: 13, y: 49 },
  { x: 9, y: 68 },
  { x: 13, y: 87 },
];

/**
 * Nối các điểm thành đường cong trơn ĐI QUA tất cả chúng.
 *
 * Catmull-Rom suy ra hai điểm điều khiển của mỗi đoạn từ điểm trước và điểm
 * sau, nên chỗ nối mượt mà đường vẫn chạm đúng từng mốc. Hai đầu nhân đôi
 * điểm biên để đoạn đầu và đoạn cuối cũng đủ hàng xóm.
 */
function smoothPath(points: Pt[], w: number, h: number) {
  const p = points.map(({ x, y }) => ({ x: (x / 100) * w, y: (y / 100) * h }));
  if (p.length < 2) return "";

  const at = (i: number) => p[Math.max(0, Math.min(p.length - 1, i))];
  let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;

  for (let i = 0; i < p.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d +=
      ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}` +
      ` ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}` +
      ` ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function JourneyLine() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const shuttleRef = React.useRef<HTMLDivElement>(null);
  const stopRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const [start, setStart] = React.useState<Pt | null>(null);
  const [narrow, setNarrow] = React.useState(false);
  const [calm, setCalm] = React.useState(false);

  // Đo khối, và đo luôn vị trí mặt vợt bên trong nó. Cả hai đổi theo cỡ
  // cửa sổ nên phải theo dõi liên tục chứ không đo một lần.
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setBox({ w: Math.round(rect.width), h: Math.round(rect.height) });

      const panel = panelRef.current;
      if (panel && rect.width > 0 && rect.height > 0) {
        const pr = panel.getBoundingClientRect();
        setStart({
          x: ((pr.left - rect.left + pr.width * RACKET.x) / rect.width) * 100,
          y: ((pr.top - rect.top + pr.height * RACKET.y) / rect.height) * 100,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (panelRef.current) ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, []);

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

  const anchors = narrow ? ANCHORS_NARROW : ANCHORS_WIDE;
  const ready = box.w > 0 && box.h > 0 && start !== null;
  const d = ready
    ? smoothPath(
        [start, ...anchors, { x: narrow ? 11 : 50, y: 97 }],
        box.w,
        box.h,
      )
    : "";

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
        // Cú đánh: quả cầu nảy lên cỡ đầy trong khoảnh khắc rời mặt vợt,
        // thay vì đứng sẵn nguyên cỡ rồi mới trôi đi.
        const pop = Math.min(1, p / 0.035);
        const scale = 0.45 + 0.55 * pop;
        shuttle.style.transform =
          `translate(${pt.x}px, ${pt.y}px)` +
          ` translate(-50%, -50%) scale(${scale.toFixed(3)})`;
        shuttle.style.opacity = p < 0.995 ? "1" : "0";
      }

      anchors.forEach((a, i) => {
        const el = stopRefs.current[i];
        if (!el) return;
        const shown = p * 100 >= a.y - 8;
        el.style.opacity = shown ? "1" : "0";
        el.style.transform = shown ? "translateY(0)" : "translateY(20px)";
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
  }, [d, calm, anchors]);

  return (
    <section className="relative bg-white px-5 py-20 sm:px-10 sm:py-28">
      <div
        ref={sectionRef}
        className="relative mx-auto h-[210vh] w-full max-w-5xl"
      >
        {/* Người đánh cầu, góc trái trên.
            Không đóng khung, không nền: ảnh là hình bóng đen trên nền trắng
            nên để nó đứng thẳng trên trang là sạch nhất. Quan trọng hơn,
            khung đục sẽ che mất đoạn đầu của đường dây — đúng chỗ cú đánh. */}
        <div
          ref={panelRef}
          className="absolute top-0 left-0 z-0 w-[62%] sm:w-[48%]"
        >
          <div className="relative aspect-[1400/980]">
            <Image
              src={LEAD_PHOTO}
              alt="Người chơi bật nhảy đập cầu"
              fill
              sizes="(max-width: 768px) 58vw, 460px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Tiêu đề, bên phải tấm ảnh */}
        <div className="absolute top-[2%] right-0 z-20 w-[38%] sm:top-[4%] sm:w-[44%]">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-700 uppercase">
            LH Sport Hub
          </p>
          <h2 className="font-display mt-3 text-[22px] leading-[1.1] font-bold text-navy-900 sm:text-[38px]">
            🏸 Nơi chia sẻ và kết nối
          </h2>
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink-400">
            Tại LH Sport Hub, nhân viên Light Human có thể:
          </p>
        </div>

        {/* Đường dây — nằm dưới thẻ, nên nó luồn ra sau từng tấm ảnh */}
        {ready && (
          <svg
            viewBox={`0 0 ${box.w} ${box.h}`}
            width={box.w}
            height={box.h}
            className="pointer-events-none absolute inset-0 z-10"
            aria-hidden
          >
            <path
              d={d}
              fill="none"
              stroke="#001a4a"
              strokeOpacity={0.1}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              ref={pathRef}
              d={d}
              fill="none"
              stroke="#c8951a"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Quả cầu — trên cùng, để thấy nó bay qua các tấm ảnh */}
        <div
          ref={shuttleRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-30 opacity-0 will-change-transform"
        >
          <span className="absolute inset-0 -z-10 m-auto block size-12 rounded-full bg-gold-500/25 blur-lg" />
          <ShuttleMark />
        </div>

        {/* Các chặng, căn theo đúng mốc của đường */}
        {STOPS.map((stop, i) => (
          <div
            key={stop.title}
            ref={(el) => {
              stopRefs.current[i] = el;
            }}
            className={[
              "absolute z-20 -translate-y-1/2 opacity-0 transition-all duration-700 ease-out",
              narrow ? "right-0 left-[26%]" : "w-[44%]",
            ].join(" ")}
            style={{
              top: `${anchors[i].y}%`,
              ...(narrow
                ? {}
                : anchors[i].x > 50
                  ? { right: 0 }
                  : { left: 0 }),
            }}
          >
            <div className="overflow-hidden rounded-2xl ring-1 ring-ink-800">
              <div className="relative aspect-[16/10]">
                <Image
                  src={stop.photo}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 74vw, 400px"
                  className="object-cover"
                />
              </div>
            </div>
            <p className="mt-3.5 text-[10px] font-semibold tracking-[0.28em] text-gold-700 uppercase">
              {stop.eyebrow}
            </p>
            <h3 className="font-display mt-1.5 text-[22px] leading-tight font-bold text-navy-900 sm:text-[26px]">
              {stop.title}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Quả cầu lông nhỏ, vẽ tối giản cho cỡ 30px. */
function ShuttleMark() {
  return (
    <svg width="30" height="30" viewBox="-16 -16 32 32" aria-hidden>
      <path
        d="M -3 2 L -9 -11 A 9 3 0 0 0 9 -11 L 3 2 Z"
        fill="#c8951a"
        fillOpacity={0.32}
        stroke="#a87813"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <g stroke="#a87813" strokeWidth={0.9} opacity={0.8}>
        <line x1={-1.5} y1={2} x2={-4.5} y2={-11} />
        <line x1={1.5} y1={2} x2={4.5} y2={-11} />
      </g>
      <circle cx={0} cy={5} r={4.5} fill="#a87813" />
    </svg>
  );
}
