"use client";

import * as React from "react";

export type RacketVariant =
  | "gold"        // Hoàng Kim 24K (Imperial Gold)
  | "champagne"   // Vàng Sâm Panh thanh nhã (Champagne Gold)
  | "amber"       // Vàng Hổ Phách ánh đồng (Warm Amber Gold)
  | "platinum";   // Bạch Kim Ánh Vàng (Aurum Platinum)

export interface RacketProps {
  variant?: RacketVariant;
  scale?: number;
  rotation?: number;
  glow?: boolean;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

const GOLD_THEMES: Record<
  RacketVariant,
  {
    name: string;
    frameOuter: string;
    frameInner: string;
    strings: string;
    stringsOpacity: number;
    shaft: [string, string]; // gradient stop 1, stop 2
    grip: string;
    gripStripe: string;
    accent: string;
    glowFilter: string;
  }
> = {
  gold: {
    name: "Hoàng Kim 24K",
    frameOuter: "#ffd700",
    frameInner: "#0a1633",
    strings: "#ffe57f",
    stringsOpacity: 0.52,
    shaft: ["#fff2a8", "#c69214"],
    grip: "#0b1426",
    gripStripe: "#ffd700",
    accent: "#ffd700",
    glowFilter: "drop-shadow(0 0 12px rgba(255,215,0,0.55)) drop-shadow(0 0 24px rgba(245,192,66,0.25))",
  },
  champagne: {
    name: "Vàng Sâm Panh",
    frameOuter: "#ffeaa0",
    frameInner: "#0a1633",
    strings: "#fff7d6",
    stringsOpacity: 0.48,
    shaft: ["#ffffff", "#d4af37"],
    grip: "#0f172a",
    gripStripe: "#e8c56a",
    accent: "#e8c56a",
    glowFilter: "drop-shadow(0 0 10px rgba(232,197,106,0.5))",
  },
  amber: {
    name: "Vàng Hổ Phách",
    frameOuter: "#f59e0b",
    frameInner: "#0d1830",
    strings: "#fde68a",
    stringsOpacity: 0.5,
    shaft: ["#fbbf24", "#b45309"],
    grip: "#091222",
    gripStripe: "#f59e0b",
    accent: "#f59e0b",
    glowFilter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))",
  },
  platinum: {
    name: "Bạch Kim Ánh Vàng",
    frameOuter: "#ffffff",
    frameInner: "#0a1633",
    strings: "#ffffff",
    stringsOpacity: 0.55,
    shaft: ["#ffffff", "#e2e8f0"],
    grip: "#0f172a",
    gripStripe: "#ffd700",
    accent: "#fef08a",
    glowFilter: "drop-shadow(0 0 12px rgba(255,255,255,0.45)) drop-shadow(0 0 20px rgba(254,240,138,0.3))",
  },
};

/**
 * Component Vợt Cầu Lông Vàng Kim Cao Cấp (Luxury Golden Badminton Racket).
 * - 100% Vector SVG thanh thoát, tỷ lệ chuẩn thi đấu.
 * - Khung khí động học dát vàng, lưới cước mạ vàng siêu mảnh, thân vợt thon gọn.
 * - Cán da than chì huyền bí quấn chỉ vàng kim sang trọng.
 */
export function Racket({
  variant = "gold",
  scale = 1,
  rotation = 0,
  glow = false,
  label,
  className = "",
  style = {},
}: RacketProps) {
  const t = GOLD_THEMES[variant] ?? GOLD_THEMES.gold;
  const idPrefix = React.useId().replace(/:/g, "_");

  return (
    <svg
      viewBox="0 0 80 230"
      width={80 * scale}
      height={230 * scale}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none overflow-visible ${className}`}
      style={{
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "40px 115px",
        filter: glow ? t.glowFilter : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Gradient mạ vàng khung vợt */}
        <linearGradient
          id={`${idPrefix}-frame-grad`}
          x1="16"
          y1="6"
          x2="64"
          y2="76"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor={t.frameOuter} />
          <stop offset="70%" stopColor={t.accent} />
          <stop offset="100%" stopColor="#875e0f" />
        </linearGradient>

        {/* Gradient ánh sáng lướt trên đũa vợt (Slim Shaft) */}
        <linearGradient
          id={`${idPrefix}-shaft-grad`}
          x1="38"
          y1="76"
          x2="42"
          y2="152"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={t.shaft[0]} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.9} />
          <stop offset="100%" stopColor={t.shaft[1]} />
        </linearGradient>

        {/* Lớp bóng sâu lòng vợt */}
        <radialGradient
          id={`${idPrefix}-inner-depth`}
          cx="40"
          cy="40"
          r="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="60%" stopColor={t.frameInner} stopOpacity="0" />
          <stop offset="100%" stopColor={t.frameInner} stopOpacity="0.75" />
        </radialGradient>
      </defs>

      {/* ================= 1. ĐẦU VỢT & LƯỚI CƯỚC (HEAD & STRING BED) ================= */}
      <g id="racket-head">
        {/* Lòng vợt mờ sâu */}
        <ellipse
          cx="40"
          cy="40"
          rx="24"
          ry="32"
          fill={t.frameInner}
          fillOpacity={0.4}
        />
        <ellipse
          cx="40"
          cy="40"
          rx="24"
          ry="32"
          fill={`url(#${idPrefix}-inner-depth)`}
        />

        {/* Lưới cước dọc vàng mảnh */}
        <g stroke={t.strings} strokeOpacity={t.stringsOpacity} strokeWidth="0.75">
          <line x1="26" y1="20" x2="26" y2="60" />
          <line x1="30" y1="14" x2="30" y2="66" />
          <line x1="34" y1="11" x2="34" y2="69" />
          <line x1="38" y1="9" x2="38" y2="71" />
          <line x1="42" y1="9" x2="42" y2="71" />
          <line x1="46" y1="11" x2="46" y2="69" />
          <line x1="50" y1="14" x2="50" y2="66" />
          <line x1="54" y1="20" x2="54" y2="60" />
        </g>

        {/* Lưới cước ngang vàng mảnh */}
        <g stroke={t.strings} strokeOpacity={t.stringsOpacity} strokeWidth="0.75">
          <line x1="25" y1="18" x2="55" y2="18" />
          <line x1="21" y1="24" x2="59" y2="24" />
          <line x1="18.5" y1="30" x2="61.5" y2="30" />
          <line x1="17.5" y1="36" x2="62.5" y2="36" />
          <line x1="17.5" y1="42" x2="62.5" y2="42" />
          <line x1="18.5" y1="48" x2="61.5" y2="48" />
          <line x1="21" y1="54" x2="59" y2="54" />
          <line x1="25" y1="60" x2="55" y2="60" />
        </g>

        {/* Khung vợt oval khí động học mạ vàng óng */}
        <ellipse
          cx="40"
          cy="40"
          rx="24.5"
          ry="32.5"
          stroke={`url(#${idPrefix}-frame-grad)`}
          strokeWidth="2.8"
        />

        {/* Vệt phản quang ánh kim đỉnh vợt */}
        <path
          d="M 23 26 C 28 13, 52 13, 57 26"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* Khớp nối chữ T (Built-in T-Joint mạ vàng) */}
        <path
          d="M 36.5 70 C 36.5 73, 38.5 77, 39 80 L 41 80 C 41.5 77, 43.5 73, 43.5 70 Z"
          fill={t.accent}
        />
        <rect x="38.5" y="75" width="3" height="3" rx="0.8" fill="#ffffff" fillOpacity="0.8" />
      </g>

      {/* ================= 2. ĐŨA VỢT (SLIM 6.8MM SHAFT) ================= */}
      <g id="racket-shaft">
        {/* Thân carbon thuôn dài thanh mảnh */}
        <rect
          x="38.7"
          y="80"
          width="2.6"
          height="68"
          rx="1.3"
          fill={`url(#${idPrefix}-shaft-grad)`}
        />

        {/* Đường chỉ highlight ánh sáng chạy dọc đũa vợt */}
        <line
          x1="39.4"
          y1="83"
          x2="39.4"
          y2="145"
          stroke="#ffffff"
          strokeWidth="0.75"
          strokeOpacity="0.8"
        />

        {/* Chóp nón chụp cán (Control Support Cap mạ vàng) */}
        <path
          d="M 38 147 L 42 147 L 44 157 L 36 157 Z"
          fill={t.frameInner}
          stroke={t.accent}
          strokeWidth="0.9"
        />
      </g>

      {/* ================= 3. CÁN CẦM & CUỐN CÁN (HANDLE & GRIP) ================= */}
      <g id="racket-handle">
        {/* Cán cầm da đen huyền bí viền mạ vàng */}
        <rect
          x="36"
          y="157"
          width="8"
          height="54"
          rx="1"
          fill={t.grip}
          stroke={t.accent}
          strokeWidth="0.75"
        />

        {/* Đường chỉ vàng cuốn cán xoắn ốc (Gold Thread Overwrap) */}
        <g stroke={t.gripStripe} strokeOpacity={0.65} strokeWidth="0.9" strokeLinecap="round">
          <line x1="36" y1="163" x2="44" y2="167" />
          <line x1="36" y1="171" x2="44" y2="175" />
          <line x1="36" y1="179" x2="44" y2="183" />
          <line x1="36" y1="187" x2="44" y2="191" />
          <line x1="36" y1="195" x2="44" y2="199" />
          <line x1="36" y1="203" x2="44" y2="207" />
        </g>

        {/* Đế chuôi cán mạ vàng (Butt Cap) */}
        <rect
          x="35"
          y="211"
          width="10"
          height="5"
          rx="1.5"
          fill={t.accent}
        />

        {/* Nắp đáy chuôi có biểu tượng LH thu nhỏ */}
        <circle cx="40" cy="213.5" r="1.5" fill="#000000" fillOpacity="0.4" />
      </g>

      {/* Nhãn thẻ tên vàng kim tối giản nếu có */}
      {label && (
        <text
          x="40"
          y="226"
          textAnchor="middle"
          fill={t.accent}
          fontSize="7"
          fontWeight="800"
          fontFamily="var(--font-sport), sans-serif"
          letterSpacing="0.5px"
          opacity={0.85}
        >
          {label.toUpperCase()}
        </text>
      )}
    </svg>
  );
}
