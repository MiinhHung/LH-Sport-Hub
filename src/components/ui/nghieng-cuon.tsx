"use client";

import { motion, motionValue, useSpring, useTransform } from "motion/react";
import * as React from "react";

/**
 * Khối chữ hơi xiên đi khi trang đang cuộn nhanh, rồi bật thẳng lại khi
 * dừng — như thể nó có quán tính.
 *
 * NGHIÊNG (skew) CHỨ KHÔNG PHẢI DỜI CHỖ. Dời chỗ theo tốc độ cuộn thì
 * khối chữ rời khỏi vị trí thật của nó, và người đang cuộn để tìm một
 * đoạn sẽ thấy đoạn đó trượt đi mất. Nghiêng thì tâm khối đứng yên, chỉ
 * hai mép trên dưới lệch nhau vài độ — đủ để cảm thấy, không đủ để lạc.
 *
 * ĐO TỐC ĐỘ THEO KHUNG HÌNH, KHÔNG THEO SỰ KIỆN `scroll`. Mất hai lần
 * sai mới ra chỗ này:
 *
 *   1. `useVelocity(scrollY)` — đo ra khối chữ KẸT NGHIÊNG 2,2 độ sau
 *      khi cuộn xong. Hàm đó chỉ tính lại mỗi khi nguồn đổi; thanh cuộn
 *      đứng im thì con số cuối nằm lại đó.
 *   2. Tự tính trong trình xử lý sự kiện `scroll` — đo ra tốc độ chỉ
 *      35px/s trong khi trang đang lao 1.400px/s. Vì trang này đặt
 *      `scroll-behavior: smooth`: trình duyệt tự nội suy quãng cuộn qua
 *      nhiều khung hình, còn sự kiện `scroll` thì bắn thưa và lệch nhịp,
 *      mỗi lần chỉ báo được một hai pixel.
 *
 * Lấy mẫu mỗi khung hình thì bắt đúng đường nội suy đó, và tự khắc về 0
 * khi hết cuộn vì hiệu số bằng 0 — không cần hẹn giờ, không có giá trị
 * nào kẹt lại.
 *
 * MỘT VÒNG rAF CHO CẢ TRANG, dùng chung qua một giá trị ở tầng mô-đun.
 * Mỗi khối một vòng riêng thì cùng đọc một con số `window.scrollY` mấy
 * lần một khung hình, chẳng để làm gì. Vòng này tự ngủ khi thẻ bị ẩn, vì
 * trình duyệt không chạy rAF cho thẻ nền.
 *
 * NGƯỠNG TRÊN PHẢI CÓ, VÀ PHẢI KẸP. Cuộn bằng con lăn cho ra vài nghìn
 * pixel mỗi giây, còn kéo thanh cuộn hay bấm Home thì ra hàng chục nghìn.
 * Không kẹp thì cú nhảy đó biến cả khối thành một vệt nằm ngang.
 *
 * Dấu trừ trong dải đích là cố ý: cuộn XUỐNG (tốc độ dương) thì nội dung
 * đi LÊN, nên mép trên phải bị bỏ lại phía sau.
 *
 * Máy bật "giảm chuyển động" thì ÉP BIÊN ĐỘ VỀ 0 chứ không đổi nguồn của
 * lò xo — `useSpring` bám vào nguồn ngay lần dựng đầu tiên, mà lần đó
 * chưa đọc matchMedia nên chưa dám đoán; đổi nguồn sau đó thì lò xo
 * không rời khỏi cái cũ nữa.
 */

/** Tốc độ cuộn (px/s) ứng với độ nghiêng tối đa. */
const TOC_DO_TOI_DA = 2200;

/** Tốc độ cuộn hiện thời, px/s. Dùng chung cho mọi khối trên trang. */
const tocDoChung = motionValue(0);

let soKhoi = 0;
let vongRaf = 0;

function gopVong() {
  soKhoi += 1;
  if (soKhoi > 1) return;

  let truocY = window.scrollY;
  let truocT = performance.now();

  const buoc = () => {
    const y = window.scrollY;
    const t = performance.now();
    const dt = t - truocT;
    if (dt > 0) tocDoChung.set(((y - truocY) / dt) * 1000);
    truocY = y;
    truocT = t;
    vongRaf = requestAnimationFrame(buoc);
  };
  vongRaf = requestAnimationFrame(buoc);
}

function boVong() {
  soKhoi -= 1;
  if (soKhoi > 0) return;
  cancelAnimationFrame(vongRaf);
  tocDoChung.set(0);
}

export function NghiengCuon({
  children,
  className,
  /** Độ nghiêng tối đa, tính bằng độ. */
  toiDa = 2.2,
}: {
  children: React.ReactNode;
  className?: string;
  toiDa?: number;
}) {
  const [chay, setChay] = React.useState(false);

  React.useEffect(() => {
    const lang = window.matchMedia("(prefers-reduced-motion: reduce)");
    const xet = () => setChay(!lang.matches);
    xet();
    lang.addEventListener("change", xet);
    return () => lang.removeEventListener("change", xet);
  }, []);

  React.useEffect(() => {
    gopVong();
    return boVong;
  }, []);

  // Làm mượt trước khi đổi sang góc. Tốc độ thô nhảy rất gắt giữa hai
  // khung hình, đưa thẳng vào transform thì thành rung chứ không thành
  // nghiêng.
  const muot = useSpring(tocDoChung, {
    stiffness: 260,
    damping: 42,
    mass: 0.6,
  });

  const bienDo = chay ? toiDa : 0;
  const nghieng = useTransform(
    muot,
    [-TOC_DO_TOI_DA, 0, TOC_DO_TOI_DA],
    [bienDo, 0, -bienDo],
    { clamp: true },
  );

  return (
    <motion.div
      className={className}
      style={{ skewY: nghieng, transformOrigin: "center center" }}
    >
      {children}
    </motion.div>
  );
}
