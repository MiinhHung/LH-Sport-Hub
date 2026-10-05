"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import * as React from "react";

/**
 * Hai mẩu chuyển động cho bảng tỉ số. Cố ý chỉ có HAI.
 *
 * Trang này trước đây đứng im hoàn toàn trong khi trang danh sách kèo đã
 * có hiệu ứng trồi lên — vào xem chi tiết một trận lại thấy tĩnh hơn lúc
 * đứng ngoài. Nhưng đây là trang người ta vào để ĐỌC kết quả, nên thêm
 * chuyển động phải trả lời được "nó nói điều gì", không phải "trông cho
 * vui".
 *
 *   `VaoSan`  — hai đội trượt vào từ hai phía. Nói: đây là một cuộc đối
 *               đầu, hai bên từ hai hướng tiến vào.
 *   `SoTiSo`  — con số đếm lên. Nói: đây là kết quả, là cái đáng nhìn
 *               nhất trang, và nó vừa được chốt.
 *
 * Cả hai tắt sạch khi máy bật "giảm chuyển động".
 */

/** Một đội trượt vào từ phía của mình. */
export function VaoSan({
  phia,
  children,
  className,
}: {
  phia: "trai" | "phai";
  children: React.ReactNode;
  className?: string;
}) {
  const it = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={it ? false : { opacity: 0, x: phia === "trai" ? -18 : 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Con số đếm từ 0 lên tới điểm thật.
 *
 * GIÁ TRỊ THẬT NẰM SẴN TRONG HTML, không đợi JavaScript. Thẻ `<span>` do
 * máy chủ dựng ra đã mang đúng con số; hiệu ứng chỉ ghi đè nội dung đó
 * trong lúc chạy. Ai tắt JavaScript, hay máy đọc màn hình, vẫn nhận đúng
 * tỉ số — chứ không phải một ô trống rồi mới có số.
 */
export function SoTiSo({ diem }: { diem: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const it = useReducedMotion();

  React.useEffect(() => {
    if (it) return;
    const el = ref.current;
    if (!el) return;

    const thoi = mv.on("change", (v) => {
      el.textContent = String(Math.round(v));
    });
    const chay = animate(mv, diem, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    });

    return () => {
      thoi();
      chay.stop();
      // Trả lại giá trị đúng phòng khi bị ngắt giữa chừng.
      if (el) el.textContent = String(diem);
    };
  }, [diem, it, mv]);

  return <span ref={ref}>{diem}</span>;
}
