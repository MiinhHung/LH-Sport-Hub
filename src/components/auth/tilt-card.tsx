"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import * as React from "react";

/**
 * Vỏ kính cho hai trang đăng nhập / đăng ký: thẻ nghiêng theo con trỏ, có
 * bốn vệt sáng chạy vòng quanh viền và bốn đốm sáng ở góc.
 *
 * KHÔNG CHÉP NGUYÊN BẢN MẪU. Bản mẫu là một trang demo khép kín: nó tự giữ
 * email, mật khẩu, tự giả lập "đang tải" bằng setTimeout, có nút đăng nhập
 * bằng Google, ô "ghi nhớ tôi" và đường dẫn quên mật khẩu. Ở đây không có
 * cái nào trong số đó — biểu mẫu thật chạy bằng server action, phiên đăng
 * nhập do Supabase giữ, và cả ba thứ kia đều sẽ là nút bấm không dẫn đi
 * đâu. Nên chỉ lấy đúng phần hiệu ứng, còn biểu mẫu giữ nguyên.
 *
 * Ba chỗ sửa so với bản mẫu, đều có lý do:
 *
 *  1. BỎ `mousePosition` trong state. Bản mẫu gọi `setMousePosition` ở mỗi
 *     lần chuột nhúc nhích nhưng không đọc giá trị đó ở đâu cả — tức là
 *     render lại toàn bộ thẻ vài chục lần mỗi giây để không dùng vào việc
 *     gì. Góc nghiêng đi qua motion value nên vốn đã không cần state.
 *
 *  2. THÊM LÒ XO cho góc nghiêng. Bản mẫu gán thẳng giá trị con trỏ vào
 *     `rotateX`/`rotateY`, nên thẻ bám dính theo từng bước nhảy của chuột,
 *     giật chứ không mượt.
 *
 *  3. KHÔNG CHẠY HIỆU ỨNG TRÊN `filter: blur()`. Bản mẫu cho blur chạy qua
 *     lại trong vòng lặp vô hạn ở cả bốn vệt sáng; blur là thứ trình duyệt
 *     phải vẽ lại từ đầu mỗi khung hình, không tăng tốc bằng bộ xử lý đồ
 *     hoạ được như dịch chuyển và độ mờ. Giữ blur ở một giá trị cố định thì
 *     nhìn y hệt mà không đốt máy.
 *
 * Bật "giảm chuyển động" thì tắt hết vòng lặp lẫn nghiêng, chỉ còn lớp
 * kính tĩnh.
 */

/** Một vòng chạy của vệt sáng, giây. */
const CHU_KY = 2.5;

type Canh = "top" | "right" | "bottom" | "left";

/** Vệt sáng chạy dọc một cạnh rồi lặp lại. */
function Beam({ canh, delay }: { canh: Canh; delay: number }) {
  const ngang = canh === "top" || canh === "bottom";

  // Vệt nằm ngang thì dài theo chiều ngang và mảnh theo chiều dọc; vệt
  // đứng thì ngược lại.
  const hinh = ngang ? "h-[2px] w-1/2" : "h-1/2 w-[2px]";
  const huong = ngang ? "to right" : "to bottom";

  // Mỗi cạnh neo vào hai mép của nó rồi trượt dọc cạnh còn lại.
  const neo =
    canh === "top"
      ? "top-0 left-0"
      : canh === "right"
        ? "top-0 right-0"
        : canh === "bottom"
          ? "right-0 bottom-0"
          : "bottom-0 left-0";

  /*
   * CHẠY BẰNG `x`/`y`, KHÔNG PHẢI `left`/`top`.
   *
   * Bản mẫu cho vệt sáng chạy bằng cách đổi `left` từ -50% tới 100%. Đổi
   * `left` là đổi vị trí trong luồng, tức là trình duyệt phải tính lại bố
   * cục ở mỗi khung hình của cả bốn vệt. `transform` thì không: nó do
   * tầng ghép ảnh lo, không đụng tới bố cục.
   *
   * Phần trăm của `translate` tính theo CHÍNH NÓ, còn phần trăm của `left`
   * tính theo thẻ cha. Vệt dài bằng nửa cạnh, nên -50%→100% của cha đúng
   * bằng -100%→200% của chính nó. Cùng một quãng đường, khác cách vẽ.
   *
   * Chiều chạy của hai cạnh dưới và trái ngược lại, vì chúng neo ở mép
   * cuối — nếu không thì vệt sẽ chạy ngược đường so với hai cạnh kia và
   * vòng sáng mất mạch.
   */
  const nguoc = canh === "bottom" || canh === "left";
  const quang = nguoc ? ["100%", "-200%"] : ["-100%", "200%"];

  return (
    <motion.div
      aria-hidden
      className={`absolute ${neo} ${hinh}`}
      style={{
        background: `linear-gradient(${huong}, transparent, var(--color-gold-300), transparent)`,
        filter: "blur(1.5px)",
      }}
      animate={
        ngang
          ? { x: quang, opacity: [0.25, 0.85, 0.25] }
          : { y: quang, opacity: [0.25, 0.85, 0.25] }
      }
      transition={{
        x: { duration: CHU_KY, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay },
        y: { duration: CHU_KY, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay },
        opacity: {
          duration: 1.2,
          repeat: Infinity,
          repeatType: "mirror",
          delay,
        },
      }}
    />
  );
}

function Dot({ goc, size, delay }: { goc: string; size: number; delay: number }) {
  return (
    <motion.div
      aria-hidden
      className={`absolute ${goc} rounded-full bg-gold-200/70`}
      style={{ height: size, width: size, filter: "blur(1.5px)" }}
      animate={{ opacity: [0.2, 0.55, 0.2] }}
      transition={{
        duration: 2 + delay * 0.3,
        repeat: Infinity,
        repeatType: "mirror",
        delay,
      }}
    />
  );
}

export function TiltCard({ children }: { children: React.ReactNode }) {
  /*
   * BẬT HIỆU ỨNG SAU KHI HYDRATE, KHÔNG PHẢI TRONG LÚC RENDER.
   *
   * Bản đầu dùng thẳng `useReducedMotion()` để quyết định có vẽ mấy vệt
   * sáng hay không. Trên máy chủ không có `window` nên nó trả về "không
   * giảm" và HTML gửi đi CÓ vệt sáng; còn máy người dùng bật "giảm chuyển
   * động" thì lần render đầu lại KHÔNG có. Hai cây khác nhau ở ngay lần
   * so đầu tiên, React báo hydrate hỏng và dựng lại cả nhánh. Lỗi này chỉ
   * lộ ra khi thử với `prefers-reduced-motion: reduce`.
   *
   * Cho nên lần render đầu ở cả hai phía đều là bản tĩnh — giống hệt nhau,
   * hydrate sạch — rồi mới bật hiệu ứng ở effect, nơi `window` đã có thật.
   */
  const [batHieuUng, setBatHieuUng] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setBatHieuUng(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const giamChuyenDong = !batHieuUng;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Lò xo mềm: con trỏ dừng thì thẻ còn đi thêm một nhịp rồi mới đứng lại,
  // đó là thứ làm chuyển động ra vẻ có khối lượng.
  const lx = useSpring(mx, { stiffness: 140, damping: 18, mass: 0.6 });
  const ly = useSpring(my, { stiffness: 140, damping: 18, mass: 0.6 });

  const rotateX = useTransform(ly, [-300, 300], [9, -9]);
  const rotateY = useTransform(lx, [-300, 300], [-9, 9]);

  const onMove = (e: React.PointerEvent) => {
    if (giamChuyenDong) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div style={{ perspective: 1500 }}>
      <motion.div
        className="group relative"
        style={giamChuyenDong ? undefined : { rotateX, rotateY }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {/* Quầng sáng quanh thẻ, chỉ rõ lên khi rê chuột vào */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-gold-400/10 via-gold-200/20 to-gold-400/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Vệt sáng chạy vòng viền */}
        {!giamChuyenDong && (
          <div className="absolute -inset-px overflow-hidden rounded-2xl">
            <Beam canh="top" delay={0} />
            <Beam canh="right" delay={0.6} />
            <Beam canh="bottom" delay={1.2} />
            <Beam canh="left" delay={1.8} />

            <Dot goc="top-0 left-0" size={5} delay={0} />
            <Dot goc="top-0 right-0" size={8} delay={0.5} />
            <Dot goc="right-0 bottom-0" size={8} delay={1} />
            <Dot goc="bottom-0 left-0" size={5} delay={1.5} />
          </div>
        )}

        {/* Mặt kính */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950/45 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
          {/* Lưới chéo rất mờ, để mặt kính không phẳng lì */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)",
              backgroundSize: "30px 30px",
            }}
          />

          <div className="relative">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
