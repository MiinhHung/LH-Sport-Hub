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
 * Xem `text-bits.tsx` để biết vì sao chỉ có hai lớp đỡ chứ không phải ba.
 */

/** Khoảng nới của khe che, tính theo cỡ chữ. */
const PAD_TOP = "0.14em";
const PAD_BOTTOM = "0.2em";

export function CutReveal({
  text,
  className,
  style,
  delay = 0,
  step = 65,
  as: Tag = "span",
  gachChan,
  mauGach = "#855c12",
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** Trễ chung, mili giây. */
  delay?: number;
  /** Khoảng lệch giữa hai từ liền nhau, mili giây. */
  step?: number;
  as?: "h1" | "h2" | "h3" | "span" | "p";
  /**
   * Cụm từ được gạch chân, ví dụ "Light Human".
   *
   * GẠCH MỘT NÉT LIỀN CHO CẢ CỤM, không phải mỗi từ một nét. Chữ ở đây
   * tách theo từ để chạy lệch nhịp, nên cách dễ nhất là gạch dưới từng
   * từ — nhưng thế thì nét đứt quãng ở mỗi khoảng trắng, nhìn ra lỗi chứ
   * không ra nhấn mạnh. Nên mấy từ thuộc cụm được gom vào chung một thẻ
   * bọc, rồi kẻ một nét duy nhất dưới thẻ đó.
   */
  gachChan?: string;
  /** Màu nét gạch. Mặc định là vàng gold-700 của trang giới thiệu. */
  mauGach?: string;
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

    return () => {
      io.disconnect();
    };
  }, []);

  const words = React.useMemo(() => text.split(" "), [text]);

  /**
   * Cụm cần gạch chân nằm ở khoảng chỉ số nào trong mảng từ.
   *
   * So khớp sau khi bỏ dấu câu ở hai đầu, để "Human." trong câu vẫn tính
   * là khớp với "Human".
   */
  const khoangGach = React.useMemo(() => {
    if (!gachChan) return null;
    const can = (s: string) => s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const muc = gachChan.split(" ").map(can);
    for (let i = 0; i + muc.length <= words.length; i++) {
      if (muc.every((m, j) => can(words[i + j]) === m)) {
        return { dau: i, cuoi: i + muc.length - 1 };
      }
    }
    return null;
  }, [gachChan, words]);

  /** Một từ, kèm khe che và nhịp trồi lên của riêng nó. */
  const veTu = (w: string, i: number) => (
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
  );

  /** Ghép các từ thành mảnh: từ lẻ, hoặc cả cụm được gạch chân. */
  const manh: React.ReactNode[] = [];
  for (let i = 0; i < words.length; i++) {
    if (khoangGach && i === khoangGach.dau) {
      const trong: React.ReactNode[] = [];
      for (let j = khoangGach.dau; j <= khoangGach.cuoi; j++) {
        trong.push(
          <React.Fragment key={j}>
            {veTu(words[j], j)}
            {j < khoangGach.cuoi ? " " : null}
          </React.Fragment>,
        );
      }
      manh.push(
        <span key={`gach-${i}`} className="relative inline-block">
          {trong}
          <span
            aria-hidden
            className="absolute -bottom-[0.06em] left-0 h-[0.07em] w-full origin-left rounded-full"
            style={{
              background: mauGach,
              transform: run ? "scaleX(1)" : "scaleX(0)",
              // Nét kẻ chạy SAU khi cụm chữ đã trồi lên xong, nếu không
              // thì nó gạch dưới một khoảng còn trống.
              transition: run
                ? `transform 620ms cubic-bezier(0.16,1,0.3,1) ${delay + khoangGach.cuoi * step + 260}ms`
                : undefined,
            }}
          />
        </span>,
      );
      if (khoangGach.cuoi < words.length - 1) manh.push(" ");
      i = khoangGach.cuoi;
      continue;
    }

    manh.push(<React.Fragment key={i}>{veTu(words[i], i)}</React.Fragment>);
    if (i < words.length - 1) manh.push(" ");
  }

  return (
    <Tag ref={ref as never} className={className} style={style}>
      {/*
        Máy đọc màn hình đọc nguyên câu, không đọc rời từng từ.

        `select-none` là bắt buộc: chữ `sr-only` vẫn nằm trong luồng văn bản
        nên bôi đen rồi chép sẽ ra hai lần cả câu — một lần từ bản ẩn, một
        lần từ bản hiện.
      */}
      <span className="sr-only select-none">{text}</span>

      <span aria-hidden>{manh}</span>
    </Tag>
  );
}
