import { cn } from "@/lib/utils";

/**
 * Hoạ tiết nét vàng của nhận diện Light Human.
 *
 * Lấy từ tấm banner thương hiệu của công ty: những "cánh" đa giác viền
 * mảnh màu vàng, hội tụ về một điểm ở mép và xoè ra với độ dài khác
 * nhau — cùng ngôn ngữ hình với con cầu trong logo.
 *
 * ================================================================
 * VẼ BẰNG SVG, KHÔNG NHÚNG TẤM BANNER.
 * ================================================================
 *
 * Tấm banner gốc là ảnh 1656×630 quảng cáo dịch vụ tư vấn nhân sự cho
 * doanh nghiệp SME — nội dung không dính gì tới app của team. Thứ đáng
 * lấy là NGÔN NGỮ HÌNH, không phải tấm ảnh.
 *
 * Dựng lại bằng SVG thì: nặng vài trăm byte thay vì vài trăm KB, phóng
 * to bao nhiêu cũng không vỡ, và đổi được màu theo nền sáng/tối. Nhúng
 * PNG thì mất cả ba.
 *
 * ================================================================
 * DÙNG `gold-400` CỦA APP, KHÔNG DÙNG VÀNG CỦA BANNER.
 * ================================================================
 *
 * Đo màu thật trong tệp banner: vàng nét ở đó là #f8cc38, còn app dùng
 * `gold-400` #dcae42 — banner rực và vàng hơn rõ rệt. Navy thì gần
 * khớp (#002054 so với `navy-900` #001a4a).
 *
 * Vẫn lấy vàng của app, vì `DESIGN.md` chốt "một bảng màu duy nhất,
 * không thêm màu mới" và "DUY NHẤT một accent". Đổi `gold-400` sang
 * sắc của banner thì đụng mọi nút accent, vạch active và huy hiệu
 * trong app, lại phải đo lại tương phản toàn bộ — cái giá đó lớn hơn
 * cái được, vì thứ mang lại nhận diện là HÌNH, không phải vài độ bão
 * hoà của màu.
 */

/** Một cánh: góc toả (độ), độ dài, bề ngang ở đầu xa. */
type Canh = { goc: number; dai: number; rong: number };

/*
  Bố trí cố ý KHÔNG đối xứng, giống bản gốc: các cánh lệch nhau về góc
  và độ dài. Đối xứng đều trông như một biểu tượng cài sẵn, còn lệch
  nhau thì ra chất đồ hoạ thương hiệu.
*/
const CANH: Canh[] = [
  { goc: 198, dai: 92, rong: 30 },
  { goc: 216, dai: 70, rong: 20 },
  { goc: 170, dai: 78, rong: 24 },
  { goc: 152, dai: 58, rong: 16 },
  { goc: 234, dai: 46, rong: 13 },
];

/** Tâm hội tụ, đặt ở mép phải giữa khung 100×100. */
const TAM = { x: 100, y: 50 };

/** Bề ngang ở đầu gần tâm — nhỏ nhưng khác 0, để cánh không nhọn hoắt. */
const ROI = 2.5;

function duongCanh({ goc, dai, rong }: Canh) {
  const rad = (goc * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  // Vector vuông góc, để trải bề ngang sang hai bên trục cánh.
  const px = -dy;
  const py = dx;

  const xa = { x: TAM.x + dx * dai, y: TAM.y + dy * dai };

  const p = [
    [TAM.x + px * ROI, TAM.y + py * ROI],
    [xa.x + px * rong, xa.y + py * rong],
    [xa.x - px * rong, xa.y - py * rong],
    [TAM.x - px * ROI, TAM.y - py * ROI],
  ];

  return p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

export function HoaTietThuongHieu({
  className,
  /** Độ đậm tổng thể. Mặc định nhạt: đây là nền, không phải nội dung. */
  mo = 0.28,
}: {
  className?: string;
  mo?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      /*
        GIỮ TỈ LỆ. Bản đầu tôi để `none` với lý do "là nền thì kéo giãn
        cũng được" — sai. Đây là hình học có góc cạnh: kéo vào khung
        516×900 thì mọi góc méo đi, hình quạt thành một đống đường chéo
        cắt nhau. `vector-effect` giữ được bề dày nét nhưng không cứu
        được hình.
      */
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none select-none", className)}
      style={{ opacity: mo }}
    >
      <g
        fill="none"
        stroke="var(--color-gold-400)"
        /* Nét mảnh và KHÔNG đổi theo tỉ lệ khung: thiếu
           `vector-effect` thì lúc kéo giãn, nét dọc và nét ngang dày
           mỏng khác nhau, nhìn như vẽ hỏng. */
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.1}
        strokeLinejoin="round"
      >
        {CANH.map((c) => (
          <polygon key={`${c.goc}-${c.dai}`} points={duongCanh(c)} />
        ))}
      </g>
    </svg>
  );
}
