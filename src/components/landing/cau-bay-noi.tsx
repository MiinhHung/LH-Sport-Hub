"use client";

import { motion, useScroll, useTransform } from "motion/react";
import * as React from "react";

/**
 * Một quả cầu bay vòng cung ngang qua nền, nối phần trên với phần dưới.
 *
 * Chuyển động BÁM THEO THANH CUỘN chứ không tự chạy: cuộn tới đâu cầu bay
 * tới đó, cuộn ngược thì cầu bay ngược. Một quả cầu tự bay theo đồng hồ sẽ
 * đi mất trước khi người đọc kịp cuộn tới, và cuộn lên xem lại thì không
 * còn gì.
 *
 * ĐƯỜNG BAY DỰNG BẰNG TOẠ ĐỘ PIXEL, KHÔNG PHẢI PHẦN TRĂM.
 *
 * Đặt ngang bằng phần trăm thì gọn hơn, nhưng góc quay lại cần cả hai trục
 * cùng một đơn vị — không thì trên màn rộng quả cầu sẽ chúi mũi sai hẳn so
 * với hướng nó đang thực sự đi. Nên đo bề ngang thật rồi tính toàn bộ bằng
 * pixel; chưa đo được thì chưa vẽ gì.
 *
 * Đế bần đi trước, như mọi quả cầu khác trên trang này: góc quay lấy từ
 * tiếp tuyến của đường cong rồi trừ 90 độ, vì đế được vẽ ở phía dưới hình.
 *
 * Là hình trang trí thuần tuý nên `aria-hidden`, và máy bật "giảm chuyển
 * động" thì không dựng gì cả.
 */

/** Cỡ quả cầu, pixel. */
const CO = 30;

/** Chừa hai mép để quả cầu bay vào và bay ra khỏi khung, không đứng hẳn. */
const LE = 0.06;

export function CauBayNoi({
  /** Đỉnh vòng cung cao bao nhiêu pixel so với hai đầu. */
  cao = 120,
  /** Bay từ trái sang phải, hay ngược lại. */
  nguoc = false,
  className,
}: {
  cao?: number;
  nguoc?: boolean;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [rong, setRong] = React.useState(0);
  const [chay, setChay] = React.useState(false);

  React.useEffect(() => {
    const lang = window.matchMedia("(prefers-reduced-motion: reduce)");
    const xet = () => setChay(!lang.matches);
    xet();
    lang.addEventListener("change", xet);
    return () => lang.removeEventListener("change", xet);
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setRong(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Bậc hai Bézier: hai đầu nằm ngang, đỉnh ở giữa. Điểm điều khiển phải
  // cao GẤP ĐÔI độ cao mong muốn, vì đường cong chỉ đi được nửa đường tới
  // điểm điều khiển.
  const x0 = rong * LE;
  const x2 = rong * (1 - LE);
  const p0 = nguoc ? x2 : x0;
  const p2 = nguoc ? x0 : x2;
  const p1 = (x0 + x2) / 2;
  const q1 = -cao * 2;

  const tai = React.useCallback(
    (t: number) => {
      const u = 1 - t;
      return {
        x: u * u * p0 + 2 * u * t * p1 + t * t * p2,
        y: 2 * u * t * q1,
        dx: 2 * u * (p1 - p0) + 2 * t * (p2 - p1),
        dy: 2 * u * q1 - 2 * t * q1,
      };
    },
    [p0, p1, p2, q1],
  );

  const x = useTransform(scrollYProgress, (t) => tai(t).x - CO / 2);
  const y = useTransform(scrollYProgress, (t) => tai(t).y - (CO * 28) / 40);
  const goc = useTransform(scrollYProgress, (t) => {
    const { dx, dy } = tai(t);
    return (Math.atan2(dy, dx) * 180) / Math.PI - 90;
  });
  // Mờ ở hai đầu để cầu không hiện ra rồi biến mất đột ngột.
  const mo = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);

  return (
    <div ref={ref} className={`relative h-0 ${className ?? ""}`} aria-hidden>
      {chay && rong > 0 && (
        <motion.svg
          width={CO}
          height={CO}
          viewBox="0 0 40 40"
          className="pointer-events-none absolute top-0 left-0"
          style={{ x, y, rotate: goc, opacity: mo }}
        >
          <path
            d="M 13 24 L 6 6 Q 20 1 34 6 L 27 24 Z"
            fill="#ffffff"
            stroke="#001a4a"
            strokeWidth={1.8}
            strokeLinejoin="round"
            opacity={0.85}
          />
          <path
            d="M 20 23 L 20 3 M 16 23 L 12 4.5 M 24 23 L 28 4.5"
            stroke="#001a4a"
            strokeWidth={1.1}
            opacity={0.3}
          />
          <circle
            cx={20}
            cy={28}
            r={10.5}
            fill="#dcae42"
            stroke="#001a4a"
            strokeWidth={1.6}
            opacity={0.9}
          />
        </motion.svg>
      )}
    </div>
  );
}
