"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import * as React from "react";

/**
 * Con trỏ chuột trở thành một quả cầu lông trên trang giới thiệu.
 *
 * ĐẾ BẦN ĐI TRƯỚC. Quả cầu bay đế nặng trước, váy lông kéo phía sau —
 * đúng như trong trò đố vui cuối trang, và đó cũng là thứ ai từng cầm vợt
 * cũng nhận ra ngay. Vẽ ngược lại thì hình vẫn "đúng" mà trông sai.
 *
 * HAI ĐỘ TRỄ KHÁC NHAU, KHÔNG PHẢI MỘT.
 *
 * Nếu quả cầu bám sát con trỏ thì nó chỉ là một cái con trỏ khác hình, vô
 * vị. Nếu nó trễ nhiều thì bấm nút hụt, vì mắt nhắm theo quả cầu chứ không
 * theo điểm bấm thật. Nên vị trí bám khá sát (lò xo cứng), còn GÓC QUAY
 * mới là chỗ trễ nhiều (lò xo mềm) — chính độ trễ của góc tạo ra cảm giác
 * quả cầu đang lượn theo tay, mà không dời điểm bấm đi đâu cả.
 *
 * Góc chỉ đổi khi đi đủ nhanh. Rê chậm vài pixel thì hướng tính ra nhiễu
 * loạn, quả cầu sẽ quay tít tại chỗ.
 *
 * TẮT HẲN trên màn hình cảm ứng (không có con trỏ thì không có gì để
 * thay) và khi máy bật "giảm chuyển động". Lúc tắt thì con trỏ thật vẫn
 * nguyên vẹn — lớp ẩn con trỏ chỉ gắn vào khi hiệu ứng thực sự chạy.
 */

/** Cỡ quả cầu, pixel. */
const CO = 26;

/** Dưới tốc độ này thì giữ nguyên góc cũ, khỏi quay loạn. */
const TOC_DO_TOI_THIEU = 0.45;

/** Thẻ nào thì quả cầu nở thành vòng tròn. */
const CHON_BAM = 'a, button, [role="button"], input, textarea, select, summary';

export function ConTroCau() {
  const [bat, setBat] = React.useState(false);
  const [tren, setTren] = React.useState(false);
  const [hien, setHien] = React.useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const goc = useMotionValue(0);

  const mx = useSpring(x, { stiffness: 700, damping: 40, mass: 0.35 });
  const my = useSpring(y, { stiffness: 700, damping: 40, mass: 0.35 });
  const mgoc = useSpring(goc, { stiffness: 120, damping: 16, mass: 0.7 });

  // Nở thành vòng khi ở trên thứ bấm được: quả cầu mờ đi, vòng hiện ra.
  // Một giá trị lo cả cỡ lẫn độ mờ: quả cầu co lại thì cũng nhạt đi, và
  // vòng tròn nở ra thì cũng đậm lên. Tách làm hai chỉ tốn thêm lò xo mà
  // hai đường cong vẫn phải trùng nhau.
  const coCau = useSpring(1, { stiffness: 420, damping: 30 });
  const coVong = useSpring(0, { stiffness: 420, damping: 30 });

  React.useEffect(() => {
    const min = window.matchMedia("(pointer: fine)");
    const lang = window.matchMedia("(prefers-reduced-motion: reduce)");
    const xet = () => setBat(min.matches && !lang.matches);
    xet();
    min.addEventListener("change", xet);
    lang.addEventListener("change", xet);
    return () => {
      min.removeEventListener("change", xet);
      lang.removeEventListener("change", xet);
    };
  }, []);

  React.useEffect(() => {
    if (!bat) return;

    document.documentElement.classList.add("con-tro-cau");

    let truocX: number | null = null;
    let truocY: number | null = null;

    const diChuyen = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHien(true);

      if (truocX !== null && truocY !== null) {
        const dx = e.clientX - truocX;
        const dy = e.clientY - truocY;
        if (Math.hypot(dx, dy) > TOC_DO_TOI_THIEU) {
          // Đế bần vẽ ở phía DƯỚI hình, nên góc 0 là đi xuống; trừ 90 để
          // quy về hướng thật của véc-tơ di chuyển.
          const moi = (Math.atan2(dy, dx) * 180) / Math.PI - 90;

          // Cộng dồn theo vòng gần nhất. Không làm bước này thì lúc đi
          // qua mốc ±180 độ con số nhảy một vòng tròn, và lò xo sẽ quay
          // nguyên 360 độ để đuổi theo.
          const cu = goc.get();
          goc.set(cu + (((moi - cu) % 360) + 540) % 360 - 180);
        }
      }
      truocX = e.clientX;
      truocY = e.clientY;

      const duoi = document.elementFromPoint(e.clientX, e.clientY);
      setTren(Boolean(duoi?.closest(CHON_BAM)));
    };

    const roiTrang = () => setHien(false);

    window.addEventListener("pointermove", diChuyen, { passive: true });
    document.addEventListener("pointerleave", roiTrang);

    return () => {
      document.documentElement.classList.remove("con-tro-cau");
      window.removeEventListener("pointermove", diChuyen);
      document.removeEventListener("pointerleave", roiTrang);
    };
  }, [bat, goc, x, y]);

  React.useEffect(() => {
    coCau.set(tren ? 0 : 1);
    coVong.set(tren ? 1 : 0);
  }, [tren, coCau, coVong]);

  if (!bat) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[80] will-change-transform"
      style={{
        x: mx,
        y: my,
        opacity: hien ? 1 : 0,
        transition: "opacity 200ms ease-out",
      }}
    >
      {/* Vòng tròn khi ở trên thứ bấm được */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{
          width: 40,
          height: 40,
          marginLeft: -20,
          marginTop: -20,
          borderColor: "#855c12",
          scale: coVong,
          opacity: coVong,
        }}
      />

      {/* Quả cầu, đế bần hướng theo chiều đi */}
      <motion.svg
        width={CO}
        height={CO}
        viewBox="0 0 40 40"
        className="absolute"
        style={{
          marginLeft: -CO / 2,
          // Đế bần nằm ở 28/40 chiều cao, kéo lên cho đế trùng đúng
          // điểm bấm thật — nếu lấy tâm hình thì điểm bấm rơi vào giữa
          // váy lông, lệch xuống mấy pixel so với chỗ người ta nhắm.
          marginTop: (-CO * 28) / 40,
          rotate: mgoc,
          scale: coCau,
          opacity: coCau,
          transformOrigin: `${CO / 2}px ${(CO * 28) / 40}px`,
        }}
      >
        <path
          d="M 13 24 L 6 6 Q 20 1 34 6 L 27 24 Z"
          fill="#ffffff"
          stroke="#001a4a"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path
          d="M 20 23 L 20 3 M 16 23 L 12 4.5 M 24 23 L 28 4.5"
          stroke="#001a4a"
          strokeWidth={1.1}
          opacity={0.4}
        />
        <circle
          cx={20}
          cy={28}
          r={10.5}
          fill="#dcae42"
          stroke="#001a4a"
          strokeWidth={1.6}
        />
      </motion.svg>
    </motion.div>
  );
}
