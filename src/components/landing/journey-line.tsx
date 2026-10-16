"use client";

import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import * as React from "react";

import { CONTACT_POINT, VIEW } from "@/components/intro/athlete-rig";
import { CauThu, NHIP } from "@/components/landing/cau-thu";
import { SPRING } from "@/components/landing/motion";
import { cn } from "@/lib/utils";
import { useCalm } from "@/components/landing/use-calm";

/**
 * "Nơi chia sẻ và kết nối": một trận cầu qua lưới, mỗi cú đánh rơi xuống một
 * tấm ảnh.
 *
 * BỐ CỤC. Khối ghim cao một màn hình. Trên cùng là tiêu đề và câu dẫn; bên
 * dưới là sân: hai người chơi ở hai mép (trái thường, phải lật gương), bốn
 * tấm ảnh nằm giữa, hai tấm bên phải (cú 1, 3) và hai tấm bên trái (cú 2, 4).
 * Người trái đánh sang phải, người phải đánh trả sang trái, và cứ thế luân
 * phiên. Mỗi cú rơi vào một tấm ảnh, ảnh hiện ra.
 *
 * TIẾN TRÌNH DO CUỘN ĐIỀU KHIỂN, và hoàn toàn là motion value:
 * `useScroll` cho tiến độ 0-1 của khối, `useSpring` làm mượt, rồi mọi thứ
 * (góc tay, nghiêng người, toạ độ cầu, vòng sáng, ảnh) là `useTransform` của
 * tiến độ đó. Không có state theo khung hình, không scroll listener. Vì chỉ
 * là hàm thuần của tiến độ nên cuộn ngược thì cú đánh chạy ngược mượt như nhau.
 *
 * MỘT CÚ ĐÁNH (u là tiến độ nội bộ 0-1 của cú, mỗi cú chiếm DUR của khối):
 *   0.00-0.26  lấy đà: tay đưa ra sau, thân ngả lùi, hạ thấp một chút
 *   0.26-0.34  giữ thế gồng
 *   0.34-0.43  vung vợt quanh trục vai, thân bật lên
 *   0.42       chạm cầu: vòng sáng nhỏ ở mặt vợt, quả cầu xuất hiện
 *   0.42-0.82  bay theo đường cong, nhanh rồi chậm dần, xoay theo tiếp tuyến,
 *              vệt đuôi mờ dần phía sau
 *   0.82-0.93  đáp xuống ảnh: vòng sáng, cầu nhỏ dần, ảnh hiện ra
 *   0.43-1.00  thu vợt (follow-through) về thế nghỉ
 *
 * HÌNH NGƯỜI. Cùng bộ xương SVG với màn mở đầu và đố vui (CauThu), lái
 * theo tiến độ cuộn qua `mocNguoi`: mỗi cú đủ pha vung, khuỵu, bật nhảy,
 * chạm cầu, tiếp đất. Người bên phải lật gương.
 *
 * GIẢM CHUYỂN ĐỘNG: không ghim, hiện tĩnh đủ bóng người, bốn ảnh có chữ, và
 * bốn đường bay vẽ mờ.
 */

/**
 * Bộ màu / hình khối của trận cầu. Mặc định là bản nền trắng của /gioi-thieu;
 * /gioi-thieu-v2 truyền bản nền đen (bóng người đảo sang sáng bằng `invert`
 * + `lighten`, hoà trộn lấy màu SÁNG hơn nên nền đen biến mất).
 */
export type JourneySkin = {
  section: string;
  title: string;
  lead: string;
  frame: string;
  caption: string;
  /** Lớp hoà trộn của hai lớp bóng người. */
  layer: string;
  mark: { fill: string; stroke: string };
  dot: string;
  ring: string;
  guide: string;
};

export const JOURNEY_LIGHT: JourneySkin = {
  section: "bg-white",
  title: "text-navy-900",
  lead: "text-ink-400",
  frame: "rounded-xl bg-ink-850 ring-1 ring-ink-800",
  caption: "text-navy-900",
  layer: "mix-blend-darken",
  mark: { fill: "#c8951a", stroke: "#a87813" },
  dot: "bg-gold-500",
  ring: "border-gold-500",
  guide: "#c8951a",
};

const SkinCtx = React.createContext<JourneySkin>(JOURNEY_LIGHT);

const STOPS = [
  {
    title: "Chia sẻ niềm đam mê thể thao",
    photo: "/images/feed-1.jpg",
  },
  {
    title: "Thư giãn sau những ngày làm việc căng thẳng",
    photo: "/images/feed-2.jpg",
  },
  {
    title: "Tạo thêm năng lượng tích cực cho tuần mới",
    photo: "/images/nang-luong-tich-cuc.webp",
  },
  {
    title: "Kết nối và gắn bó hơn",
    photo: "/images/feed-3.jpg",
  },
];

const LEGS = 4;
const START = 0.05;
const DUR = 0.235;

/* ------------------------------------------------------------------ */
/* Hàm thuần của tiến độ                                               */
/* ------------------------------------------------------------------ */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Cú đánh số i, và tiến độ nội bộ u của nó tại tiến độ khối v. */
function leg(v: number) {
  const i = clamp(Math.floor((v - START) / DUR), 0, LEGS - 1);
  return { i, u: (v - START - i * DUR) / DUR };
}

/* ------------------------------------------------------------------ */
/* Hình học đo từ DOM                                                  */
/* ------------------------------------------------------------------ */

type Geom = {
  w: number;
  h: number;
  legs: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    d: string;
    /** Điểm cách đều theo độ dài đường, xem `bangDiem`. */
    lut: Float32Array;
  }[];
};

/** Số điểm lấy mẫu trên mỗi đường bay. */
const N_LUT = 120;

/** Đường cong từ mặt vợt tới tâm ảnh: vòng cung lên cao rồi hạ xuống. */
function diemDieuKhien(x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0;
  const dist = Math.hypot(dx, y1 - y0);
  const rise = clamp(dist * 0.45, 90, 300);
  return [
    x0,
    y0,
    x0 + dx * 0.18,
    y0 - rise * 1.1,
    x1 - dx * 0.08,
    y1 - rise * 0.85,
    x1,
    y1,
  ] as const;
}

type DieuKhien = ReturnType<typeof diemDieuKhien>;

function veDuong(c: DieuKhien) {
  const f = c.map((n) => n.toFixed(1));
  return `M ${f[0]} ${f[1]} C ${f[2]} ${f[3]} ${f[4]} ${f[5]} ${f[6]} ${f[7]}`;
}

/**
 * Bảng điểm của đường bay, cách đều theo ĐỘ DÀI (không theo tham số t).
 *
 * ĐÂY LÀ CHỖ TỪNG LÀM GIẬT. Bản trước hỏi DOM `getPointAtLength` ba lần
 * cho mỗi điểm, mười điểm (cầu + chín chấm đuôi) trên mỗi khung hình cuộn:
 * ba mươi lần hỏi hình học SVG trong một khung 16ms. Giờ tính sẵn bằng công
 * thức Bézier một lần khi đổi cỡ, lúc cuộn chỉ còn tra mảng và nội suy.
 */
function bangDiem(c: DieuKhien) {
  const [x0, y0, c1x, c1y, c2x, c2y, x1, y1] = c;
  const MAU = 240;
  const xs = new Float32Array(MAU + 1);
  const ys = new Float32Array(MAU + 1);
  const dai = new Float32Array(MAU + 1);
  for (let k = 0; k <= MAU; k++) {
    const t = k / MAU;
    const m = 1 - t;
    const a = m * m * m;
    const b = 3 * m * m * t;
    const d = 3 * m * t * t;
    const e = t * t * t;
    xs[k] = a * x0 + b * c1x + d * c2x + e * x1;
    ys[k] = a * y0 + b * c1y + d * c2y + e * y1;
    if (k > 0) {
      dai[k] = dai[k - 1] + Math.hypot(xs[k] - xs[k - 1], ys[k] - ys[k - 1]);
    }
  }
  const tong = dai[MAU] || 1;
  const lut = new Float32Array(N_LUT * 2);
  let k = 0;
  for (let j = 0; j < N_LUT; j++) {
    const muc = (j / (N_LUT - 1)) * tong;
    while (k < MAU - 1 && dai[k + 1] < muc) k++;
    const doan = dai[k + 1] - dai[k] || 1;
    const r = clamp((muc - dai[k]) / doan);
    lut[j * 2] = xs[k] + (xs[k + 1] - xs[k]) * r;
    lut[j * 2 + 1] = ys[k] + (ys[k + 1] - ys[k]) * r;
  }
  return lut;
}

/** Điểm tại phần độ dài `e` (0-1) của đường, nội suy giữa hai mẫu. */
function diemTai(lut: Float32Array, e: number) {
  const f = clamp(e) * (N_LUT - 1);
  const i = Math.min(N_LUT - 2, Math.floor(f));
  const r = f - i;
  return {
    x: lut[i * 2] + (lut[i * 2 + 2] - lut[i * 2]) * r,
    y: lut[i * 2 + 1] + (lut[i * 2 + 3] - lut[i * 2 + 1]) * r,
  };
}

/* ------------------------------------------------------------------ */
/* Người chơi                                                          */
/* ------------------------------------------------------------------ */

/**
 * Mốc trên dòng thời gian bộ xương (athlete-rig) của người chơi `side` tại
 * tiến độ v.
 *
 * Tới lượt mình đánh: nửa đầu cú (u 0 → 0,42) chạy từ thế sẵn sàng qua
 * vung ra sau, khuỵu gối, bật nhảy tới đúng khung CHẠM CẦU — trùng lúc quả
 * cầu rời vợt ở đây; nửa sau chạy bẻ cổ tay, tiếp đất, về thế sẵn sàng.
 * Không tới lượt: nhún thở nhẹ theo độ cuộn (đoạn 0 → 480 lặp liền mạch).
 */
const CHAM_U = 0.42;
function mocNguoi(v: number, side: 0 | 1) {
  const { i, u } = leg(v);
  if (i % 2 === side && u >= 0 && u <= 1) {
    return u < CHAM_U
      ? NHIP.daTu + (u / CHAM_U) * (NHIP.cham - NHIP.daTu)
      : NHIP.cham + ((u - CHAM_U) / (1 - CHAM_U)) * (NHIP.het - NHIP.cham);
  }
  return (v * 6000) % NHIP.thoDen;
}

/**
 * Người chơi: CÙNG bộ xương với màn mở đầu và đố vui, lái theo độ cuộn.
 *
 * Bản trước là MỘT tấm ảnh bóng người tĩnh, chỉ dịch lên xuống và nghiêng
 * cả khối — tay, chân, vợt không nhúc nhích nên nhìn cứng đơ. Giờ mỗi cú
 * có đủ pha như màn mở đầu, kèm lò xo của vợt, tóc, vạt áo; vẫn là hàm
 * thuần của tiến độ nên cuộn ngược chạy ngược mượt như nhau.
 */
function NguoiChoi({
  P,
  side,
  boxRef,
}: {
  P: MotionValue<number>;
  side: 0 | 1;
  boxRef: React.Ref<HTMLDivElement>;
}) {
  const nhip = useTransform(P, (v) => mocNguoi(v, side));

  return (
    <div
      ref={boxRef}
      aria-hidden={side === 1 ? true : undefined}
      role={side === 0 ? "img" : undefined}
      aria-label={side === 0 ? "Người chơi bật nhảy đập cầu" : undefined}
      className="relative aspect-[500/720] h-full max-h-[232px] md:max-h-[360px]"
    >
      {/* Người bên phải lật gương để đánh sang trái */}
      <div
        className="relative size-full"
        style={{ transform: side === 1 ? "scaleX(-1)" : undefined }}
      >
        <CauThu
          nhip={nhip}
          k={side === 0 ? "jt" : "jp"}
          className="size-full overflow-visible"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quả cầu, vệt đuôi, vòng sáng                                        */
/* ------------------------------------------------------------------ */

function QuaCauMark({ size = 32 }: { size?: number }) {
  const { mark } = React.useContext(SkinCtx);
  return (
    <svg width={size} height={size} viewBox="-16 -16 32 32" aria-hidden>
      <path
        d="M -3 2 L -9 -11 A 9 3 0 0 0 9 -11 L 3 2 Z"
        fill={mark.fill}
        fillOpacity={0.32}
        stroke={mark.stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <g stroke={mark.stroke} strokeWidth={0.9} opacity={0.8}>
        <line x1={-1.5} y1={2} x2={-4.5} y2={-11} />
        <line x1={1.5} y1={2} x2={4.5} y2={-11} />
      </g>
      <circle cx={0} cy={5} r={4.5} fill={mark.stroke} />
    </svg>
  );
}

type Mau = { x: number; y: number; rot: number; o: number; s: number };
const AN: Mau = { x: 0, y: 0, rot: 0, o: 0, s: 1 };

/**
 * Lấy mẫu vị trí cầu tại tiến độ v, lùi `lui` phần đường (cho vệt đuôi).
 * Giữ bộ nhớ đệm: cùng một v thì trả lại kết quả cũ, vì năm motion value
 * của cùng một quả cầu đều hỏi cùng một v trong một khung hình.
 */
function makeSampler(geom: React.RefObject<Geom | null>, lui: number) {
  let lastV = NaN;
  let last = AN;
  return (v: number): Mau => {
    if (v === lastV) return last;
    lastV = v;
    last = AN;
    if (v < START || v >= START + LEGS * DUR) return last;
    const { i, u } = leg(v);
    if (u < 0.42 || u > 0.95) return last;
    const L = geom.current?.legs[i];
    if (!L) return last;
    const f = clamp((u - 0.42) / 0.4);
    const fb = Math.max(0, f - lui);
    const e = 1 - Math.pow(1 - fb, 2.4);
    const p = diemTai(L.lut, e);
    const pa = diemTai(L.lut, e - 0.012);
    const pb = diemTai(L.lut, e + 0.012);
    const rot = (Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI - 90;
    const roi = u > 0.82 ? 1 - clamp((u - 0.82) / 0.13) : 1;
    const ra = u < 0.45 ? 0.6 + (0.4 * (u - 0.42)) / 0.03 : 1;
    const duoi = lui === 0 ? 1 : clamp((f - lui) / 0.04);
    last = {
      x: p.x,
      y: p.y,
      rot,
      o: roi * duoi,
      s: ra * (0.55 + 0.45 * roi),
    };
    return last;
  };
}

function useMauCau(geom: React.RefObject<Geom | null>, lui: number) {
  return React.useMemo(() => makeSampler(geom, lui), [geom, lui]);
}

function CauBay({
  P,
  geom,
}: {
  P: MotionValue<number>;
  geom: React.RefObject<Geom | null>;
}) {
  const mau = useMauCau(geom, 0);
  const x = useTransform(P, (v) => mau(v).x);
  const y = useTransform(P, (v) => mau(v).y);
  const rotate = useTransform(P, (v) => mau(v).rot);
  const scale = useTransform(P, (v) => mau(v).s);
  const opacity = useTransform(P, (v) => mau(v).o);
  return (
    <motion.div
      aria-hidden
      className="absolute top-0 left-0 z-30 will-change-transform"
      style={{ x, y, rotate, scale, opacity, translateX: "-50%", translateY: "-50%" }}
    >
      <QuaCauMark size={34} />
    </motion.div>
  );
}

/** Số chấm đuôi. Năm là đủ thấy vệt bay; mỗi chấm thêm là thêm việc mỗi khung. */
const DUOI = 5;

function ChamDuoi({
  P,
  k,
  geom,
}: {
  P: MotionValue<number>;
  k: number;
  geom: React.RefObject<Geom | null>;
}) {
  const skin = React.useContext(SkinCtx);
  const mau = useMauCau(geom, k * 0.06);
  const x = useTransform(P, (v) => mau(v).x);
  const y = useTransform(P, (v) => mau(v).y);
  const opacity = useTransform(P, (v) => mau(v).o * (1 - k / DUOI) * 0.5);
  const scale = 1 - k * 0.12;
  return (
    <motion.span
      aria-hidden
      className={cn("absolute top-0 left-0 z-20 size-2.5 rounded-full", skin.dot)}
      style={{ x, y, opacity, scale, translateX: "-50%", translateY: "-50%" }}
    />
  );
}

/** Vòng sáng nhỏ: ở mặt vợt lúc chạm (`cham`), hoặc ở ảnh lúc đáp. */
function VongSang({
  P,
  geom,
  kieu,
}: {
  P: MotionValue<number>;
  geom: React.RefObject<Geom | null>;
  kieu: "cham" | "dap";
}) {
  const skin = React.useContext(SkinCtx);
  const tt = React.useCallback(
    (v: number) => {
      const g = geom.current;
      if (!g || v < START || v >= START + LEGS * DUR)
        return { x: 0, y: 0, s: 0.3, o: 0 };
      const { i, u } = leg(v);
      const L = g.legs[i];
      const [a, b] = kieu === "cham" ? [0.42, 0.56] : [0.8, 0.95];
      const t = clamp((u - a) / (b - a));
      const live = u >= a && u <= b;
      return {
        x: kieu === "cham" ? L.x0 : L.x1,
        y: kieu === "cham" ? L.y0 : L.y1,
        s: 0.3 + 1.5 * (1 - Math.pow(1 - t, 3)),
        o: live ? 0.85 * (1 - t) : 0,
      };
    },
    [geom, kieu],
  );
  const x = useTransform(P, (v) => tt(v).x);
  const y = useTransform(P, (v) => tt(v).y);
  const scale = useTransform(P, (v) => tt(v).s);
  const opacity = useTransform(P, (v) => tt(v).o);
  return (
    <motion.span
      aria-hidden
      className={cn("absolute top-0 left-0 z-20 size-10 rounded-full border-2", skin.ring)}
      style={{ x, y, scale, opacity, translateX: "-50%", translateY: "-50%" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Ảnh                                                                 */
/* ------------------------------------------------------------------ */

function Anh({
  P,
  i,
  area,
  boxRef,
}: {
  P: MotionValue<number>;
  i: number;
  area: string;
  boxRef: React.Ref<HTMLDivElement>;
}) {
  const skin = React.useContext(SkinCtx);
  const hien = useTransform(P, (v) => {
    const u = (v - START - i * DUR) / DUR;
    return clamp((u - 0.8) / 0.14);
  });
  const opacity = hien;
  const scale = useTransform(hien, (h) => 0.94 + 0.06 * h);
  const y = useTransform(hien, (h) => (1 - h) * 14);
  const stop = STOPS[i];

  return (
    <div className="min-w-0" style={{ gridArea: area }}>
      {/*
        CHIỀU CAO ẢNH CHẶN THEO CHIỀU CAO MÀN HÌNH. Khung ghim cao đúng một
        màn; ảnh chỉ theo bề ngang thì ở màn rộng mà thấp (hay khi người
        dùng Ctrl+phóng to) hai hàng ảnh cao hơn chỗ trống, lưới căn giữa
        nên phần thừa tràn NGƯỢC LÊN đè tiêu đề. 360px ≈ đệm trên + tiêu đề
        + hai dòng chú thích + khoảng giữa hai hàng.
      */}
      <div
        ref={boxRef}
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden md:aspect-[16/10] md:max-h-[max(96px,calc((100svh-360px)/2))]",
          skin.frame,
        )}
      >
        <motion.div className="absolute inset-0" style={{ opacity, scale }}>
          <Image
            src={stop.photo}
            alt=""
            fill
            sizes="(max-width: 768px) 46vw, 300px"
            className="object-cover"
          />
        </motion.div>
      </div>
      <motion.h3
        className={cn("font-display mt-2 text-[13.5px] leading-snug font-bold sm:text-[17px] md:mt-3", skin.caption)}
        style={{ opacity, y }}
      >
        {stop.title}
      </motion.h3>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function JourneyLine({
  skin = JOURNEY_LIGHT,
}: {
  skin?: JourneySkin;
}) {
  const reduce = useCalm();
  const sectionRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const playerRefs = React.useRef<(HTMLDivElement | null)[]>([null, null]);
  const photoRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const geomRef = React.useRef<Geom | null>(null);
  const [geom, setGeom] = React.useState<Geom | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const lamMuot = useSpring(scrollYProgress, SPRING.scroll);
  const tinh = useMotionValue(1);
  const P = reduce ? tinh : lamMuot;

  // Đo vị trí mặt vợt và tâm từng ảnh. Chỉ chạy khi đổi cỡ, không theo cuộn.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const sr = stage.getBoundingClientRect();
      if (sr.width === 0) return;
      const legs: Geom["legs"] = [];
      for (let i = 0; i < LEGS; i++) {
        const pl = playerRefs.current[i % 2];
        const ph = photoRefs.current[i];
        if (!pl || !ph) return;
        const pr = pl.getBoundingClientRect();
        const cw = pr.width;
        const ch = pr.height;
        // Cầu rời vợt đúng ĐIỂM CHẠM của bộ xương (khung 500×720, cùng tỉ
        // lệ với hộp người chơi). Người bên phải lật gương.
        let hx = (CONTACT_POINT.x / VIEW.w) * cw;
        const hy = (CONTACT_POINT.y / VIEW.h) * ch;
        if (i % 2 === 1) hx = cw - hx;
        const x0 = pr.left - sr.left + hx;
        const y0 = pr.top - sr.top + hy;
        const pb = ph.getBoundingClientRect();
        const x1 = pb.left - sr.left + pb.width / 2;
        const y1 = pb.top - sr.top + pb.height / 2;
        const c = diemDieuKhien(x0, y0, x1, y1);
        legs.push({ x0, y0, x1, y1, d: veDuong(c), lut: bangDiem(c) });
      }
      geomRef.current = { w: sr.width, h: sr.height, legs };
      setGeom(geomRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const luoi = cn(
    "grid min-h-0 flex-1 grid-cols-2 gap-x-3 gap-y-2 [grid-template-areas:'p2_p1'_'p4_p3'_'tl_tr'] grid-rows-[auto_auto_minmax(0,1fr)]",
    "md:grid-cols-[0.9fr_1.1fr_1.1fr_0.9fr] md:grid-rows-[auto_auto] md:content-center md:gap-x-6 md:gap-y-8 md:[grid-template-areas:'tl_p2_p1_tr'_'tl_p4_p3_tr']",
  );

  return (
    <SkinCtx.Provider value={skin}>
    <section
      ref={sectionRef}
      // svh chứ không dvh: trên điện thoại, thanh địa chỉ ẩn/hiện làm dvh đổi
      // liên tục, chiều dài đường cuộn và khung ghim nhảy theo. svh đứng yên.
      className={cn("relative", skin.section)}
      style={reduce ? undefined : { height: "420svh" }}
    >
      <div
        ref={stageRef}
        className={cn(
          "relative flex flex-col overflow-hidden px-5 pt-[84px] pb-4 sm:px-10",
          reduce ? "py-24" : "sticky top-0 h-svh",
        )}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
          <div className="shrink-0">
            <h2 className={cn("font-display text-[26px] leading-[1.12] font-bold sm:text-[38px]", skin.title)}>
              Nơi chia sẻ và kết nối
            </h2>
            <p className={cn("mt-2 text-[14.5px] leading-relaxed sm:mt-3 sm:text-[16px]", skin.lead)}>
              Tại LH Sport Hub, nhân viên Light Human có thể:
            </p>
          </div>

          <div className={cn(luoi, "mt-4 md:mt-6", reduce && "gap-y-6")}>
            {STOPS.map((s, i) => (
              <Anh
                key={s.title}
                P={P}
                i={i}
                area={`p${["1", "2", "3", "4"][i]}`}
                boxRef={(el) => {
                  photoRefs.current[i] = el;
                }}
              />
            ))}
            <div
              className={cn(
                "flex min-h-0 items-end justify-center",
                reduce && "h-[220px] md:h-[360px]",
              )}
              style={{ gridArea: "tl" }}
            >
              <NguoiChoi
                P={P}
                side={0}
                boxRef={(el) => {
                  playerRefs.current[0] = el;
                }}
              />
            </div>
            <div
              className={cn(
                "flex min-h-0 items-end justify-center",
                reduce && "h-[220px] md:h-[360px]",
              )}
              style={{ gridArea: "tr" }}
            >
              <NguoiChoi
                P={P}
                side={1}
                boxRef={(el) => {
                  playerRefs.current[1] = el;
                }}
              />
            </div>
          </div>
        </div>

        {/* Lớp bay: đường (ẩn khi chạy, mờ khi tĩnh), vệt đuôi, cầu, vòng sáng */}
        {geom && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <svg
              width={geom.w}
              height={geom.h}
              viewBox={`0 0 ${geom.w} ${geom.h}`}
              className="absolute inset-0"
            >
              {geom.legs.map((l, i) => (
                <path
                  key={i}
                  d={l.d}
                  fill="none"
                  stroke={skin.guide}
                  strokeWidth={2}
                  strokeDasharray="2 9"
                  strokeLinecap="round"
                  strokeOpacity={reduce ? 0.4 : 0}
                />
              ))}
            </svg>
            {!reduce && (
              <>
                {Array.from({ length: DUOI }, (_, k) => (
                  <ChamDuoi key={k} P={P} k={k} geom={geomRef} />
                ))}
                <VongSang P={P} geom={geomRef} kieu="cham" />
                <VongSang P={P} geom={geomRef} kieu="dap" />
                <CauBay P={P} geom={geomRef} />
              </>
            )}
          </div>
        )}
      </div>
    </section>
    </SkinCtx.Provider>
  );
}
