"use client";

import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import * as React from "react";

/**
 * Hai mảnh tương tác của khối "Không gian thư giãn" ở trang chủ.
 * Tách ra file client riêng để trang chủ vẫn là server component.
 */

/* ------------------------------------------------------------------ */
/* Con số đếm lên                                                       */
/* ------------------------------------------------------------------ */

/**
 * Số liệu đếm từ 0 lên đúng giá trị khi cuộn tới (một lần). Rê chuột thì
 * cả khối nhô lên, số chuyển vàng, gạch chân vàng dài ra.
 *
 * Máy chủ dựng sẵn ĐÚNG con số thật: không có JavaScript, hoặc bật giảm
 * chuyển động, thì vẫn đọc được số, chỉ không có đoạn đếm.
 */
export function SoLieuDem({
  items,
}: {
  items: { value: number; label: string }[];
}) {
  return (
    <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
      {items.map((s, i) => (
        <MotSo key={s.label} value={s.value} label={s.label} thuTu={i} />
      ))}
    </dl>
  );
}

function MotSo({
  value,
  label,
  thuTu,
}: {
  value: number;
  label: string;
  thuTu: number;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const daThay = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [hien, setHien] = React.useState(value);

  React.useEffect(() => {
    if (!daThay || reduce) return;
    const dk = animate(0, value, {
      duration: Math.min(1.6, 0.7 + value * 0.08),
      delay: thuTu * 0.12,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setHien(Math.round(v)),
    });
    return () => dk.stop();
  }, [daThay, reduce, value, thuTu]);

  return (
    <div className="group flex cursor-default flex-col-reverse transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:hover:translate-y-0">
      <dt className="mt-2 text-[14px] font-medium text-ink-400 transition-colors duration-300 group-hover:text-ink-200">
        {label}
        <span
          aria-hidden
          className="mt-1.5 block h-0.5 w-5 rounded-full bg-gold-400 transition-[width] duration-500 ease-out group-hover:w-full"
        />
      </dt>
      <dd
        ref={ref}
        className="font-sport text-[44px] leading-none font-extrabold text-navy-900 tabular-nums transition-colors duration-300 group-hover:text-gold-700"
      >
        {/* Trình đọc màn hình nghe con số thật, không nghe đoạn đếm. */}
        <span aria-hidden>{hien}</span>
        <span className="sr-only">{value}</span>
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ảnh nghiêng theo chuột                                               */
/* ------------------------------------------------------------------ */

/**
 * Ảnh nghiêng 3D theo con trỏ, phóng nhẹ, có vệt sáng đi theo chuột; phía
 * sau là một khung viền vàng lệch, trượt ngược hướng để tạo chiều sâu.
 *
 * Chỉ chạy với chuột thật: trên cảm ứng "rê" là một cú chạm, nghiêng rồi
 * kẹt nguyên đó trông như lỗi. Giảm chuyển động thì đứng yên.
 */
export function AnhNghieng({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const reduce = useReducedMotion();
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const lo = { stiffness: 120, damping: 20, mass: 0.6 };
  const sx = useSpring(nx, lo);
  const sy = useSpring(ny, lo);

  const rotateY = useTransform(sx, [-1, 1], [-7, 7]);
  const rotateX = useTransform(sy, [-1, 1], [6, -6]);
  // Khung vàng phía sau trượt ngược hướng nghiêng.
  const khungX = useTransform(sx, [-1, 1], [14, 26]);
  const khungY = useTransform(sy, [-1, 1], [14, 26]);
  // Vệt sáng theo con trỏ, toạ độ phần trăm trên mặt ảnh.
  const sangX = useTransform(sx, [-1, 1], [0, 100]);
  const sangY = useTransform(sy, [-1, 1], [0, 100]);
  const nenSang = useMotionTemplate`radial-gradient(420px circle at ${sangX}% ${sangY}%, rgba(255,240,200,0.32), transparent 60%)`;

  const [dangRe, setDangRe] = React.useState(false);

  const theoChuot = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    nx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    ny.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const roiDi = () => {
    nx.set(0);
    ny.set(0);
    setDangRe(false);
  };

  return (
    <div className="relative" style={{ perspective: 1200 }}>
      {/* Khung viền vàng lệch phía sau */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl border-2 border-gold-400/70"
        style={reduce ? { x: 18, y: 18 } : { x: khungX, y: khungY }}
      />

      <motion.div
        onPointerEnter={(e) => e.pointerType === "mouse" && setDangRe(true)}
        onPointerMove={theoChuot}
        onPointerLeave={roiDi}
        style={reduce ? undefined : { rotateX, rotateY }}
        className="group relative aspect-[1024/666] overflow-hidden rounded-2xl bg-ink-850 shadow-[0_30px_60px_-30px_rgba(0,26,74,0.45)] transition-shadow duration-500 hover:shadow-[0_40px_80px_-30px_rgba(0,26,74,0.6)]"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 700px"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {/* Vệt sáng đi theo chuột */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{ background: nenSang, opacity: dangRe ? 1 : 0 }}
          />
        )}
        {/* Viền sáng mảnh bên trong, hiện khi rê */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/0 transition-[box-shadow] duration-500 ring-inset group-hover:ring-white/25"
        />
      </motion.div>
    </div>
  );
}
