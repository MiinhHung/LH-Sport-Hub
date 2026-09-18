"use client";

import * as React from "react";

/**
 * Dấu hiệu mời cuộn, đặt ở khoảng trống cuối hero.
 *
 * Không phải để lấp chỗ. Khoảnh khắc đáng xem nhất của trang là vệt quét
 * chuyển cảnh, mà nó nằm dưới màn hình đầu tiên — ai mở lên rồi bấm luôn
 * "Vào bảng tin" sẽ không bao giờ thấy. Cái này nói cho họ biết còn nữa.
 *
 * Dùng quả cầu tí hon chứ không phải mũi tên: cả trang đã kể chuyện bằng
 * quả cầu rồi, thêm một biểu tượng chung chung là lạc giọng.
 *
 * Mờ đi khi bắt đầu cuộn — nó đã làm xong việc, để lại thì thành thừa.
 */
export function ScrollCue() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      // Mờ hết sau khi cuộn được nửa màn hình.
      const p = Math.min(1, window.scrollY / (window.innerHeight * 0.5));
      el.style.opacity = `${1 - p}`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none flex flex-col items-center gap-2.5"
    >
      <svg
        width="18"
        height="18"
        viewBox="-16 -16 32 32"
        style={{ animation: "cue-bob 2.4s ease-in-out infinite" }}
      >
        <path
          d="M -3 2 L -9 -11 A 9 3 0 0 0 9 -11 L 3 2 Z"
          fill="#dcae42"
          fillOpacity={0.28}
          stroke="#dcae42"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <circle cx={0} cy={5} r={4.4} fill="#dcae42" />
      </svg>

      {/* Vạch mảnh có một vệt sáng chạy xuống, lặp lại */}
      <span className="relative block h-9 w-px overflow-hidden bg-[#f2ede3]/15">
        <span
          className="absolute inset-x-0 h-3 bg-[#dcae42]"
          style={{ animation: "cue-run 2.4s ease-in-out infinite" }}
        />
      </span>
    </div>
  );
}
