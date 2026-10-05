"use client";

import * as React from "react";

import {
  DOC_NGANG_KHI_TOI_HEP,
  DOC_NGANG_KHI_TOI_RONG,
  DUOI_X_HEP,
  DUOI_X_RONG,
  MAN_HEP,
} from "@/components/landing/duong-day";

/**
 * Đoạn nối từ đuôi đường dây của dải kể chuyện xuống khối video.
 *
 * Đường chính kết thúc ở ĐÁY khối đó. Đoạn này bắt đầu đúng tại điểm ấy,
 * lượn một nhánh cong rồi kết bằng một chấm ngay mép trên video. Hai nét
 * khớp nhau vì cùng một toạ độ ngang và khối trên không còn lề dưới — hở
 * một khoảng là mắt thấy ngay thành hai nét rời.
 *
 * TOẠ ĐỘ NGANG KHÔNG PHẢI LÚC NÀO CŨNG LÀ GIỮA TRANG. Bản trước viết cứng
 * `w / 2`, đúng cho màn rộng nhưng sai hẳn trên điện thoại, nơi đường chính
 * chạy sát mép trái. Hai chỗ nối nhau giờ lấy chung một con số từ
 * "duong-day.ts".
 *
 * Tự vẽ theo cuộn bằng đúng mẹo của đường chính: nét đứt dài bằng chính nó,
 * rồi đẩy `stroke-dashoffset` từ full về 0.
 *
 * Khung nhìn đặt bằng số pixel thật chứ không phải 0–100 + kéo méo, để
 * `getTotalLength()` và `stroke-dasharray` cùng một hệ đơn vị — lý do đầy
 * đủ nằm ở chú thích của `JourneyLine`.
 */

/**
 * Chiều cao đoạn nối.
 *
 * Màn rộng cần 132px vì đoạn này phải lượn một nhánh chữ S: nó rời đường
 * chính theo hướng chéo rồi mới kéo về thẳng đứng, muốn mượt thì phải có
 * quãng đường.
 *
 * Màn hẹp thì đường chính đi thẳng xuống, đoạn nối cũng thẳng xuống —
 * không có cú lượn nào để mà chừa chỗ. Giữ nguyên 132px chỉ tạo thêm một
 * đoạn kẻ trống giữa chặng cuối và video; đo được cả khoảng trống đó là
 * 268px, riêng đoạn nối chiếm một nửa.
 */
const CAO_RONG = 132;
const CAO_HEP = 84;

/** Điểm điều khiển nằm ở đoạn nào của chiều cao. */
const TAY_DAU = 0.34;
const TAY_CUOI = 0.78;

export function LineToVideo() {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const dotRef = React.useRef<SVGCircleElement>(null);
  const [w, setW] = React.useState(0);
  const [hep, setHep] = React.useState(false);

  // Phải biết đang ở màn rộng hay hẹp, vì đuôi đường chính kết ở hai chỗ
  // khác nhau — xem ghi chú trong "duong-day.ts".
  React.useEffect(() => {
    const q = window.matchMedia(MAN_HEP);
    const xet = () => setHep(q.matches);
    xet();
    q.addEventListener("change", xet);
    return () => q.removeEventListener("change", xet);
  }, []);

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
  }, [w, hep]);

  const HEIGHT = hep ? CAO_HEP : CAO_RONG;

  // Bắt đầu đúng chỗ đường chính kết thúc, không mặc định giữa trang.
  const dau = (w * (hep ? DUOI_X_HEP : DUOI_X_RONG)) / 100;
  const doc = hep ? DOC_NGANG_KHI_TOI_HEP : DOC_NGANG_KHI_TOI_RONG;

  /*
   * Đoạn nối là một nhánh cong, không phải nét thẳng.
   *
   * Điểm điều khiển đầu kéo sang phải theo đúng độ dốc đường chính đang
   * tới, nên hai nét nối vào nhau không thấy chỗ gãy. Điểm điều khiển
   * sau nằm ngay trên trục giữa, kéo nét về lại đúng tâm để chấm kết
   * rơi giữa mép trên khối video.
   */
  const ket = HEIGHT - 10;
  const d =
    `M ${dau} 0 ` +
    `C ${dau + doc * HEIGHT * TAY_DAU} ${HEIGHT * TAY_DAU}, ` +
    `${dau} ${HEIGHT * TAY_CUOI}, ` +
    `${dau} ${ket}`;

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
            d={d}
            fill="none"
            stroke="#001a4a"
            strokeOpacity={0.1}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            ref={pathRef}
            d={d}
            fill="none"
            stroke="#c8951a"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* Chấm kết, ngay mép trên video */}
          <circle
            ref={dotRef}
            cx={dau}
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
