"use client";

import * as React from "react";

/**
 * Màn mở đầu: quả cầu rơi xuống, khoá thương hiệu hiện ra, rồi cả tấm màn
 * kéo lên để lộ trang.
 *
 * KHÔNG DỰNG THÊM MỘT CẢNH 3D NỮA. Hero đã có một canvas WebGL với vật
 * liệu khúc xạ — thứ đắt nhất trên trang. Thêm canvas thứ hai chạy cùng
 * lúc, đúng vào lúc trang đang tải, là cách chắc chắn nhất để máy yếu khựng
 * ngay giây đầu. Ở đây chỉ là SVG với animation CSS: chạy trên compositor,
 * không tốn một lời gọi vẽ nào.
 *
 * Chạy mỗi lần dựng component, nghĩa là mỗi lần tải lại trang hoặc bấm vào
 * logo để về trang chủ. Đó là chủ ý.
 *
 * BA ĐƯỜNG THOÁT, vì một tấm màn che kín màn hình mà kẹt lại thì coi như
 * hỏng cả trang:
 *
 *   1. Tự tắt sau khi chạy xong.
 *   2. Bấm, gõ phím hay cuộn là tắt ngay.
 *   3. Ai bật "giảm chuyển động" thì không hiện màn nào cả.
 */

const TOTAL_MS = 2100;

export function IntroCurtain() {
  // Bắt đầu ở trạng thái TẮT. Máy chủ dựng ra HTML không có tấm màn, nên
  // người không chạy JavaScript vẫn đọc được trang ngay.
  const [phase, setPhase] = React.useState<"off" | "playing" | "lifting">(
    "off",
  );

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setPhase("playing");
    // Khoá cuộn trong lúc màn còn che, nếu không người dùng cuộn mù.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let lift = 0;
    let done = 0;

    const finish = () => {
      setPhase("lifting");
      done = window.setTimeout(() => {
        setPhase("off");
        document.body.style.overflow = prevOverflow;
      }, 700);
    };

    lift = window.setTimeout(finish, TOTAL_MS);

    const skip = () => {
      window.clearTimeout(lift);
      finish();
    };
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });

    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(done);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (phase === "off") return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] grid place-items-center bg-[#00112e]"
      style={{
        transform: phase === "lifting" ? "translateY(-100%)" : "none",
        transition:
          phase === "lifting"
            ? "transform 700ms cubic-bezier(0.76,0,0.24,1)"
            : undefined,
      }}
    >
      <div className="flex flex-col items-center">
        <FallingShuttle />

        <div className="mt-8 overflow-hidden">
          <p
            className="text-[10px] font-semibold tracking-[0.36em] text-gold-300 uppercase"
            style={{ animation: "intro-rise 620ms 560ms both ease-out" }}
          >
            Light Human
          </p>
        </div>
        <div className="mt-2 overflow-hidden">
          <p
            className="font-display text-[30px] leading-none font-bold text-[#f2ede3] sm:text-[40px]"
            style={{ animation: "intro-rise 620ms 700ms both ease-out" }}
          >
            Sport Hub
          </p>
        </div>

        {/* Vạch kẻ chạy hết chiều dài đúng lúc màn sắp kéo lên */}
        <span
          className="mt-8 block h-px w-28 origin-left bg-gold-400/60"
          style={{ animation: "intro-line 1200ms 820ms both ease-out" }}
        />
      </div>
    </div>
  );
}

/** Quả cầu rơi từ trên xuống rồi nảy nhẹ một cái. */
function FallingShuttle() {
  return (
    <svg
      width="92"
      height="92"
      viewBox="-16 -18 32 34"
      style={{ animation: "intro-drop 900ms 120ms both cubic-bezier(0.5,0,0.2,1)" }}
    >
      {/* Váy lông */}
      <path
        d="M -3 2 L -9.5 -12 A 9.5 3.2 0 0 0 9.5 -12 L 3 2 Z"
        fill="#dcae42"
        fillOpacity={0.24}
        stroke="#e8c56a"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <g stroke="#e8c56a" strokeWidth={0.8} opacity={0.7}>
        <line x1={-1.6} y1={2} x2={-5} y2={-12} />
        <line x1={0} y1={2} x2={0} y2={-12.6} />
        <line x1={1.6} y1={2} x2={5} y2={-12} />
      </g>
      {/* Đế bần */}
      <circle cx={0} cy={5.4} r={4.8} fill="#dcae42" />
    </svg>
  );
}
