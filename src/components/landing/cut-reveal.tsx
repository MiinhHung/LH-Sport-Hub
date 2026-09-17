"use client";

import * as React from "react";

/**
 * Chữ trồi lên từ sau một khe che, từng từ lệch nhau một nhịp.
 *
 * CÁI BẪY CỦA TIẾNG VIỆT: khe che là `overflow: hidden`, mà tiếng Việt có
 * dấu ở CẢ TRÊN LẪN DƯỚI con chữ — "đặt" có dấu nặng thò xuống, "ố" có mũ
 * thò lên. Khe che ôm sát dòng chữ sẽ xén mất chúng, và lỗi này chỉ lộ ra
 * ở đúng vài từ nên rất dễ lọt.
 *
 * Nên khe được nới ra bằng padding rồi kéo lại bằng margin âm đúng bằng
 * chừng đó: vùng cắt rộng hơn con chữ, nhưng chỗ nó chiếm trong dòng thì
 * không đổi.
 *
 * Tách theo TỪ chứ không theo dòng: tách theo dòng phải đo đạc sau khi
 * dựng, còn tách theo từ thì trình duyệt tự xuống dòng như thường, mà nhìn
 * gần như không khác.
 *
 * An toàn khi không có gì chạy — giống `Reveal`: máy chủ dựng ra đã hiện
 * sẵn, không có IntersectionObserver thì hiện luôn, và có hẹn giờ phòng khi
 * bộ theo dõi im lặng.
 */

/** Khoảng nới của khe che, tính theo cỡ chữ. */
const PAD_TOP = "0.14em";
const PAD_BOTTOM = "0.2em";

export function CutReveal({
  text,
  className,
  delay = 0,
  step = 65,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  /** Trễ chung, mili giây. */
  delay?: number;
  /** Khoảng lệch giữa hai từ liền nhau, mili giây. */
  step?: number;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}) {
  const ref = React.useRef<HTMLElement>(null);
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

    // Đã nằm trong tầm nhìn ngay lúc mount thì chạy luôn, đừng giấu rồi hiện.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      setRun(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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

  const words = React.useMemo(() => text.split(" "), [text]);

  return (
    <Tag ref={ref as never} className={className}>
      {/*
        Máy đọc màn hình đọc nguyên câu, không đọc rời từng từ.

        `select-none` là bắt buộc: chữ `sr-only` vẫn nằm trong luồng văn bản
        nên bôi đen rồi chép sẽ ra hai lần cả câu — một lần từ bản ẩn, một
        lần từ bản hiện.
      */}
      <span className="sr-only select-none">{text}</span>

      <span aria-hidden>
        {words.map((w, i) => (
          <React.Fragment key={i}>
            <span
              className="inline-block overflow-hidden align-bottom"
              style={{
                paddingTop: PAD_TOP,
                marginTop: `-${PAD_TOP}`,
                paddingBottom: PAD_BOTTOM,
                marginBottom: `-${PAD_BOTTOM}`,
              }}
            >
              <span
                className="inline-block will-change-transform"
                style={{
                  // Trước khi được trang bị thì để nguyên vị trí: nếu
                  // JavaScript không chạy, chữ vẫn đọc bình thường.
                  transform: armed && !run ? "translateY(110%)" : "none",
                  transition: run
                    ? `transform 760ms cubic-bezier(0.16,1,0.3,1) ${delay + i * step}ms`
                    : undefined,
                }}
              >
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}
