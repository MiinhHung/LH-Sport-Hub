"use client";

import type { MotionValue } from "motion/react";
import * as React from "react";

import {
  BONE,
  CONTACT_AT,
  CONTACT_POINT,
  DURATION,
  KEYS,
  ROOT_X,
  TRACKS,
  VIEW,
  poseAt,
  rootYAt,
  type Pt,
} from "@/components/intro/athlete-rig";
import { AthleteSvg } from "@/components/intro/intro-athlete";

/**
 * Người đánh cầu của đố vui: CÙNG bộ xương, cùng tư thế và cùng lò xo với
 * màn mở đầu, nhưng không chạy một mạch theo CSS. Ở đây có một mốc thời
 * gian `nhip` (ms trên dòng thời gian của athlete-rig) do đố vui điều
 * khiển — đứng thở, kéo lấy đà, thả ra là bật nhảy đập — và mỗi lần mốc
 * đổi thì đặt lại góc từng khớp.
 *
 * Đặt thẳng `style` lên từng khớp chứ không qua React: đổi 60 lần một giây
 * mà đi qua render thì cả cây SVG dựng lại liên tục.
 */

/** Tiền tố class riêng, để CSS của màn mở đầu (`rg-*`) không đụng tới. */
const K = "qa";

/** Các mốc trên dòng thời gian, lấy thẳng từ athlete-rig. */
const MOC = (name: string) => KEYS.find((x) => x.name === name)?.at ?? 0;
export const NHIP = {
  /** Đứng thở: 0 → 480 là sẵn sàng → nhún → sẵn sàng, lặp liền mạch. */
  thoTu: 0,
  thoDen: MOC("Sẵn sàng: nhún thở") * 2,
  /** Kéo lấy đà: từ thế sẵn sàng qua vung ra sau tới nén sâu nhất. */
  daTu: MOC("Sẵn sàng: nhún thở") * 2,
  daDen: MOC("Nén lấy đà"),
  /** Mặt vợt chạm cầu. */
  cham: CONTACT_AT,
  /** Hết cú đánh, về đúng thế sẵn sàng (bằng khung 0). */
  het: DURATION,
} as const;

/** Tỉ lệ khung nhân vật (rộng / cao). */
export const TI_LE = VIEW.w / VIEW.h;

/** Xoay một điểm theo chiều kim đồng hồ, như `rotate()` của SVG. */
const xoay = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
};

/**
 * Lòng bàn tay trái (tay không cầm vợt) tại mốc `ms`, toạ độ khung 500×720.
 * Cùng chuỗi biến đổi với cây <g> trong SVG: hông → thân → vai → khuỷu.
 */
function tayTrai(ms: number): Pt {
  const p = poseAt(ms);
  let v: Pt = { x: 0, y: BONE.forearm + 8 };
  v = xoay(v, p.elL);
  v = { x: v.x, y: v.y + BONE.upperArm };
  v = xoay(v, p.shL);
  v = { x: v.x + BONE.shoulder.x, y: v.y + BONE.shoulder.y };
  v = xoay(v, p.torso);
  v = xoay(v, p.pelvis);
  return { x: v.x + ROOT_X, y: v.y + rootYAt(ms) };
}

/**
 * Chỗ quả cầu đang cầm, theo % khung nhân vật.
 *
 * Đứng chờ: nằm trong tay trái (tay này vốn giơ lên chỉ cầu). Từ lúc lấy
 * đà tới khung chạm: được tung lên, chậm dần như bị trọng lực hãm, và
 * tới ĐÚNG điểm chạm của mặt vợt đúng khung chạm. Sau đó đường bay của đố
 * vui lo tiếp.
 */
export function cauTrenTay(ms: number): Pt {
  const tay = tayTrai(Math.min(ms, NHIP.daTu));
  let p = ms <= NHIP.daTu ? tayTrai(ms) : tay;
  if (ms > NHIP.daTu) {
    const u = Math.min(1, (ms - NHIP.daTu) / (NHIP.cham - NHIP.daTu));
    const len = 1 - (1 - u) * (1 - u);
    p = {
      x: tay.x + (CONTACT_POINT.x - tay.x) * u,
      y: tay.y + (CONTACT_POINT.y - tay.y) * len,
    };
  }
  return { x: (p.x / VIEW.w) * 100, y: (p.y / VIEW.h) * 100 };
}

/** Các track được lái: bỏ hai quả cầu riêng của màn mở đầu. */
const LAI = TRACKS.filter((t) => t.name !== "shin" && t.name !== "shout");

/** Gốc toạ độ khớp + dáng đứng yên trước khi JavaScript chạy (SSR). */
const CSS_TINH = [
  `.${K}{transform-box:view-box;transform-origin:0 0}`,
  ...LAI.map((t) => {
    const v = t.name === "root" ? [ROOT_X, rootYAt(0), 1] : t.at(0);
    return `.${K}-${t.name}{${t.css(v)}}`;
  }),
].join("\n");

/** "a:1;b:2 3" → [["a","1"],["b","2 3"]] */
const tachCss = (s: string) =>
  s.split(";").map((p) => {
    const i = p.indexOf(":");
    return [p.slice(0, i), p.slice(i + 1)] as const;
  });

export function CauThu({
  nhip,
  className,
}: {
  nhip: MotionValue<number>;
  className?: string;
}) {
  const ref = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const khop = LAI.map(
      (t) =>
        [t, Array.from(svg.querySelectorAll<SVGElement>(`.${K}-${t.name}`))] as const,
    );
    const ve = (ms: number) => {
      for (const [t, els] of khop) {
        const v = t.at(ms);
        // Gốc luôn hiện rõ: độ mờ lúc mở màn chỉ dành cho màn mở đầu.
        if (t.name === "root") v[2] = 1;
        const css = tachCss(t.css(v));
        for (const el of els) {
          for (const [p, val] of css) el.style.setProperty(p, val);
        }
      }
    };
    ve(nhip.get());
    return nhip.on("change", ve);
  }, [nhip]);

  return (
    <>
      <style suppressHydrationWarning>{CSS_TINH}</style>
      <AthleteSvgRef svgRef={ref} className={className} />
    </>
  );
}

/** AthleteSvg không nhận ref, nên bọc một lớp để lấy <svg> ra. */
function AthleteSvgRef({
  svgRef,
  className,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  className?: string;
}) {
  const boc = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    svgRef.current = boc.current?.querySelector("svg") ?? null;
  }, [svgRef]);
  return (
    <span ref={boc} className="contents">
      <AthleteSvg k={K} className={className} />
    </span>
  );
}
