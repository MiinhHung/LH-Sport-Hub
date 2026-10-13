"use client";

import Image from "next/image";
import * as React from "react";

import { IntroAthlete } from "@/components/intro/intro-athlete";
import { IntroDebug } from "@/components/intro/intro-debug";
import { IntroScene } from "@/components/intro/intro-scene";
import { INTRO_TIMING } from "@/lib/intro";

/**
 * Màn loading của trang chủ, liền một cú với hero:
 *
 *   người chơi chuẩn bị, tung cầu, bật nhảy đập  →  quả cầu bay vòng cung
 *   →  trong lúc bay, nền sân mờ dần, trang chủ hiện ra bên dưới  →  quả
 *   cầu đáp ĐÚNG vào quả cầu vàng của hero (cùng chỗ, cùng cỡ, cùng góc)
 *   rồi nhường chỗ cho nó.
 *
 * Không có tấm màn kéo lên: chuyển cảnh là chính đường bay của quả cầu.
 *
 * AI LÀM GÌ:
 *  - CSS (globals.css): cả cảnh sân, người chơi, bộ đếm, nền mờ dần, chữ
 *    hero. Chạy từ khung hình đầu tiên, trước cả khi React hydrate.
 *  - Ở đây: đường bay vào hero. Đích nằm ở đâu tuỳ cỡ màn hình nên phải đo
 *    lúc chạy; chạy bằng Web Animations (transform + opacity, trên
 *    compositor), canh giờ theo đúng mốc của animation CSS.
 *  - Nếu JavaScript tới muộn quá cú đập, đường bay dự phòng trong SVG chạy
 *    thay (bay sang sân bên kia), quả cầu hero tự hiện ra lúc chạm đích.
 */

/**
 * Tâm quả cầu thấy được, tính theo cạnh hộp ảnh.
 *
 * shuttlecock-gold.png (573x419) không cân: quả cầu nằm lệch phải, tâm ở
 * (410, 210). Ảnh `object-contain` trong hộp vuông cạnh w thì rộng w, cao
 * 0,7313w, căn giữa dọc; hero còn dịch ảnh sang trái 13%. Ra tâm ở
 * (0,7155 - 0,13)w ≈ 0,5855w theo ngang và 0,1344w + 0,3665w ≈ 0,5009w
 * theo dọc. Quả cầu bay xoay quanh đúng điểm này.
 */
const TAM = { x: 0.5855, y: 0.5009 };

type Diem = { x: number; y: number };

function bezier(p: Diem[], t: number): Diem {
  const m = 1 - t;
  const a = m * m * m;
  const b = 3 * m * m * t;
  const c = 3 * m * t * t;
  const d = t * t * t;
  return {
    x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
    y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y,
  };
}

function tiepTuyen(p: Diem[], t: number): Diem {
  const m = 1 - t;
  return {
    x:
      3 * m * m * (p[1].x - p[0].x) +
      6 * m * t * (p[2].x - p[1].x) +
      3 * t * t * (p[3].x - p[2].x),
    y:
      3 * m * m * (p[1].y - p[0].y) +
      6 * m * t * (p[2].y - p[1].y) +
      3 * t * t * (p[3].y - p[2].y),
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const muot = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** Phần tử đang hiện trong hai bố cục (ngang / dọc) của cảnh sân. */
function dangHien<T extends Element>(root: HTMLElement, sel: string) {
  return Array.from(root.querySelectorAll<T>(sel)).find(
    (el) => el.getBoundingClientRect().width > 0,
  );
}

/**
 * Dựng đường bay từ mặt vợt tới quả cầu hero và chạy nó.
 * Thiếu thứ gì thì bỏ, để đường bay dự phòng trong SVG giữ nguyên.
 */
function bayVaoHero(
  root: HTMLElement,
  ball: HTMLElement,
  trail: SVGPathElement,
): Animation[] {
  // Mốc 0 của mọi animation CSS trên màn mở đầu.
  const t0 = dangHien<SVGGElement>(root, ".intro-court")?.getAnimations()[0]
    ?.startTime;
  const now = document.timeline.currentTime;
  if (typeof t0 !== "number" || typeof now !== "number") return [];
  // Cầu đã rời vợt từ trước khi JavaScript tới: để đường bay dự phòng chạy.
  if (now > t0 + INTRO_TIMING.SMASH_AT) return [];

  const vot = root.querySelector<HTMLElement>(".intro-racket");
  const dich = document.querySelector<HTMLElement>("[data-hero-shuttle]");
  if (!vot || !dich) return [];
  const rv = vot.getBoundingClientRect();
  const rd = dich.getBoundingClientRect();
  if (rd.width === 0) return [];

  const w = rd.width;
  const goc = { x: TAM.x * w, y: TAM.y * w };
  // Lúc chạm đích, hero-float đang ở khung 0%: nhích lên 8px, nghiêng -2°.
  const p0 = { x: rv.left + rv.width / 2, y: rv.top + rv.height / 2 };
  const p3 = { x: rd.left + goc.x, y: rd.top + goc.y - 8 };
  const dx = p3.x - p0.x;
  const dinh = Math.min(p0.y, p3.y) - Math.max(140, window.innerHeight * 0.32);
  const pts = [
    p0,
    { x: p0.x + dx * 0.2, y: dinh },
    { x: p3.x - dx * 0.12, y: dinh + 50 },
    p3,
  ];

  // Độ dài cộng dồn theo t, để vệt vàng chạy khớp với quả cầu.
  const MAU = 120;
  const dai: number[] = [0];
  let truoc = pts[0];
  for (let k = 1; k <= MAU; k++) {
    const d = bezier(pts, k / MAU);
    dai.push(dai[k - 1] + Math.hypot(d.x - truoc.x, d.y - truoc.y));
    truoc = d;
  }
  const tong = dai[MAU] || 1;

  // Nhanh lúc rời vợt, chậm dần, đáp nhẹ vào hero.
  const N = 30;
  const khungCau: Keyframe[] = [];
  const khungVet: Keyframe[] = [];
  for (let k = 0; k <= N; k++) {
    const f = k / N;
    const t = 1 - Math.pow(1 - f, 2.6);
    const c = bezier(pts, t);
    const v = tiepTuyen(pts, Math.min(t, 0.999));
    // Đế cầu hướng theo chiều bay, về cuối xoay dần về đúng góc của hero.
    const theoHuong = (Math.atan2(v.y, v.x) * 180) / Math.PI - 90;
    const r = lerp(theoHuong, -2, muot((f - 0.65) / 0.35));
    const s = lerp(0.42, 1, muot(f));
    khungCau.push({
      transform: `translate(${(c.x - goc.x).toFixed(1)}px, ${(c.y - goc.y).toFixed(1)}px) rotate(${r.toFixed(1)}deg) scale(${s.toFixed(3)})`,
      opacity: k === 0 ? 0 : 1,
    });
    khungVet.push({ strokeDashoffset: 1 - dai[Math.round(t * MAU)] / tong });
  }

  ball.style.width = `${w}px`;
  ball.style.height = `${w}px`;
  ball.style.transformOrigin = `${TAM.x * 100}% ${TAM.y * 100}%`;
  trail.setAttribute(
    "d",
    `M ${pts[0].x} ${pts[0].y} C ${pts[1].x} ${pts[1].y} ${pts[2].x} ${pts[2].y} ${pts[3].x} ${pts[3].y}`,
  );

  const anims: Animation[] = [];
  const chay = (
    el: Element,
    khung: Keyframe[],
    luc: number,
    keoDai: number,
    fill: FillMode,
  ) => {
    const a = el.animate(khung, { duration: keoDai, easing: "linear", fill });
    a.startTime = t0 + luc;
    anims.push(a);
  };

  const { SMASH_AT, LAND_AT } = INTRO_TIMING;
  const bay = LAND_AT - SMASH_AT;
  chay(ball, khungCau, SMASH_AT, bay, "both");
  chay(trail, khungVet, SMASH_AT, bay, "both");
  // Vệt hiện suốt đường bay, tan dần sau khi chạm đích.
  const vet = bay + 350;
  chay(
    trail,
    [
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: bay / vet },
      { opacity: 0, offset: 1 },
    ],
    SMASH_AT,
    vet,
    "both",
  );
  // Chạm đích: quả cầu bay mờ đi đúng lúc quả cầu hero hiện lên (cùng ảnh,
  // cùng chỗ, nên mắt chỉ thấy một quả cầu).
  chay(ball, [{ opacity: 1 }, { opacity: 0 }], LAND_AT, 240, "forwards");

  root.setAttribute("data-flight", "js");
  return anims;
}

/** `?debug=1`: giữ màn mở đầu đứng lại và hiện bảng soi pose. */
const khongDoi = () => () => {};
const coDebug = () =>
  new URLSearchParams(window.location.search).get("debug") === "1";

export function IntroOverlay() {
  const debug = React.useSyncExternalStore(khongDoi, coDebug, () => false);
  const [phase, setPhase] = React.useState<"show" | "out" | "gone">("show");
  const timers = React.useRef<number[]>([]);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const ballRef = React.useRef<HTMLDivElement>(null);
  const trailRef = React.useRef<SVGPathElement>(null);

  const skip = React.useCallback(() => {
    // Hero bỏ độ trễ dài, vào cùng lúc màn mở đầu mờ đi.
    document.documentElement.setAttribute("data-intro-skip", "");
    setPhase("out");
    timers.current.push(
      window.setTimeout(() => setPhase("gone"), INTRO_TIMING.SKIP),
    );
  }, []);

  React.useEffect(() => {
    const list = timers.current;
    const html = document.documentElement;

    // Luôn bảo đảm kích hoạt cờ play và gỡ cờ kết thúc cũ
    html.setAttribute("data-intro", "play");
    html.removeAttribute("data-intro-done");
    html.removeAttribute("data-intro-skip");

    // Chế độ soi: không hẹn giờ gỡ, không bay vào hero, không bắt phím.
    if (debug) {
      html.setAttribute("data-intro-debug", "");
      return () => html.removeAttribute("data-intro-debug");
    }

    const root = rootRef.current;
    const ball = ballRef.current;
    const trail = trailRef.current;
    const anims = root && ball && trail ? bayVaoHero(root, ball, trail) : [];

    /*
     * Đích được đo một lần. Cửa sổ đổi cỡ giữa chừng (xoay điện thoại, kéo
     * cửa sổ) thì hero dịch đi và quả cầu sẽ đáp trượt: dừng hẳn đường bay,
     * quả cầu hero vẫn tự hiện ra đúng giờ ở chỗ mới.
     */
    const huyBay = () => anims.forEach((a) => a.cancel());
    window.addEventListener("resize", huyBay, { once: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        bo();
        skip();
      }
    };
    // Gỡ bắt phím ngay khi màn mở đầu xong, kẻo Space/Enter bị chặn cả trang.
    const bo = () => window.removeEventListener("keydown", onKey);
    window.addEventListener("keydown", onKey);

    list.push(
      window.setTimeout(() => {
        bo();
        html.setAttribute("data-intro-done", "");
        setPhase("gone");
      }, INTRO_TIMING.END),
    );

    return () => {
      bo();
      huyBay();
      window.removeEventListener("resize", huyBay);
      list.forEach(clearTimeout);
    };
  }, [skip, debug]);

  if (phase === "gone") return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label="Đang mở LH Sport Hub"
      className="intro pointer-events-none fixed inset-0 z-[100] select-none"
      data-phase={phase}
    >
      {/* Nền sân: mờ dần trong lúc quả cầu bay, để lộ trang chủ bên dưới. */}
      <div className="intro-bg pointer-events-auto absolute inset-0 overflow-hidden bg-navy-950 text-white">
        {/* Nhà thi đấu: hai luồng đèn rọi từ trần, chữ phông rất mờ phía sau. */}
        <div aria-hidden className="intro-arena absolute inset-0">
          <div className="absolute -top-[20%] left-[8%] h-[95%] w-[38%] -rotate-[18deg] bg-[linear-gradient(180deg,rgba(255,236,170,0.16),rgba(255,236,170,0.04)_55%,transparent)] blur-2xl" />
          <div className="absolute -top-[20%] right-[6%] h-[95%] w-[34%] rotate-[16deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03)_55%,transparent)] blur-2xl" />
          <p className="intro-backword font-sport absolute left-1/2 -translate-x-1/2 leading-none font-extrabold tracking-tight whitespace-nowrap text-transparent uppercase">
            Sport Hub
          </p>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,transparent_55%,rgba(0,8,26,0.85))]" />
        </div>

        <div className="intro-shake absolute inset-0">
          <IntroScene />
          <IntroAthlete />
        </div>

        {debug && <IntroDebug root={rootRef} />}

        {/* Bộ đếm 0 -> 100%, chạy bằng CSS (@property --intro-pct). */}
        <div
          aria-hidden
          className="absolute bottom-6 left-5 flex items-baseline gap-2 sm:bottom-8 sm:left-8"
        >
          <span className="intro-pct font-sport text-[40px] leading-none font-extrabold text-gold-400 tabular-nums sm:text-[52px]" />
          <span className="text-[13px] font-semibold text-white/60">
            Đang vào sân
          </span>
        </div>

        <button
          type="button"
          onClick={skip}
          className="intro-skip absolute right-5 bottom-6 rounded-full border border-white/20 px-4 py-2 text-[13px] font-semibold text-white/80 transition-colors hover:border-gold-300 hover:text-white sm:right-8 sm:bottom-8"
        >
          Bỏ qua
        </button>
      </div>

      {/* Lớp bay: nằm trên nền nên không mờ theo, bay thẳng vào hero. */}
      <div aria-hidden className="absolute inset-0">
        <svg className="absolute inset-0 size-full overflow-visible">
          <path
            ref={trailRef}
            fill="none"
            stroke="#e8c56a"
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset="1"
            opacity={0}
          />
        </svg>
        <div
          ref={ballRef}
          className="absolute top-0 left-0 opacity-0 will-change-transform"
        >
          <Image
            src="/images/landing/shuttlecock-gold.png"
            alt=""
            fill
            sizes="(max-width: 1024px) 90vw, 640px"
            className="-translate-x-[13%] object-contain drop-shadow-[0_28px_48px_rgba(0,0,0,0.6)]"
          />
        </div>
      </div>
    </div>
  );
}
