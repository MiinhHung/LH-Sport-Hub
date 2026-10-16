"use client";

import Image from "next/image";
import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { TeamSignaturesLayer } from "./team-signatures";
import { useCalm } from "./use-calm";

export function HeroVisual() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // Giảm chuyển động: bỏ hẳn hiệu ứng nghiêng theo chuột.
  const calm = useCalm();

  // Parallax 3D góc nhìn chuột nhẹ nhàng
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 40, mass: 1.1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [-1, 1], [6, -6]);
  const rotateY = useTransform(smoothMouseX, [-1, 1], [-6, 6]);

  // Quả cầu đi theo chuột: lò xo riêng, MỀM VÀ NẶNG, giảm chấn gần tới hạn
  // (ζ ≈ 1,05) — cầu trôi chậm theo con trỏ, chừng một giây mới tới, rồi
  // dừng êm không rung lắc. Biên độ tính theo % khung nên màn nào cũng
  // vừa, không văng ra khỏi chữ ký.
  const LO_XO_CAU = { stiffness: 18, damping: 10.5, mass: 1.4 };
  const cauX = useSpring(mouseX, LO_XO_CAU);
  const cauY = useSpring(mouseY, LO_XO_CAU);
  const shuttleX = useTransform(cauX, [-1, 1], ["-14%", "14%"]);
  const shuttleY = useTransform(cauY, [-1, 1], ["-10%", "10%"]);
  const shuttleRotate = useTransform(cauX, [-1, 1], [-6, 6]);

  // Nghe chuột trên cả cửa sổ chứ không chỉ trong khung, để rê ở phần chữ
  // bên trái hero cầu vẫn nhìn theo. Chỉ chuột thật: chạm trên điện thoại
  // không kéo cầu lệch rồi bỏ đó.
  React.useEffect(() => {
    if (calm) return;
    const theoChuot = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !containerRef.current) return;
      // Màn mở đầu còn chạy: đứng yên, để quả cầu bay đáp trúng chỗ đã đo.
      const h = document.documentElement;
      if (
        h.getAttribute("data-intro") === "play" &&
        !h.hasAttribute("data-intro-done") &&
        !h.hasAttribute("data-intro-skip")
      ) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      mouseX.set(Math.max(-1, Math.min(1, nx)));
      mouseY.set(Math.max(-1, Math.min(1, ny)));
    };
    const veGiua = () => {
      mouseX.set(0);
      mouseY.set(0);
    };
    window.addEventListener("pointermove", theoChuot, { passive: true });
    document.documentElement.addEventListener("pointerleave", veGiua);
    return () => {
      window.removeEventListener("pointermove", theoChuot);
      document.documentElement.removeEventListener("pointerleave", veGiua);
    };
  }, [calm, mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square w-full max-w-[420px] select-none sm:max-w-[540px] lg:col-span-6 lg:max-w-[680px] xl:max-w-[740px]"
      role="img"
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
         * Chữ ký viết tay của 16 thành viên (danh sách ở TEAM_MEMBERS)
         * rải rác tự nhiên quanh quả cầu và mặt lưới, có hiệu ứng vẽ nét bút và tooltip kỷ niệm
         */}
        <TeamSignaturesLayer />

        {/* ================= 3. QUẢ CẦU VÀNG Y NGUYÊN BẢN (PHÓNG TO HƠN) ================= */}
        {/*
         * `data-hero-shuttle`: đích của quả cầu trong màn mở đầu.
         * IntroOverlay đo thẳng hộp của thẻ <img> bên dưới (đã gồm dịch trái
         * và phóng to theo từng cỡ màn hình), nên đổi các lớp translate/scale
         * ở đây thoải mái, quả cầu bay vẫn đáp trùng khít.
         */}
        <div
          className="hero-in hero-media hero-shuttle absolute inset-[2%] pointer-events-none z-10"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <motion.div
            style={{ x: shuttleX, y: shuttleY, rotate: shuttleRotate }}
            className="relative size-full"
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
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
