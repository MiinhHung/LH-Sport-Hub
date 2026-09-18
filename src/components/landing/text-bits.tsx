"use client";

import * as React from "react";

/**
 * Hai mẩu chữ có hiệu ứng, dùng lại ở nhiều phần của trang giới thiệu.
 *
 * Cùng ba lớp đỡ như `Reveal` và `CutReveal`: máy chủ dựng ra đã hiện sẵn,
 * không có IntersectionObserver thì hiện luôn, và có hẹn giờ phòng khi bộ
 * theo dõi im lặng. Một hiệu ứng làm chữ kẹt vô hình thì tệ hơn hẳn việc
 * không có hiệu ứng nào.
 */

/** Dùng chung cho cả hai: bật khi cuộn tới, và không bao giờ kẹt. */
function useInView<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [run, setRun] = React.useState(false);
  const [armed, setArmed] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setRun(true);
      return;
    }
    setArmed(true);

    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      setRun(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);

    const safety = setTimeout(() => {
      setRun(true);
      io.disconnect();
    }, 2500);

    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return { ref, run, armed };
}

/**
 * Nhãn nhỏ chữ hoa: nét vàng kéo dài ra trước, rồi chữ giãn khoảng cách về
 * đúng cỡ.
 *
 * Giãn khoảng cách chứ không phải trượt vào, vì chữ hoa giãn cách vốn đã là
 * ngôn ngữ của trang này — cho nó co lại rồi mở ra là kéo dài chính đặc
 * điểm sẵn có, thay vì thêm một kiểu chuyển động lạ.
 */
export function Eyebrow({
  children,
  color,
  className,
  ruleWidth = "2rem",
}: {
  children: React.ReactNode;
  color: string;
  className?: string;
  /** Bề ngang nét vàng dẫn trước nhãn. */
  ruleWidth?: string;
}) {
  const { ref, run, armed } = useInView<HTMLDivElement>();
  const on = run || !armed;

  return (
    <div ref={ref} className={`flex items-center gap-3 ${className ?? ""}`}>
      <span
        aria-hidden
        className="h-px origin-left"
        style={{
          background: color,
          opacity: 0.7,
          width: ruleWidth,
          transform: on ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 620ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />
      <span
        className="text-[10px] font-semibold uppercase"
        style={{
          color,
          letterSpacing: on ? "0.32em" : "0.06em",
          opacity: on ? 1 : 0,
          transition:
            "letter-spacing 760ms cubic-bezier(0.16,1,0.3,1) 120ms, opacity 500ms ease-out 120ms",
        }}
      >
        {children}
      </span>
    </div>
  );
}

/**
 * Dấu nháy của câu trích: nở ra và rõ dần.
 *
 * Để riêng chứ không nhét vào chuỗi của `CutReveal`, vì nhét vào thì dấu
 * nháy dính liền với từ đầu và từ cuối — mất màu vàng, và trồi lên cùng
 * nhịp với chữ. Tách ra thì hai dấu vào trước và ra sau, như hai cái ngoặc
 * mở sẵn rồi khép lại quanh câu nói.
 */
export function Quote({
  children,
  color,
  delay = 0,
}: {
  children: React.ReactNode;
  color: string;
  delay?: number;
}) {
  const { ref, run, armed } = useInView<HTMLSpanElement>();
  const on = run || !armed;

  return (
    <span
      ref={ref}
      aria-hidden
      className="inline-block"
      style={{
        color,
        opacity: on ? 1 : 0,
        transform: on ? "scale(1)" : "scale(0.5)",
        transition: `opacity 480ms ease-out ${delay}ms, transform 620ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Đoạn văn hiện dần theo từng từ.
 *
 * KHÔNG dùng khe che như `CutReveal`. Khe che hợp với tiêu đề cỡ lớn, còn
 * đặt lên chữ 16px nhiều dòng thì vừa nặng nề vừa dễ xén mất dấu tiếng
 * Việt. Ở đây chỉ mờ dần và nhích lên vài pixel, nhịp lệch rất ngắn để cả
 * đoạn vẫn đọc như một khối chứ không thành từng từ rời rạc.
 */
export function WordFade({
  text,
  className,
  style,
  step = 18,
  delay = 0,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** Khoảng lệch giữa hai từ, mili giây. */
  step?: number;
  delay?: number;
}) {
  const { ref, run, armed } = useInView<HTMLParagraphElement>();
  const on = run || !armed;
  const words = React.useMemo(() => text.split(" "), [text]);

  return (
    <p ref={ref} className={className} style={style}>
      {/* Bản ẩn cho máy đọc màn hình. `select-none` để bôi đen rồi chép
          không ra hai lần cả câu. */}
      <span className="sr-only select-none">{text}</span>

      <span aria-hidden>
        {words.map((w, i) => (
          <React.Fragment key={i}>
            <span
              className="inline-block"
              style={{
                opacity: on ? 1 : 0,
                transform: on ? "none" : "translateY(6px)",
                transition: `opacity 520ms ease-out ${delay + i * step}ms, transform 520ms cubic-bezier(0.16,1,0.3,1) ${delay + i * step}ms`,
              }}
            >
              {w}
            </span>
            {i < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </p>
  );
}
