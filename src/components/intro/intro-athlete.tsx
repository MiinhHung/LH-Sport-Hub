/**
 * Nhân vật màn mở đầu: một bộ xương SVG phân cấp (rig).
 *
 * Mỗi khớp là hai lớp <g>: lớp ngoài dời gốc toạ độ TỚI khớp (tĩnh), lớp
 * trong xoay quanh chính gốc đó (CSS animation, class `rg-<tên>`). Hình
 * của bộ phận vẽ lệch khỏi gốc, nên chỉ cần rotate() là xoay đúng quanh
 * khớp, và con luôn đi theo cha: vợt dính bàn tay, bàn tay dính cẳng tay…
 *
 *   root (dịch theo trục Y, chân bám sàn)
 *   └ pelvis
 *     ├ hipL → kneeL → ankL           chân xa
 *     ├ hipR → kneeR → ankR           chân gần
 *     └ torso
 *       ├ shL → elL → bàn tay         tay xa: chỉ cầu, giữ thăng bằng
 *       ├ hem                         vạt áo (trễ nhịp)
 *       ├ head → hair                 đầu, tóc đuôi ngựa (trễ nhịp)
 *       └ shR → elR → wrR → racket    tay vợt; vợt trễ nhịp nhẹ theo cổ tay
 *
 * Góc, nhịp, độ dài xương: xem athlete-rig.ts. Ở đây chỉ có hình vẽ.
 * Debug: thêm ?debug=1 vào địa chỉ trang chủ.
 */

import * as React from "react";

import {
  BONE,
  CONTACT_PCT,
  CONTACT_POINT,
  GROUND_Y,
  RACKET_HEAD_Y,
  RIG_CSS,
  ROOT_X,
  SWOOSH_D,
} from "@/components/intro/athlete-rig";

const GOLD = "url(#athlete-gold-accent)";
const METAL = "url(#athlete-gold-metal)";
/*
 * Màu đặc cho NÉT THẲNG. Gradient theo objectBoundingBox không vẽ được
 * trên đường thẳng đứng hay nằm ngang (hộp bao rộng 0), nên thân vợt,
 * viền tay áo, sọc giày vẽ bằng gradient sẽ biến mất.
 */
const GOLD_LINE = "#f5c042";
const METAL_LINE = "#f2cf74";

/* ---------- Hình từng bộ phận (toạ độ cục bộ, gốc tại khớp) ---------- */

/** Đùi: từ hông xuống gối. */
const THIGH = `M -12 -6 C -13 30 -10 62 -8 ${BONE.thigh} L 8 ${BONE.thigh} C 10 62 13 30 12 -6 Z`;
const SHORTS = "M -15 -12 L 15 -12 L 13.5 40 L -12.5 44 Z";
/** Cẳng chân: từ gối xuống mắt cá. */
const SHIN = `M -8.5 0 C -9 30 -7 60 -5.5 ${BONE.shin} L 5.5 ${BONE.shin} C 7 60 9 30 8.5 0 Z`;
const SOCK = `M -6.4 ${BONE.shin - 18} L 6.4 ${BONE.shin - 18} L 6 ${BONE.shin + 1} L -6 ${BONE.shin + 1} Z`;
/** Giày: gót và mũi khớp đúng điểm FK dùng để bám sàn. */
const SHOE = `M ${-BONE.heel} -5 C -4 -9 6 -8 12 -4 C 20 -1 ${BONE.toe - 2} 2 ${BONE.toe} 6 L ${BONE.toe} ${BONE.ankleH} L ${-BONE.heel} ${BONE.ankleH} Z`;

/** Thân áo: vẽ hướng lên, từ hông tới vai. */
const JERSEY =
  "M -19 8 C -21 -30 -24 -70 -22 -100 C -16 -116 14 -120 23 -106 C 25 -70 22 -30 19 8 Z";
const HEM = "M -19 -2 L 19 -2 L 18 10 L -18.5 10 Z";

/** Cánh tay trên, tay áo, cẳng tay (vẽ hướng xuống từ khớp). */
const UPPER_ARM = `M -7.5 0 L -6.5 ${BONE.upperArm} L 6.5 ${BONE.upperArm} L 7.5 0 Z`;
const SLEEVE = "M -11.5 -8 C -12 4 -11 16 -10.5 27 L 10.5 27 C 11 16 12 4 11.5 -8 C 6 -14 -6 -14 -11.5 -8 Z";
const FOREARM = `M -6.5 0 C -6.5 20 -5.5 40 -4.8 ${BONE.forearm} L 4.8 ${BONE.forearm} C 5.5 40 6.5 20 6.5 0 Z`;

/* ---------- Khung khớp ---------- */

/** Chấm đánh dấu khớp, chỉ hiện ở chế độ debug. */
function Dot() {
  return (
    <circle className="rg-joint" r={3.4} fill="#ff4d6d" stroke="#ffffff" strokeWidth={1} />
  );
}

/** Một khớp: lớp ngoài đặt gốc tại khớp, lớp trong xoay quanh gốc đó. */
function J({
  at = [0, 0],
  name,
  children,
}: {
  at?: readonly [number, number];
  name: string;
  children: React.ReactNode;
}) {
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <g className={`rg rg-${name}`}>
        {children}
        <Dot />
      </g>
    </g>
  );
}

/* ---------- Bộ phận ---------- */

function Leg({ side }: { side: "L" | "R" }) {
  const near = side === "R";
  const hip = near ? BONE.hipNear : BONE.hipFar;
  const skin = near ? "url(#athlete-skin-clean)" : "url(#athlete-skin-shadow)";
  return (
    <J at={[hip.x, hip.y]} name={`hip${side}`}>
      {/* Đùi + ống quần */}
      <path d={THIGH} fill={skin} />
      <path d={SHORTS} fill={near ? "#091534" : "#060e22"} />
      {near && (
        <path d="M 11.5 -8 L 10 38" stroke={GOLD_LINE} strokeWidth={3} strokeLinecap="round" />
      )}
      {/* Gối → cẳng chân */}
      <J at={[0, BONE.thigh]} name={`knee${side}`}>
        <path d={SHIN} fill={skin} />
        <circle r={8.5} fill={skin} />
        <path d={SOCK} fill={near ? "#f8fafc" : "#cbd5e1"} />
        {/* Cổ chân → giày */}
        <J at={[0, BONE.shin]} name={`ank${side}`}>
          <path d={SHOE} fill={near ? "#ffffff" : "#d8dee8"} />
          <path d="M -6 4.5 L 22 4.5" stroke={GOLD_LINE} strokeWidth={2.4} strokeLinecap="round" />
        </J>
      </J>
    </J>
  );
}

/** Vợt: gốc tại tâm nắm tay, trục vợt thẳng hàng với cẳng tay (hướng +y). */
function Racket() {
  const g = BONE.grip;
  const throat = BONE.grip + BONE.shaft;
  return (
    <>
      {/* Cán: chui qua nắm tay, lộ phần đuôi phía dưới ngón út */}
      <rect x={-3.5} y={-13} width={7} height={5} rx={2} fill={GOLD} />
      <rect x={-3} y={-9} width={6} height={g + 9} rx={2.5} fill="#f8fafc" />
      {/* Thân vợt + chạc */}
      <path d={`M 0 ${g} L 0 ${throat}`} stroke={METAL_LINE} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={0} cy={throat} rx={3.2} ry={2.4} fill={GOLD} />
      {/* Mặt vợt, tâm tại (0, RACKET_HEAD_Y) = điểm chạm cầu */}
      <g transform={`translate(0 ${RACKET_HEAD_Y})`}>
        <ellipse
          rx={BONE.racketRx}
          ry={BONE.racketRy}
          stroke={METAL}
          strokeWidth={3.2}
          fill="rgba(232, 197, 106, 0.08)"
        />
        <ellipse
          rx={BONE.racketRx - 2.4}
          ry={BONE.racketRy - 2.4}
          stroke="#ffffff"
          strokeOpacity={0.7}
          strokeWidth={1.1}
        />
        <path
          d="M -13 -16 L 13 -16 M -16 -8 L 16 -8 M -17 0 L 17 0 M -16 8 L 16 8 M -13 16 L 13 16 M -10 -23 L -10 23 M -5 -26 L -5 26 M 0 -27 L 0 27 M 5 -26 L 5 26 M 10 -23 L 10 23"
          stroke="#ffffff"
          strokeOpacity={0.38}
          strokeWidth={0.8}
        />
      </g>
    </>
  );
}

function Arm({ side }: { side: "L" | "R" }) {
  const near = side === "R";
  const skin = near ? "url(#athlete-skin-clean)" : "url(#athlete-skin-shadow)";
  const hand = near ? (
    <J at={[0, BONE.forearm]} name="wrR">
      {/* Vợt vẽ trước nắm tay, để các ngón phủ lên cán */}
      <J at={[0, BONE.hand]} name="racket">
        <Racket />
      </J>
      <rect x={-7} y={-1} width={14} height={17} rx={6.5} fill={skin} />
    </J>
  ) : (
    <g transform={`translate(0 ${BONE.forearm})`}>
      <rect x={-6} y={-1} width={12} height={15} rx={5.5} fill={skin} />
    </g>
  );

  return (
    <J at={[BONE.shoulder.x, BONE.shoulder.y]} name={`sh${side}`}>
      <path d={UPPER_ARM} fill={skin} />
      {/* Khuỷu → cẳng tay → bàn tay */}
      <J at={[0, BONE.upperArm]} name={`el${side}`}>
        <path d={FOREARM} fill={skin} />
        <circle r={6.6} fill={skin} />
        {near && <rect x={-5.6} y={BONE.forearm - 13} width={11.2} height={9} rx={2} fill="#f8fafc" />}
        {hand}
      </J>
      {/* Tay áo vẽ sau cùng: che khớp vai, viền vàng gắn liền mép tay áo */}
      <path d={SLEEVE} fill={near ? "#07122e" : "#050c20"} />
      <path d="M -10.5 26 L 10.5 26" stroke={GOLD_LINE} strokeWidth={2.4} strokeLinecap="round" />
    </J>
  );
}

function Head() {
  return (
    <J at={[BONE.neckBase.x, BONE.neckBase.y]} name="head">
      {/* Tóc đuôi ngựa: con của đầu, nằm sau đầu, trễ nhịp theo lò xo */}
      <J at={[BONE.hairPivot.x, BONE.hairPivot.y]} name="hair">
        <path d="M -5 0 C -9 10 -8 24 -2 35 C 2 27 4.5 12 4.5 0 Z" fill="url(#athlete-hair-sleek)" />
        <circle cx={0} cy={2} r={3.6} fill={GOLD} />
      </J>
      {/* Cổ */}
      <path d="M -6 4 L 6 4 L 5.5 -16 L -5 -16 Z" fill="url(#athlete-skin-clean)" />
      {/* Đầu: mặt trơn, chỉ một nét bóng dưới cằm */}
      <circle cx={5} cy={-36} r={24} fill="url(#athlete-skin-clean)" />
      <path d="M -6 -17 C 2 -12 14 -14 22 -24" stroke="url(#athlete-skin-shadow)" strokeWidth={2} fill="none" />
      {/* Tóc */}
      <path
        d="M -19 -34 C -21 -54 -6 -63 8 -62 C 21 -61 29 -53 29 -44 C 20 -50 4 -52 -6 -47 C -12 -43 -16 -38 -19 -30 Z"
        fill="url(#athlete-hair-sleek)"
      />
      {/* Băng đô vàng viền trắng */}
      <path d="M -20 -43 C -4 -53 16 -53 29.5 -45 L 29.5 -40 C 16 -47 -4 -47 -20 -37.5 Z" fill={GOLD} />
      <path d="M -20 -43 C -4 -53 16 -53 29.5 -45" stroke="#ffffff" strokeWidth={1.1} fill="none" />
    </J>
  );
}

function Shuttle() {
  // Đế cầu (cork) đặt tại gốc toạ độ, lông hướng −y: track xoay để đế đi trước.
  return (
    <g transform="scale(1.28) translate(0 -9)">
      <path d="M-8 -13 L8 -13 L4 6 L-4 6 Z" fill="#ffffff" fillOpacity={0.95} />
      <path d="M-6 -13 L-2 6 M0 -13 L0 6 M6 -13 L2 6" stroke="#94a3b8" strokeWidth={0.8} />
      <ellipse cx={0} cy={9} rx={4.5} ry={3.5} fill="#f5d580" />
    </g>
  );
}

/* ---------- Cảnh ---------- */

function Athlete() {
  const c = CONTACT_POINT;
  return (
    <div aria-hidden className="intro-athlete pointer-events-none absolute">
      {/*
        CSS sinh từ athlete-rig.ts lúc nạp module, giống nhau ở máy chủ và
        trình duyệt. suppressHydrationWarning chỉ đề phòng làm tròn số
        thực khác nhau ở chữ số cuối giữa hai engine JavaScript.
      */}
      <style suppressHydrationWarning>{RIG_CSS}</style>
      <svg
        viewBox="0 0 500 720"
        className="intro-rim absolute inset-0 size-full overflow-visible"
        fill="none"
      >
        <defs>
          <radialGradient id="athlete-court-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8c56a" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#e8c56a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#e8c56a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="athlete-swoosh-gold" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#e8c56a" stopOpacity="0" />
            <stop offset="60%" stopColor="#e8c56a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="athlete-jersey-navy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#102554" />
            <stop offset="60%" stopColor="#081432" />
            <stop offset="100%" stopColor="#040b1c" />
          </linearGradient>
          <linearGradient id="athlete-gold-accent" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffe28a" />
            <stop offset="50%" stopColor="#f5c042" />
            <stop offset="100%" stopColor="#c98a12" />
          </linearGradient>
          <linearGradient id="athlete-gold-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f7d37a" />
            <stop offset="100%" stopColor="#9a6e14" />
          </linearGradient>
          <linearGradient id="athlete-skin-clean" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fad7c0" />
            <stop offset="100%" stopColor="#e3a780" />
          </linearGradient>
          <linearGradient id="athlete-skin-shadow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#df9c75" />
            <stop offset="100%" stopColor="#b8744c" />
          </linearGradient>
          <linearGradient id="athlete-hair-sleek" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c3a50" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="athlete-impact-burst" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="25%" stopColor="#fff3cf" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#e8c56a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#e8c56a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Bóng đổ: ngoài rig, co giãn theo độ cao nhảy và độ khuỵu gối */}
        <g transform={`translate(${ROOT_X} ${GROUND_Y + 4})`}>
          <g className="rg rg-shadow">
            <ellipse rx={120} ry={16} fill="url(#athlete-court-shadow)" />
          </g>
        </g>

        {/* Vệt vung: chính quỹ đạo mặt vợt, mọc theo vợt rồi tan */}
        <path
          d={SWOOSH_D}
          pathLength={1}
          strokeDasharray="1"
          stroke="url(#athlete-swoosh-gold)"
          strokeWidth={22}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rg rg-swoosh"
          suppressHydrationWarning
        />
        <path
          d={SWOOSH_D}
          pathLength={1}
          strokeDasharray="1"
          stroke="#ffffff"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rg rg-swoosh"
          suppressHydrationWarning
        />

        {/* Người chơi */}
        <g className="rg rg-root">
          <J name="pelvis">
            <Leg side="L" />
            <Leg side="R" />
            <J name="torso">
              <Arm side="L" />
              <path d={JERSEY} fill="url(#athlete-jersey-navy)" />
              <path d="M -14 -100 C -14 -60 -12 -20 -11 6" stroke={GOLD} strokeWidth={3.5} strokeLinecap="round" />
              <path d="M 17 -96 C 18 -60 17 -24 14 6" stroke="#ffffff" strokeOpacity={0.4} strokeWidth={2} />
              <J at={[BONE.hem.x, BONE.hem.y]} name="hem">
                <path d={HEM} fill="#081432" />
              </J>
              <path d="M -5 -112 C 0 -105 9 -105 13 -112" stroke={GOLD} strokeWidth={3} strokeLinecap="round" />
              <Head />
              <Arm side="R" />
            </J>
          </J>
          <Dot />
        </g>

        {/* Quả cầu rơi tới, gặp mặt vợt đúng khung chạm */}
        <g className="rg rg-shin">
          <Shuttle />
        </g>
        {/* Đường bay dự phòng sau cú đập (ẩn khi JS dựng đường bay vào hero) */}
        <g className="rg rg-shout">
          <Shuttle />
        </g>

        {/* Chớp sáng tại điểm chạm */}
        <g transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`} suppressHydrationWarning>
          <g className="rg rg-impact">
            <circle r={60} fill="url(#athlete-impact-burst)" />
            <ellipse rx={42} ry={32} stroke="#ffffff" strokeWidth={2.4} opacity={0.95} />
            <ellipse rx={70} ry={52} stroke="#e8c56a" strokeWidth={1.8} strokeDasharray="8 6" opacity={0.75} />
            <path d="M 0 -46 L 0 46 M -46 0 L 46 0" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" />
            <path d="M -31 -31 L 31 31 M 31 -31 L -31 31" stroke="#ffe599" strokeWidth={2} strokeLinecap="round" />
          </g>
        </g>
      </svg>

      {/* Mốc đo 1px đứng yên tại điểm chạm: đường bay vào hero xuất phát từ đây */}
      <span
        className="intro-racket absolute size-px"
        style={{ left: CONTACT_PCT.x, top: CONTACT_PCT.y }}
        suppressHydrationWarning
      />
    </div>
  );
}

/** Không nhận props, không đọc state: không bao giờ re-render theo bộ đếm %. */
export const IntroAthlete = React.memo(Athlete);
