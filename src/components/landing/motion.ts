import type { CSSProperties } from "react";

/**
 * MOTION TOKEN của trang giới thiệu: nguồn sự thật DUY NHẤT.
 *
 * Mọi duration, easing, spring, độ trễ và thông số cuộn của trang phải lấy từ
 * file này (xem DESIGN.md mục 11.2). Không được viết số rời trong component.
 * Chỗ nào không dùng được hằng TypeScript (class Tailwind) thì dùng biến CSS
 * `--m-*`, được đặt ở `(marketing)/layout.tsx` từ `MOTION_CSS_VARS` bên dưới.
 */

/** Thời lượng, mili giây. */
export const MS = {
  /** Hover, đổi màu, viền, nhấn nút. */
  instant: 200,
  /** Hiện/ẩn nhỏ, đổi trạng thái header, đổi chữ trong khối. */
  fast: 300,
  /** Nét kẻ, dấu nháy, đoạn văn, chữ hero vào trang. */
  base: 500,
  /** Hiện khối khi vào tầm nhìn, chuyển cảnh, chồng ảnh. */
  slow: 800,
} as const;

/** Cùng các giá trị trên, tính bằng giây (cho motion/react). */
export const SEC = {
  instant: MS.instant / 1000,
  fast: MS.fast / 1000,
  base: MS.base / 1000,
  slow: MS.slow / 1000,
  /** Nét vẽ dài một lần (quỹ đạo hero): gấp đôi `slow`. */
  draw: (MS.slow * 2) / 1000,
  /** Vi chuyển động vật lý trong trò đố vui (lấy đà của vợt). */
  snap: 0.12,
  /** Quả cầu trong trò đố vui bay từ vợt tới ô. */
  flight: MS.slow / 1000,
} as const;

/** Easing chuẩn: ease-out expo. Mọi hiện dần và trượt dùng đường này. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
/** Lấy đà ngắn trước cú vung của trò đố vui. */
export const EASE_SNAP: [number, number, number, number] = [0.33, 1, 0.68, 1];

/** Spring chuẩn. */
export const SPRING = {
  /** Mọi giá trị nối với cuộn: thanh tiến trình, trận cầu, nét nối. */
  scroll: { stiffness: 140, damping: 28, mass: 0.4 },
  /** Parallax theo con trỏ ở hero (mềm hơn, để lớp trôi chậm). */
  pointer: { stiffness: 60, damping: 18, mass: 0.6 },
  /** Chữ số rơi vào ô đáp án. */
  pop: { stiffness: 480, damping: 20 },
  /** Vợt vung hết đà, và thu vợt. */
  swing: { stiffness: 190, damping: 16, mass: 1 },
  recover: { stiffness: 90, damping: 18, mass: 1 },
  /** Vợt về thế chuẩn bị khi kéo chưa đủ đà. */
  reset: { stiffness: 260, damping: 18 },
} as const;

/** Độ trễ và nhịp so le, mili giây. */
export const DELAY = {
  /** Giữa hai từ liền nhau của một tiêu đề. */
  word: 65,
  /** Giữa hai mục cùng hàng. */
  item: 60,
  /** Tiêu đề section vào trước. */
  heading: 80,
  /** Nội dung đi kèm tiêu đề vào sau tiêu đề. */
  body: 160,
  /** Hero: nhịp giữa các phần tử chữ, nhãn rồi tiêu đề rồi dòng phụ rồi nút. */
  hero: 90,
} as const;

/** Khoảng trượt của mọi lần hiện dần, pixel. */
export const REVEAL_OFFSET = 20;

/** Vùng quan sát để hiện dần: kích hoạt khi phần tử vào 12% từ đáy. */
export const REVEAL_MARGIN = "0px 0px -12% 0px";

/** Biến CSS cho class Tailwind: `duration-[var(--m-fast)]`, `ease-[var(--m-ease)]`. */
export const MOTION_CSS_VARS = {
  "--m-instant": `${MS.instant}ms`,
  "--m-fast": `${MS.fast}ms`,
  "--m-base": `${MS.base}ms`,
  "--m-slow": `${MS.slow}ms`,
  "--m-ease": EASE_OUT_CSS,
} as CSSProperties;
