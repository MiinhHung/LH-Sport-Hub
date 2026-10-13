"use client";

import Image from "next/image";
import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { TeamSignaturesLayer } from "./team-signatures";

export function HeroVisual() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parallax 3D góc nhìn chuột nhẹ nhàng
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 26, stiffness: 90 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [-1, 1], [6, -6]);
  const rotateY = useTransform(smoothMouseX, [-1, 1], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseX.set(Math.max(-1, Math.min(1, nx)));
    mouseY.set(Math.max(-1, Math.min(1, ny)));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto aspect-square w-full max-w-[420px] select-none sm:max-w-[540px] lg:col-span-6 lg:max-w-[680px] xl:max-w-[740px]"
      aria-label="Quả cầu vàng và chữ ký kỷ niệm các thành viên team Light Human"
      style={{ perspective: 1200 }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="relative size-full"
      >
        {/* ================= 1. QUẦNG SÁNG VÀNG KIM TRUNG TÂM ================= */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 size-[340px] sm:size-[440px] rounded-full bg-[radial-gradient(circle,rgba(245,192,66,0.20)_0%,rgba(245,192,66,0.06)_45%,transparent_75%)] blur-3xl"
          style={{ left: "58.55%", top: "50.09%" }}
        />

        {/* ================= 2. LỚP CHỮ KÝ KỶ NIỆM CÁC THÀNH VIÊN TRÊN MẶT LƯỚI ================= */}
        {/*
         * Chữ ký viết tay của Bảo, Phúc, Hùng, Trượng, Trâm, Minh, Nhi, Thư, Khuyết...
         * rải rác tự nhiên quanh quả cầu và mặt lưới, có hiệu ứng vẽ nét bút và tooltip kỷ niệm
         */}
        <TeamSignaturesLayer />

        {/* ================= 3. QUẢ CẦU VÀNG Y NGUYÊN BẢN (PHÓNG TO HƠN) ================= */}
        {/*
         * `data-hero-shuttle`: đích của quả cầu trong màn mở đầu.
         * Giữ nguyên cấu trúc `inset-[2%]` và `-translate-x-[13%]` để IntroOverlay
         * đo đạc và đáp xuống trùng khít 100%, đồng thời phóng to thêm 15-20%
         * giúp quả cầu nổi bật, uy nghi và sắc nét.
         */}
        <div
          className="hero-in hero-media hero-shuttle absolute inset-[2%] pointer-events-none z-10"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <div data-hero-shuttle className="hero-float relative size-full">
            <Image
              src="/images/landing/shuttlecock-gold.png"
              alt="Quả cầu lông vàng, biểu tượng thi đấu của LH Sport Hub"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 760px"
              className="-translate-x-[12%] scale-110 sm:scale-115 lg:scale-120 object-contain drop-shadow-[0_32px_60px_rgba(0,0,0,0.7)]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
