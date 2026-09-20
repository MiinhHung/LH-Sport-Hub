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

/**
 * Tốc độ vệt sáng, pixel mỗi giây.
 *
 * TỐC ĐỘ CỐ ĐỊNH, KHÔNG PHẢI THỜI LƯỢNG CỐ ĐỊNH — và đây là chỗ bản mẫu
 * sai mà chỉ lộ ra khi đem dùng ở nơi khác.
 *
 * Bản mẫu cho mọi vệt chạy hết một vòng trong đúng 2,5 giây. Trên thẻ
 * đăng nhập cao chừng 400px thì vừa mắt. Nhưng vệt dài bằng nửa cạnh và
 * chạy hết chiều dài cạnh, nên trên biểu mẫu tạo kèo cao 1300px, quãng
 * đường thành gần 2000px — vẫn nhồi vào 2,5 giây, tức là nhanh gấp ba.
 * Cùng một dòng mã cho ra hai thứ khác hẳn nhau: một bên là ánh sáng lướt
 * nhẹ, một bên là vệt phóng loang loáng.
 *
 * Đo cỡ thật rồi chia ra thời lượng thì mọi khung, cao hay thấp, đều chạy
 * cùng một tốc độ.
 */
const TOC_DO = 320;

/** Chặn hai đầu để khung rất nhỏ không giật, khung rất lớn không ì ra. */
const CHU_KY_MIN = 2.4; // giữ đúng nhịp cũ của thẻ đăng nhập
const CHU_KY_MAX = 6;

/**
 * Thời lượng một vòng cho một cạnh dài `canh` pixel.
 *
 * Quãng đường một vệt đi là 1,5 lần cạnh — nó dài bằng nửa cạnh và chạy
 * từ ngoài mép này sang hẳn ngoài mép kia.
 */
function nhipTheoCanh(canh: number) {
  return Math.min(CHU_KY_MAX, Math.max(CHU_KY_MIN, (canh * 1.5) / TOC_DO));
}

type Canh = "top" | "right" | "bottom" | "left";

/** Vệt sáng chạy dọc một cạnh rồi lặp lại. */
function Beam({
  canh,
  delay,
  chuKy,
}: {
  canh: Canh;
  delay: number;
  chuKy: number;
}) {
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
        background: `linear-gradient(${huong}, transparent, var(--color-beam), transparent)`,
        filter: "blur(1.5px)",
      }}
      animate={
        ngang
          ? { x: quang, opacity: [0.25, 0.85, 0.25] }
          : { y: quang, opacity: [0.25, 0.85, 0.25] }
      }
      transition={{
        x: { duration: chuKy, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay },
        y: { duration: chuKy, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay },
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
      className={`absolute ${goc} rounded-full`}
      style={{
        height: size,
        width: size,
        background: "var(--color-beam)",
        filter: "blur(1.5px)",
      }}
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

/**
 * Chỉ riêng vòng sáng, dán đè lên một khối đã có sẵn.
 *
 * DÙNG CHO THẺ TRONG DANH SÁCH, thay vì bọc chúng lại bằng `BeamFrame`.
 * Mấy thẻ kèo và thẻ buổi tập nhấc lên 2px khi rê chuột; bọc ngoài thì cái
 * khung đứng yên còn thẻ nhích lên, vòng sáng rời khỏi mép thẻ — lệch 2px
 * trên một vòng dày 3px là nhìn ra ngay. Nằm trong thẻ thì nó đi theo.
 *
 * Đặt vào một khối có `relative` và `overflow-hidden`; nó tự phủ kín và
 * không nhận sự kiện chuột, nên không chắn đường bấm vào thẻ.
 */
export function BeamRing({ radiusPx = 16 }: { radiusPx?: number }) {
  const [bat, setBat] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [co, setCo] = React.useState({ w: 400, h: 200 });

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setBat(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) =>
      setCo({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ borderRadius: radiusPx }}
    >
      {bat && (
        <>
          <Beam canh="top" delay={0} chuKy={nhipTheoCanh(co.w)} />
          <Beam canh="right" delay={0.6} chuKy={nhipTheoCanh(co.h)} />
          <Beam canh="bottom" delay={1.2} chuKy={nhipTheoCanh(co.w)} />
          <Beam canh="left" delay={1.8} chuKy={nhipTheoCanh(co.h)} />

          <Dot goc="top-0 left-0" size={5} delay={0} />
          <Dot goc="top-0 right-0" size={8} delay={0.5} />
          <Dot goc="right-0 bottom-0" size={8} delay={1} />
          <Dot goc="bottom-0 left-0" size={5} delay={1.5} />
        </>
      )}
    </div>
  );
}

export function BeamFrame({
  children,
  tilt = true,
  radiusPx = 16,
  spread = 1,
}: {
  children: React.ReactNode;
  /**
   * Nghiêng theo con trỏ.
   *
   * TẮT VỚI BIỂU MẪU DÀI. Phối cảnh chỉ có lý khi cả khối nằm gọn trong
   * màn hình; khối cao hơn màn hình thì hai đầu bị kéo méo và mép trên
   * trôi ra ngoài. Mà quan trọng hơn: đang nhắm chuột vào một ô chọn thì
   * cả tấm nghiêng đi theo tay là khó bấm thật sự, không phải chuyện đẹp
   * xấu. Thẻ đăng nhập ngắn nên nghiêng được.
   */
  tilt?: boolean;
  /**
   * Bo góc của khối bên trong, tính bằng pixel. Khung phải bo theo nó,
   * nếu không vệt sáng chạy cắt qua góc.
   */
  radiusPx?: number;
  /**
   * Khung nhô ra ngoài khối bên trong bao nhiêu pixel — cũng chính là bề
   * dày của vòng sáng nhìn thấy được.
   *
   * MẶT THẺ ĐỤC CẦN DÀY HƠN MẶT KÍNH. Thẻ đăng nhập trong suốt một nửa
   * nên vệt sáng hắt qua cả mặt thẻ, 1px là đủ. Thẻ trong app thì đục:
   * nó che kín phần vệt nằm bên dưới, chỉ còn đúng cái gờ nhô ra ngoài là
   * thấy được. Để 1px thì trên nền sáng gần như không nhìn ra gì — đã thử
   * và đúng là không thấy.
   */
  spread?: number;
}) {
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

  // Cỡ thật của khung, để tính thời lượng từ tốc độ. Phải theo dõi liên
  // tục chứ không đo một lần: biểu mẫu cao lên thấp xuống khi người dùng
  // đổi lựa chọn (bật bản đồ, thêm người), và cửa sổ cũng đổi cỡ được.
  const khungRef = React.useRef<HTMLDivElement>(null);
  const [co, setCo] = React.useState({ w: 400, h: 400 });

  React.useEffect(() => {
    const el = khungRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setCo({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const nghieng = tilt && !giamChuyenDong;

  const onMove = (e: React.PointerEvent) => {
    if (!nghieng) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  // Khung nằm ngoài khối bên trong đúng `spread` pixel, và bo góc lớn hơn
  // đúng chừng ấy để hai đường cong chạy song song.
  const khung: React.CSSProperties = {
    inset: -spread,
    borderRadius: radiusPx + spread,
  };

  const chuKyNgang = nhipTheoCanh(co.w);
  const chuKyDoc = nhipTheoCanh(co.h);

  return (
    <div style={nghieng ? { perspective: 1500 } : undefined}>
      <motion.div
        ref={khungRef}
        className="group relative"
        style={nghieng ? { rotateX, rotateY } : undefined}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {/* Quầng sáng quanh thẻ, chỉ rõ lên khi rê chuột vào */}
        <div
          aria-hidden
          className="pointer-events-none absolute bg-gradient-to-r from-gold-400/20 via-gold-200/35 to-gold-400/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={khung}
        />

        {/* Vệt sáng chạy vòng viền */}
        {!giamChuyenDong && (
          <div
            aria-hidden
            className="pointer-events-none absolute overflow-hidden"
            style={khung}
          >
            <Beam canh="top" delay={0} chuKy={chuKyNgang} />
            <Beam canh="right" delay={0.6} chuKy={chuKyDoc} />
            <Beam canh="bottom" delay={1.2} chuKy={chuKyNgang} />
            <Beam canh="left" delay={1.8} chuKy={chuKyDoc} />

            <Dot goc="top-0 left-0" size={5} delay={0} />
            <Dot goc="top-0 right-0" size={8} delay={0.5} />
            <Dot goc="right-0 bottom-0" size={8} delay={1} />
            <Dot goc="bottom-0 left-0" size={5} delay={1.5} />
          </div>
        )}

        {/*
          Vệt sáng là phần tử có định vị, còn nội dung thì không — mà phần
          tử có định vị luôn vẽ đè lên nội dung tĩnh dù đứng trước trong
          cây. Không bọc lại thì vệt sáng chạy ngang qua mặt thẻ.
        */}
        <div className="relative">{children}</div>
      </motion.div>
    </div>
  );
}
