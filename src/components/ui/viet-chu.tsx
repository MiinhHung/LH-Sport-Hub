"use client";

import * as React from "react";

/**
 * Chữ tự viết ra: nét viền chạy từ trái sang, rồi chữ đầy màu theo sau.
 *
 * KHÔNG PHẢI BẢN CHÉP CỦA HIỆU ỨNG "XIN CHÀO" KIỂU APPLE — và không thể
 * là bản chép.
 *
 * Hiệu ứng đó đẹp nhờ mỗi nét chữ là một đường SVG vẽ tay, toạ độ chép
 * cứng cho đúng hai chữ "xin chào" và "hello". Nó không nhận chuỗi văn
 * bản nào cả: muốn viết "Light Human" thì phải có dữ liệu nét của chính
 * hai chữ đó, tức phải ngồi đồ lại từng nét. Nó cũng cần chữ CỠ LỚN mới
 * thấy được từng nét; mấy cái nhãn ở đây chỉ cao 10–11px.
 *
 * Nên ở đây làm bằng chính phông chữ của trang: một lớp chữ rỗng ruột chỉ
 * có viền, bị cắt dần từ trái sang phải cho giống ngòi bút đi qua, rồi
 * lớp chữ đặc hiện lên sau. Được cái chữ gì cũng chạy, và vẫn đúng phông,
 * đúng khoảng cách chữ của trang.
 *
 * `-webkit-text-stroke` là thứ duy nhất vẽ được viền cho chữ HTML thật.
 * Trình duyệt nào không hiểu nó thì lớp viền chỉ là chữ trong suốt —
 * không thấy gì, nhưng lớp chữ đặc vẫn hiện đủ, nên không ai mất nội dung.
 */
export function VietChu({
  text,
  className,
  style,
  delay = 0,
  /** Ngòi bút đi hết chữ mất bao lâu, mili giây. */
  thoiGian = 900,
  /** Bề dày nét viền. Chữ càng nhỏ càng phải mảnh. */
  netDay = "0.4px",
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  thoiGian?: number;
  netDay?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [chay, setChay] = React.useState(false);
  const [sanSang, setSanSang] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setChay(true);
      return;
    }

    setSanSang(true);

    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      setChay(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setChay(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} className={`relative inline-block ${className ?? ""}`} style={style}>
      {/*
        Lớp chữ đặc — cũng là lớp giữ chỗ trong dòng, nên hai lớp luôn
        khớp nhau tuyệt đối dù phông có đổi hay chữ có xuống dòng.
      */}
      <span
        className="relative"
        style={{
          opacity: sanSang && !chay ? 0 : 1,
          transition: chay
            ? `opacity 420ms ease-out ${delay + thoiGian * 0.55}ms`
            : undefined,
        }}
      >
        {text}
      </span>

      {/* Lớp viền, bị cắt dần từ trái sang — chính là vệt ngòi bút */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 whitespace-pre"
        style={{
          color: "transparent",
          WebkitTextStrokeWidth: netDay,
          WebkitTextStrokeColor: "currentColor",
          // Viết xong thì nét viền lui đi, nhường chỗ cho chữ đặc; để lại
          // thì chữ dày cộm lên vì đè hai lớp.
          opacity: chay ? 0 : 1,
          clipPath: sanSang && !chay ? "inset(0 100% 0 0)" : "inset(0 0 0 0)",
          transition: chay
            ? `clip-path ${thoiGian}ms cubic-bezier(0.33,1,0.68,1) ${delay}ms,` +
              ` opacity 300ms ease-out ${delay + thoiGian * 0.8}ms`
            : undefined,
        }}
      >
        {text}
      </span>
    </span>
  );
}
