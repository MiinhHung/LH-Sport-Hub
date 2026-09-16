import { cn } from "@/lib/utils";

/**
 * Bìa vẽ tay cho bài Cẩm nang.
 *
 * Vì sao vẽ SVG thay vì dùng ảnh chụp:
 *
 *  - Kho ảnh thật của team chỉ có 4 tấm, dùng đi dùng lại cho hơn chục bài
 *    thì trang danh sách nhìn như bị lặp.
 *  - Ảnh chụp mang màu của chỗ chụp, đặt cạnh nhau là loạn tông. Hình vẽ
 *    thì dùng đúng navy + vàng của app nên cả trang thành một bộ.
 *  - Mỗi bìa nặng khoảng 1KB thay vì 400KB, và sắc nét ở mọi cỡ màn hình.
 *
 * Khung nhìn cố định 1200×750; `slice` khiến nó cư xử y hệt object-cover
 * nên nhét vào khung tỉ lệ nào cũng không méo.
 */

export type CoverMotif =
  | "shuttle" // quả cầu
  | "footwork" // sáu hướng di chuyển
  | "serve" // đường cầu giao qua lưới
  | "lines" // cầu chạm vạch
  | "strings" // mặt vợt và dây
  | "pulse" // nhịp tim, nước
  | "net" // lưới nhìn thẳng
  | "sole" // đế giày nhìn từ dưới
  | "sunrise"; // mặt trời mọc, đánh sáng sớm

const GOLD = "var(--color-gold-400)";
const GOLD_SOFT = "var(--color-gold-300)";

/** Đường viền đế giày, mũi hướng lên. Dùng cho cả nét viền lẫn vùng cắt. */
const SOLE_PATH =
  "M 0 -300 C 92 -300 122 -228 120 -158 C 118 -88 96 -40 92 12 " +
  "C 88 72 112 122 106 182 C 100 252 56 300 0 300 " +
  "C -56 300 -100 252 -106 182 C -112 122 -88 72 -92 12 " +
  "C -96 -40 -118 -88 -120 -158 C -122 -228 -92 -300 0 -300 Z";

export function CoverArt({
  motif,
  className,
}: {
  motif: CoverMotif;
  className?: string;
}) {
  const id = `ca-${motif}`;

  return (
    <svg
      viewBox="0 0 1200 750"
      preserveAspectRatio="xMidYMid slice"
      className={cn("size-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-navy-800)" />
          <stop offset="55%" stopColor="var(--color-navy-900)" />
          <stop offset="100%" stopColor="var(--color-navy-950)" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.76" cy="0.24" r="0.62">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.26" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="750" fill={`url(#${id}-bg)`} />
      <rect width="1200" height="750" fill={`url(#${id}-glow)`} />

      {/* Hình vẽ lệch lên trên và sang phải: nửa dưới bên trái để dành cho
          chữ tiêu đề đè lên. */}
      <g transform="translate(700 330)">{MOTIFS[motif]}</g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Các hình                                                            */
/* ------------------------------------------------------------------ */

/** Quả cầu nhìn nghiêng: đế bần, váy lông xoè, vệt bay phía sau. */
const Shuttle = (
  <g transform="rotate(-24)">
    {/* Vệt bay */}
    <g stroke={GOLD} strokeLinecap="round" fill="none" opacity="0.4">
      <path d="M -120 210 L -300 330" strokeWidth="7" />
      <path d="M -40 250 L -180 345" strokeWidth="5" opacity="0.7" />
      <path d="M -190 155 L -350 235" strokeWidth="5" opacity="0.7" />
    </g>

    {/* Váy lông */}
    <path
      d="M -62 40 L -168 -250 A 168 46 0 0 0 168 -250 L 62 40 Z"
      fill={GOLD}
      fillOpacity="0.14"
      stroke={GOLD_SOFT}
      strokeWidth="6"
      strokeLinejoin="round"
    />
    {/* Nan lông */}
    <g stroke={GOLD_SOFT} strokeWidth="4" opacity="0.62">
      {[-1, -0.6, -0.2, 0.2, 0.6, 1].map((t) => (
        <line key={t} x1={t * 62} y1={40} x2={t * 168} y2={-250} />
      ))}
      <path d="M -142 -170 A 150 40 0 0 0 142 -170" fill="none" />
      <path d="M -108 -95 A 130 34 0 0 0 108 -95" fill="none" />
    </g>

    {/* Đế bần */}
    <circle cx="0" cy="62" r="72" fill={GOLD} fillOpacity="0.9" />
    <circle
      cx="0"
      cy="62"
      r="72"
      fill="none"
      stroke="var(--color-navy-950)"
      strokeWidth="5"
      strokeOpacity="0.35"
    />
    <path
      d="M -72 58 A 72 72 0 0 1 24 -6"
      fill="none"
      stroke="var(--color-navy-950)"
      strokeWidth="9"
      strokeOpacity="0.2"
      strokeLinecap="round"
    />
  </g>
);

/** Sân nhìn từ trên, sáu mũi tên toả ra từ vị trí trung tâm. */
const Footwork = (
  <g>
    <g
      stroke={GOLD_SOFT}
      strokeWidth="5"
      fill="none"
      opacity="0.35"
      transform="rotate(-12)"
    >
      <rect x="-300" y="-270" width="600" height="540" rx="6" />
      <line x1="-300" y1="0" x2="300" y2="0" strokeWidth="9" />
      <line x1="-300" y1="-108" x2="300" y2="-108" />
      <line x1="-300" y1="108" x2="300" y2="108" />
      <line x1="0" y1="108" x2="0" y2="270" />
      <line x1="0" y1="-108" x2="0" y2="-270" />
    </g>

    <g transform="rotate(-12)">
      <g stroke={GOLD} strokeWidth="11" strokeLinecap="round" fill="none">
        {[
          [-210, -190],
          [210, -190],
          [-250, 0],
          [250, 0],
          [-200, 205],
          [200, 205],
        ].map(([x, y]) => {
          // Chừa một khoảng quanh tâm để mũi tên không dính vào chấm giữa.
          const len = Math.hypot(x, y);
          const from = 62 / len;
          return (
            <g key={`${x},${y}`} opacity="0.85">
              <line x1={x * from} y1={y * from} x2={x} y2={y} />
              <path
                d={arrowHead(x, y)}
                strokeWidth="9"
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </g>
      <circle cx="0" cy="0" r="30" fill={GOLD} fillOpacity="0.95" />
      <circle
        cx="0"
        cy="0"
        r="52"
        fill="none"
        stroke={GOLD}
        strokeWidth="5"
        strokeOpacity="0.5"
      />
    </g>
  </g>
);

/** Hai nét chéo tạo đầu mũi tên tại điểm (x, y), hướng ra xa gốc. */
function arrowHead(x: number, y: number) {
  const len = Math.hypot(x, y);
  const ux = x / len;
  const uy = y / len;
  const back = 40;
  const wide = 22;
  // Điểm lùi về phía gốc, lệch sang hai bên theo pháp tuyến.
  const bx = x - ux * back;
  const by = y - uy * back;
  return `M ${bx - uy * wide} ${by + ux * wide} L ${x} ${y} L ${bx + uy * wide} ${by - ux * wide}`;
}

/** Nhìn ngang: lưới ở giữa, đường cầu giao vòng qua. */
const Serve = (
  <g>
    {/* Mặt sân */}
    <line
      x1="-370"
      y1="230"
      x2="370"
      y2="230"
      stroke={GOLD_SOFT}
      strokeWidth="6"
      strokeOpacity="0.4"
    />
    {/* Lưới */}
    <g opacity="0.55">
      <line
        x1="0"
        y1="230"
        x2="0"
        y2="30"
        stroke={GOLD_SOFT}
        strokeWidth="6"
      />
      <rect
        x="-52"
        y="30"
        width="104"
        height="200"
        fill="none"
        stroke={GOLD_SOFT}
        strokeWidth="4"
      />
      <g stroke={GOLD_SOFT} strokeWidth="2.5" opacity="0.7">
        {[60, 90, 120, 150, 180, 210].map((y) => (
          <line key={y} x1="-52" y1={y} x2="52" y2={y} />
        ))}
        {[-26, 26].map((x) => (
          <line key={x} x1={x} y1="30" x2={x} y2="230" />
        ))}
      </g>
      <line x1="-58" y1="30" x2="58" y2="30" stroke={GOLD} strokeWidth="9" />
    </g>

    {/* Đường cầu */}
    <path
      d="M -330 180 Q -140 -220 60 -40 T 330 175"
      fill="none"
      stroke={GOLD}
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray="26 20"
      opacity="0.85"
    />

    {/* Quả cầu nhỏ ở cuối đường bay */}
    <g transform="translate(330 175) rotate(48) scale(0.34)">
      <path
        d="M -62 40 L -168 -250 A 168 46 0 0 0 168 -250 L 62 40 Z"
        fill={GOLD}
        fillOpacity="0.16"
        stroke={GOLD_SOFT}
        strokeWidth="14"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="62" r="72" fill={GOLD} />
    </g>
  </g>
);

/** Góc sân phóng to: quả cầu rơi chạm vạch — trong hay ngoài. */
const Lines = (
  <g>
    <g stroke={GOLD_SOFT} strokeWidth="14" opacity="0.5" fill="none">
      <path d="M -330 -180 L 200 -180" />
      <path d="M 200 -180 L 200 300" />
    </g>
    <g stroke={GOLD_SOFT} strokeWidth="5" opacity="0.28" fill="none">
      <path d="M -330 60 L 200 60" />
      <path d="M -60 -180 L -60 300" />
    </g>

    {/* Vòng phóng to quanh điểm cầu chạm */}
    <circle
      cx="200"
      cy="-180"
      r="150"
      fill="var(--color-navy-950)"
      fillOpacity="0.55"
    />
    <circle
      cx="200"
      cy="-180"
      r="150"
      fill="none"
      stroke={GOLD}
      strokeWidth="7"
      strokeOpacity="0.75"
    />

    {/* Vệt cầu chạm, nằm đè lên vạch => "trong" */}
    <ellipse
      cx="200"
      cy="-180"
      rx="54"
      ry="30"
      fill={GOLD}
      fillOpacity="0.92"
      transform="rotate(-18 200 -180)"
    />
    <g stroke={GOLD} strokeWidth="6" strokeLinecap="round" opacity="0.8">
      <line x1="200" y1="-268" x2="200" y2="-310" />
      <line x1="288" y1="-180" x2="330" y2="-180" />
    </g>
  </g>
);

/** Mặt vợt và lưới dây. */
const Strings = (
  <g transform="rotate(-32)">
    <defs>
      <clipPath id="ca-head">
        <ellipse cx="0" cy="-90" rx="178" ry="212" />
      </clipPath>
    </defs>

    {/* Dây */}
    <g clipPath="url(#ca-head)" stroke={GOLD_SOFT} strokeWidth="4" opacity="0.5">
      {[-160, -120, -80, -40, 0, 40, 80, 120, 160].map((x) => (
        <line key={`v${x}`} x1={x} y1="-320" x2={x} y2="140" />
      ))}
      {[-280, -240, -200, -160, -120, -80, -40, 0, 40, 80].map((y) => (
        <line key={`h${y}`} x1="-200" y1={y} x2="200" y2={y} />
      ))}
    </g>

    {/* Khung */}
    <ellipse
      cx="0"
      cy="-90"
      rx="178"
      ry="212"
      fill="none"
      stroke={GOLD}
      strokeWidth="15"
    />
    {/* Cổ vợt */}
    <path
      d="M -62 106 L -34 210 M 62 106 L 34 210"
      stroke={GOLD}
      strokeWidth="14"
      strokeLinecap="round"
      fill="none"
    />
    {/* Cán */}
    <rect
      x="-36"
      y="206"
      width="72"
      height="200"
      rx="30"
      fill={GOLD}
      fillOpacity="0.85"
    />
    <g stroke="var(--color-navy-950)" strokeWidth="5" strokeOpacity="0.3">
      {[250, 290, 330, 370].map((y) => (
        <line key={y} x1="-32" y1={y} x2="32" y2={y} />
      ))}
    </g>
  </g>
);

/** Nhịp tim và giọt nước. */
const Pulse = (
  <g>
    <path
      d="M -360 0 L -190 0 L -140 -120 L -70 150 L -10 -60 L 40 0 L 130 0"
      fill="none"
      stroke={GOLD}
      strokeWidth="13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="-70" cy="150" r="17" fill={GOLD} />

    {/* Giọt nước */}
    <g transform="translate(272 -20)">
      <path
        d="M 0 -150 C 82 -46 118 -6 118 46 A 118 118 0 0 1 -118 46 C -118 -6 -82 -46 0 -150 Z"
        fill={GOLD}
        fillOpacity="0.16"
        stroke={GOLD}
        strokeWidth="11"
        strokeLinejoin="round"
      />
      <path
        d="M -66 40 A 66 66 0 0 0 -12 100"
        fill="none"
        stroke={GOLD_SOFT}
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.75"
      />
    </g>

    <g stroke={GOLD_SOFT} strokeWidth="5" opacity="0.3">
      <line x1="-360" y1="230" x2="330" y2="230" />
      <line x1="-360" y1="-230" x2="330" y2="-230" />
    </g>
  </g>
);

/** Lưới nhìn thẳng từ phía sân: hai cột, băng trắng mép trên, mắt lưới. */
const Net = (
  <g>
    {/* Cột hai đầu */}
    <g fill={GOLD} fillOpacity="0.85">
      <rect x="-352" y="-230" width="22" height="440" rx="10" />
      <rect x="330" y="-230" width="22" height="440" rx="10" />
    </g>

    {/* Mắt lưới */}
    <g stroke={GOLD_SOFT} strokeWidth="3" opacity="0.45">
      {Array.from({ length: 16 }, (_, i) => -330 + i * 44).map((x) => (
        <line key={`v${x}`} x1={x} y1="-196" x2={x} y2="176" />
      ))}
      {Array.from({ length: 9 }, (_, i) => -196 + i * 46).map((y) => (
        <line key={`h${y}`} x1="-330" y1={y} x2="330" y2={y} />
      ))}
    </g>

    {/* Băng mép trên */}
    <rect
      x="-334"
      y="-230"
      width="668"
      height="40"
      rx="8"
      fill={GOLD}
      fillOpacity="0.92"
    />
    <line
      x1="-330"
      y1="176"
      x2="330"
      y2="176"
      stroke={GOLD_SOFT}
      strokeWidth="7"
      strokeOpacity="0.7"
    />

    {/* Mặt sân và vạch hút về phía xa */}
    <g stroke={GOLD_SOFT} strokeWidth="5" opacity="0.28">
      <line x1="-390" y1="250" x2="390" y2="250" />
      <line x1="-150" y1="250" x2="-60" y2="176" />
      <line x1="150" y1="250" x2="60" y2="176" />
    </g>
  </g>
);

/** Đế giày nhìn từ dưới lên: rãnh xương cá và điểm xoay ở ức bàn chân. */
const Sole = (
  <g transform="rotate(14)">
    <defs>
      <clipPath id="ca-sole">
        <path d={SOLE_PATH} />
      </clipPath>
    </defs>

    <path d={SOLE_PATH} fill={GOLD} fillOpacity="0.12" />

    {/* Rãnh xương cá */}
    <g
      clipPath="url(#ca-sole)"
      stroke={GOLD_SOFT}
      strokeWidth="7"
      fill="none"
      opacity="0.55"
    >
      {Array.from({ length: 17 }, (_, i) => -280 + i * 36).map((y) => (
        <path key={y} d={`M -130 ${y + 26} L 0 ${y} L 130 ${y + 26}`} />
      ))}
    </g>

    <path d={SOLE_PATH} fill="none" stroke={GOLD} strokeWidth="13" />

    {/* Điểm xoay dưới ức bàn chân */}
    <circle
      cx="0"
      cy="-130"
      r="66"
      fill="var(--color-navy-950)"
      fillOpacity="0.75"
    />
    <circle cx="0" cy="-130" r="66" fill="none" stroke={GOLD} strokeWidth="11" />
    <circle cx="0" cy="-130" r="20" fill={GOLD} />
  </g>
);

/** Mặt trời vừa lên khỏi đường chân trời, tia toả ra. */
const Sunrise = (
  <g>
    {/* Cắt nửa dưới của đĩa mặt trời đi, để nó đúng là vừa nhô lên. */}
    <defs>
      <clipPath id="ca-sun">
        <rect x="-420" y="-420" width="840" height="500" />
      </clipPath>
    </defs>

    {/* Tia nắng */}
    <g
      clipPath="url(#ca-sun)"
      stroke={GOLD}
      strokeWidth="11"
      strokeLinecap="round"
      opacity="0.55"
    >
      {[-78, -54, -30, -6, 18, 42, 66].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const sx = Math.sin(r);
        const sy = -Math.cos(r);
        return (
          <line
            key={deg}
            x1={sx * 208}
            y1={80 + sy * 208}
            x2={sx * 300}
            y2={80 + sy * 300}
          />
        );
      })}
    </g>

    {/* Đĩa mặt trời */}
    <g clipPath="url(#ca-sun)">
      <circle cx="0" cy="80" r="158" fill={GOLD} fillOpacity="0.92" />
    </g>

    {/* Đường chân trời, cũng chính là biên cuối sân */}
    <line
      x1="-390"
      y1="80"
      x2="390"
      y2="80"
      stroke={GOLD}
      strokeWidth="9"
      strokeLinecap="round"
    />

    {/* Vạch sân hút về phía xa */}
    <g stroke={GOLD_SOFT} strokeWidth="5" opacity="0.32" fill="none">
      <path d="M -300 300 L -110 80 M 300 300 L 110 80" />
      <line x1="-205" y1="190" x2="205" y2="190" />
    </g>
  </g>
);

const MOTIFS: Record<CoverMotif, React.ReactElement> = {
  shuttle: Shuttle,
  footwork: Footwork,
  serve: Serve,
  lines: Lines,
  strings: Strings,
  pulse: Pulse,
  net: Net,
  sole: Sole,
  sunrise: Sunrise,
};
