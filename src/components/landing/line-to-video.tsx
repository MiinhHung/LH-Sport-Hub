"use client";

import * as React from "react";

/**
 * Đoạn nối từ đuôi đường dây của dải kể chuyện xuống khối video.
 *
 * Đường chính kết thúc ở ĐÁY khối đó, đúng giữa bề ngang. Đoạn này bắt đầu
 * cũng ở giữa, đi thẳng xuống rồi kết bằng một chấm ngay mép trên video.
 * Hai nét khớp nhau vì cùng một toạ độ ngang và khối trên không còn lề
 * dưới — hở một khoảng là mắt thấy ngay thành hai nét rời.
 *
 * Tự vẽ theo cuộn bằng đúng mẹo của đường chính: nét đứt dài bằng chính nó,
 * rồi đẩy `stroke-dashoffset` từ full về 0.
 *
 * Khung nhìn đặt bằng số pixel thật chứ không phải 0–100 + kéo méo, để
 * `getTotalLength()` và `stroke-dasharray` cùng một hệ đơn vị — lý do đầy
 * đủ nằm ở chú thích của `JourneyLine`.
 */

const HEIGHT = 132;

export function LineToVideo() {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const dotRef = React.useRef<SVGCircleElement>(null);
  const [w, setW] = React.useState(0);

  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setW(Math.round(e.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    const path = pathRef.current;
    const box = boxRef.current;
    if (!path || !box || !w) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    const paint = (p: number) => {
      path.style.strokeDashoffset = `${length * (1 - p)}`;
      if (dotRef.current) dotRef.current.style.opacity = p > 0.96 ? "1" : "0";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = box.getBoundingClientRect();
      const vh = window.innerHeight;
      // Vẽ trong quãng đoạn nối đi từ 85% chiều cao màn hình lên tới 45%.
      const from = vh * 0.85;
      const to = vh * 0.45;
      paint(Math.min(1, Math.max(0, (from - rect.top) / (from - to))));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [w]);

  const mid = w / 2;

  return (
    <div ref={boxRef} className="relative w-full" style={{ height: HEIGHT }}>
      {w > 0 && (
        <svg
          viewBox={`0 0 ${w} ${HEIGHT}`}
          width={w}
          height={HEIGHT}
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          {/* Nét mờ cho thấy trước quãng còn lại, giống đường chính */}
          <path
            d={`M ${mid} 0 L ${mid} ${HEIGHT - 10}`}
            fill="none"
            stroke="#001a4a"
            strokeOpacity={0.1}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            ref={pathRef}
            d={`M ${mid} 0 L ${mid} ${HEIGHT - 10}`}
            fill="none"
            stroke="#c8951a"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* Chấm kết, ngay mép trên video */}
          <circle
            ref={dotRef}
            cx={mid}
            cy={HEIGHT - 8}
            r={5}
            fill="#c8951a"
            style={{ opacity: 0, transition: "opacity 300ms ease-out" }}
          />
        </svg>
      )}
    </div>
  );
}
