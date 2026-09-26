"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import * as React from "react";

/**
 * Nút hút con trỏ: tới gần thì nút nhích về phía con trỏ, rời ra thì bật
 * về chỗ cũ.
 *
 * VÙNG HÚT TÍNH TỪ MÉP NÚT, KHÔNG PHẢI TỪ TÂM.
 *
 * Cách hay gặp là lấy khoảng cách tới tâm rồi so với một bán kính cố
 * định. Nhưng nút ở đây dài ngắn rất khác nhau — "Đăng nhập" và "Có gì
 * trong này" chênh nhau gần gấp đôi. Lấy tâm thì nút dài bắt đầu hút khi
 * con trỏ hãy còn nằm TRÊN chính nó, còn nút ngắn thì phải tới sát mới
 * hút. Tính từ mép thì mọi nút có cùng một quầng hút rộng bằng nhau.
 *
 * ĐỘ DỜI CŨNG KẸP THEO MÉP. Nút càng gần thì kéo càng mạnh, nhưng không
 * bao giờ quá `toiDa` pixel — nút trôi xa hơn thế thì con trỏ đuổi theo
 * lại làm nó trôi tiếp, thành ra rượt nhau.
 *
 * Nghe `pointermove` trên window chứ không phải trên nút: nghe trên nút
 * thì chỉ biết khi con trỏ đã nằm hẳn bên trong, mà lúc đó thì chẳng còn
 * gì để hút nữa.
 *
 * Tắt trên màn hình cảm ứng và khi máy bật "giảm chuyển động".
 */

/** Quầng hút, đo từ mép nút ra, tính bằng pixel. */
const QUANG = 90;

export function NamCham({
  children,
  className,
  /** Nút dời xa nhất bao nhiêu pixel. */
  toiDa = 9,
}: {
  children: React.ReactNode;
  className?: string;
  toiDa?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [bat, setBat] = React.useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.5 });
  const my = useSpring(y, { stiffness: 220, damping: 18, mass: 0.5 });

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

    const theoDoi = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const o = el.getBoundingClientRect();

      // Khoảng cách tới MÉP: nằm trong nút thì bằng 0 ở trục đó.
      const ngangNgoai = Math.max(o.left - e.clientX, e.clientX - o.right, 0);
      const docNgoai = Math.max(o.top - e.clientY, e.clientY - o.bottom, 0);
      const xa = Math.hypot(ngangNgoai, docNgoai);

      if (xa > QUANG) {
        x.set(0);
        y.set(0);
        return;
      }

      const manh = 1 - xa / QUANG;
      const tamX = o.left + o.width / 2;
      const tamY = o.top + o.height / 2;
      const dx = e.clientX - tamX;
      const dy = e.clientY - tamY;
      const dai = Math.hypot(dx, dy) || 1;
      const buoc = Math.min(dai, toiDa) * manh;

      x.set((dx / dai) * buoc);
      y.set((dy / dai) * buoc);
    };

    window.addEventListener("pointermove", theoDoi, { passive: true });
    return () => window.removeEventListener("pointermove", theoDoi);
  }, [bat, toiDa, x, y]);

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className ?? ""}`}
      style={bat ? { x: mx, y: my } : undefined}
    >
      {children}
    </motion.span>
  );
}
