"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import type { Feature } from "@/components/landing/feature-index";
import { cn } from "@/lib/utils";

/**
 * Mục lục "Trong này có gì" dạng vòng quay: ba tấm ảnh xếp chồng nghiêng
 * trong không gian, chữ đổi theo từng mục, từng chữ trồi lên từ một lớp mờ.
 *
 * DỰNG LẠI TỪ MẪU "circular testimonials" CỦA 21st.dev. Sáu chỗ không
 * dùng thẳng được, và không chỗ nào là chuyện thẩm mỹ:
 *
 * 1. MẪU GỐC KHÔNG CÓ LIÊN KẾT. Nó là ô trích lời khách hàng, chỉ để
 *    đọc. Còn khu này tồn tại để DẪN NGƯỜI TA VÀO APP — bốn mục là bốn
 *    trang. Bê nguyên về là mất sạch đường đi, đổi một khu điều hướng
 *    thành một khu trang trí.
 *
 * 2. PHÍM MŨI TÊN BỊ NGHE Ở `window`. Nghĩa là bấm mũi tên ở BẤT KỲ đâu
 *    trên trang giới thiệu cũng lật vòng quay — kể cả khi đang ở trò đố
 *    vui cuối trang, vốn cũng cần phím. Chuyển về nghe trên chính khối
 *    này, và chỉ khi tiêu điểm đang nằm trong nó.
 *
 * 3. TỰ CHẠY KHÔNG HỎI AI. Mẫu gốc cứ 5 giây lật một lần, không dừng khi
 *    rê chuột vào, không dừng khi người dùng bật "giảm chuyển động". Một
 *    khu vừa tự đổi vừa là thứ phải đọc thì đọc không kịp.
 *
 * 4. BẤM MỘT LẦN LÀ TỰ CHẠY CHẾT HẲN. Mẫu gốc gọi `clearInterval` trong
 *    hàm bấm nhưng không bao giờ đặt lại — nên sau cú bấm đầu tiên nó im
 *    luôn mà không ai biết. Ở đây dừng tự chạy là CÓ CHỦ Ý và nói rõ:
 *    người ta đã tự điều khiển thì thôi đừng giành nữa.
 *
 * 5. `framer-motion` và `react-icons`. Dự án dùng `motion/react` (cùng
 *    thư viện, tên mới) và `lucide-react`. Thêm hai gói nữa chỉ để lấy
 *    hai cái mũi tên là tăng vô ích cỡ gói tải về.
 *
 * 6. `<style jsx>`. Cả app dùng Tailwind. Nhét thêm một hệ kiểu dáng thứ
 *    hai cho đúng một thành phần thì lần sau sửa màu phải nhớ có hai chỗ.
 *
 * Giữ lại đúng thứ làm nên hiệu ứng: ba tấm ảnh xếp chồng có chiều sâu,
 * chữ đổi mượt, và từng chữ của đoạn mô tả trồi lên từ một lớp mờ.
 */

/**
 * Khoảng lệch của hai tấm ảnh hai bên, tính THEO TỈ LỆ bề ngang khối.
 *
 * Mẫu gốc dùng số pixel cố định 60-86 so với bề ngang CẢ MÀN HÌNH. Đo
 * trên bản dựng thật: khối ảnh chỉ rộng 462px, nên tấm bên trái bị đẩy
 * ra tới x=5 — sát mép cửa sổ và bị cắt mất một miếng — còn tấm bên phải
 * thì tràn sang tận cột chữ. Lấy theo tỉ lệ khối thì màn rộng hay hẹp,
 * ba tấm vẫn nằm gọn trong phần của mình.
 *
 * ĐÃ NỚI TỪ 0.15 LÊN 0.22. Đo trên bản ghim: khối ảnh rộng 462px nên
 * tấm bên chỉ lệch 69px, mà bản thân tấm ảnh rộng 340px — phần ló ra
 * chừng 40px, mỏng tới mức không đọc ra là một chồng ba tấm, chỉ thấy
 * một vệt màu lạ ở rìa. Trước đây nó tự đổi sau 5 giây nên ít ai kịp
 * nhìn; giờ khối ghim lại và mỗi mục đứng yên gần một màn hình cuộn,
 * nên rìa ảnh có đủ thời gian để bị soi.
 */
function doLech(rong: number) {
  return Math.min(Math.max(rong * 0.22, 56), 120);
}

export function VongQuayMuc({
  items,
  ink,
  muted,
  gold,
  tieuDe,
}: {
  items: Feature[];
  ink: string;
  muted: string;
  gold: string;
  /** Tiêu đề khu, dựng ở trang rồi truyền vào để nó ghim cùng. */
  tieuDe?: React.ReactNode;
}) {
  const [i, setI] = React.useState(0);
  const [rong, setRong] = React.useState(1200);

  const ngoaiRef = React.useRef<HTMLDivElement>(null);
  const anhRef = React.useRef<HTMLDivElement>(null);
  const it = !!useReducedMotion();
  const n = items.length;

  const muc = items[i];

  /*
   * CUỘN CHUỘT LÀ THỨ ĐIỀU KHIỂN, KHÔNG PHẢI ĐỒNG HỒ ĐẾM.
   *
   * Bản trước tự lật sau mỗi 5,2 giây. Nó có ba cái dở mà mãi mới thấy:
   * người đọc chậm bị cướp mất mục đang đọc; người đọc nhanh phải ngồi
   * đợi; và ai cuộn qua nhanh thì không bao giờ biết có mục 03, 04.
   *
   * Giờ khối này ghim lại giữa màn hình trong lúc trang cuộn qua, và vị
   * trí cuộn quyết định đang ở mục nào — cuộn xuống là đi từ 01 tới 04,
   * cuộn ngược lên là lùi lại. Không còn ai phải đợi, cũng không ai bị
   * cướp mất chữ đang đọc: dừng tay là nó dừng.
   *
   * Nhờ vậy BỎ ĐƯỢC cả ba biến trạng thái cũ (`tuChayDuoc`, `daCamLai`,
   * `dangRe`) cùng cái bẫy "bấm một lần là tự chạy chết hẳn" mà chúng
   * sinh ra. Chỉ còn một nguồn sự thật duy nhất là vị trí cuộn.
   */
  const { scrollYProgress } = useScroll({
    target: ngoaiRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // Chia đều: 4 mục thì mỗi mục chiếm một phần tư quãng ghim.
    const vt = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    setI((c) => (c === vt ? c : vt));
  });

  React.useEffect(() => {
    const el = anhRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setRong(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * Nút bấm CUỘN TRANG chứ không tự đặt lại chỉ số.
   *
   * Nếu nút đặt thẳng `setI` thì có hai thứ cùng ra lệnh: cú cuộn kế
   * tiếp sẽ kéo ngược về đúng mục mà vị trí cuộn đang chỉ, và cú bấm
   * vừa rồi trông như không ăn. Để nút cuộn trang thì vị trí cuộn vẫn
   * là nguồn sự thật duy nhất, còn nút chỉ là một cách khác để tới đó.
   */
  const toiMuc = React.useCallback(
    (vt: number) => {
      const el = ngoaiRef.current;
      if (!el) return;

      // Máy xin giảm chuyển động thì không ghim, nên cuộn cũng vô nghĩa.
      if (it) {
        setI(((vt % n) + n) % n);
        return;
      }

      const dinh = el.getBoundingClientRect().top + window.scrollY;
      const quangGhim = el.offsetHeight - window.innerHeight;
      const muc = ((vt % n) + n) % n;
      // Nhắm vào GIỮA dải của mục, không nhắm vào mép: đứng ngay mép thì
      // chỉ cần một nấc lăn chuột là rơi sang mục bên cạnh.
      window.scrollTo({
        top: dinh + (quangGhim * (muc + 0.5)) / n,
        behavior: "smooth",
      });
    },
    [it, n],
  );

  const di = React.useCallback((buoc: number) => toiMuc(i + buoc), [i, toiMuc]);

  const kieuAnh = (vt: number): React.CSSProperties => {
    const lech = doLech(rong);
    /*
     * ĐỘ TRỒI LÊN TÁCH KHỎI ĐỘ LỆCH NGANG, KHÔNG NHÂN THEO NỮA.
     *
     * Trước là `lech * 0.8`. Lúc `lech` còn 69px thì trồi 55px, không
     * ai để ý. Vừa nới `lech` lên 120px thì nó thành 96px — hai tấm bên
     * bay thẳng ra khỏi khung ảnh và đè lên dòng tiêu đề "cho năm cái
     * group chat". Chụp màn hình mới thấy.
     *
     * Trồi lên là một nét trang trí nhỏ cho chồng ảnh có chiều sâu; nó
     * không có lý do gì phải lớn lên theo bề ngang khối. Chặn ở 40px.
     */
    const nhoLen = Math.min(lech * 0.3, 40);
    const giua = vt === i;
    const trai = (i - 1 + n) % n === vt;
    const phai = (i + 1) % n === vt;

    const chung = {
      transition: it ? "none" : "all 0.8s cubic-bezier(.4,2,.3,1)",
    } as const;

    if (giua)
      return {
        ...chung,
        zIndex: 3,
        opacity: 1,
        transform: "translateX(0px) translateY(0px) scale(1) rotateY(0deg)",
      };
    if (trai)
      return {
        ...chung,
        zIndex: 2,
        opacity: 1,
        transform: `translateX(-${lech}px) translateY(-${nhoLen}px) scale(0.85) rotateY(15deg)`,
      };
    if (phai)
      return {
        ...chung,
        zIndex: 2,
        opacity: 1,
        transform: `translateX(${lech}px) translateY(-${nhoLen}px) scale(0.85) rotateY(-15deg)`,
      };
    return { ...chung, zIndex: 1, opacity: 0 };
  };

  return (
    /*
     * Khối ngoài cao hơn màn hình để có quãng đường cho việc ghim; khối
     * trong dính ở `top-0` và đứng yên giữa màn hình trong suốt quãng
     * đó. 80vh mỗi mục là con số chọn sau khi thử: 100vh thì phải lăn
     * chuột khá lâu mới qua được một mục, còn 50vh thì chữ chưa kịp
     * trồi lên hết đã bị thay.
     *
     * Máy xin giảm chuyển động thì KHÔNG ghim — `height: auto`, khối
     * trong trở lại là một khối thường, và nút bấm đổi mục trực tiếp.
     * Ghim trang là một dạng chuyển động mạnh, đúng thứ họ vừa xin bớt.
     */
    <div
      ref={ngoaiRef}
      className="relative"
      style={it ? undefined : { height: `${n * 80}vh` }}
    >
      <div
        className={cn(
          !it && "sticky top-0 flex min-h-dvh flex-col justify-center py-14",
        )}
        /*
         * Phím mũi tên nghe ở ĐÂY, không phải ở `window`. Và chỉ ăn khi
         * tiêu điểm đang nằm trong khối, nhờ sự kiện tự nổi lên từ phần
         * tử con đang được chọn.
         */
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            di(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            di(1);
          }
        }}
      >
        {/*
          TIÊU ĐỀ NẰM TRONG KHỐI GHIM.

          Lúc đầu tôi để nó ở ngoài như cũ. Nhưng khối này ghim lại suốt
          2880px cuộn, nghĩa là trong gần ba màn hình liền người ta nhìn
          bốn tấm ảnh đổi qua đổi lại mà không còn thấy mình đang ở mục
          nào của trang — dòng "Trong này có gì" đã trôi lên mất từ lâu.
          Đưa vào trong thì nó đứng yên cùng, và cái giá phải trả là bỏ
          hiệu ứng nghiêng theo cuộn ở riêng dòng này (transform của khối
          cha sẽ phá `position: sticky`).
        */}
        {tieuDe && <div className="mb-10 md:mb-12">{tieuDe}</div>}

        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
          {/* Chồng ảnh */}
          <div
            ref={anhRef}
            className="relative h-[260px] [perspective:1000px] sm:h-[340px] md:h-[420px]"
            aria-hidden
          >
            {items.map((m, vt) => (
              <div
                key={m.href}
                style={kieuAnh(vt)}
                /* Chừa 16% mỗi bên cho hai tấm nghiêng có chỗ đứng. Để
               `inset-0` như mẫu gốc thì tấm giữa chiếm trọn bề ngang,
               và hai tấm bên không còn đường nào ngoài tràn ra ngoài. */
                className="absolute inset-y-0 right-[16%] left-[16%] overflow-hidden rounded-3xl shadow-[0_18px_44px_rgba(0,17,46,0.22)]"
              >
                {/* Hai tấm bên phủ một lớp trắng mờ để tấm giữa rõ là
                    tấm đang đọc. Không có nó thì ba tấm sáng ngang nhau,
                    mắt phải tự đoán đâu là mục chính. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-10 bg-white transition-opacity duration-700"
                  style={{ opacity: vt === i ? 0 : 0.45 }}
                />
                <Image
                  src={m.anh}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 70vw, 34vw"
                  className="object-cover"
                  /* Ba tấm đầu nằm ngay trong khung nhìn đầu tiên của khu
                 này, nên để trình duyệt tải sớm thay vì đợi cuộn tới. */
                  priority={vt < 3}
                />
              </div>
            ))}
          </div>

          {/* Chữ */}
          <div className="flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={muc.href}
                initial={it ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={it ? { opacity: 0 } : { opacity: 0, y: -18 }}
                transition={{ duration: it ? 0.12 : 0.3 }}
              >
                <p
                  className="text-[11px] font-bold tracking-[0.18em] uppercase"
                  style={{ color: gold }}
                >
                  {String(i + 1).padStart(2, "0")} /{" "}
                  {String(n).padStart(2, "0")}
                </p>

                <h3
                  className="font-display mt-2.5 text-[28px] leading-[1.1] font-bold sm:text-[34px]"
                  style={{ color: ink }}
                >
                  {muc.title}
                </h3>

                {/* Từng chữ trồi lên từ một lớp mờ. Máy bật "giảm chuyển
                động" thì hiện thẳng cả đoạn, không tách chữ. */}
                <p
                  className="mt-4 text-[15.5px] leading-[1.8]"
                  style={{ color: muted }}
                >
                  {it
                    ? muc.body
                    : muc.body.split(" ").map((chu, k) => (
                        <motion.span
                          key={k}
                          className="inline-block"
                          initial={{ filter: "blur(10px)", opacity: 0, y: 5 }}
                          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: 0.025 * k }}
                        >
                          {chu}&nbsp;
                        </motion.span>
                      ))}
                </p>

                {/*
              Đường đi vào app — thứ mẫu gốc không có, mà thiếu nó thì cả
              khu này mất lý do tồn tại.

              Nhãn để cố định "Vào xem" chứ không ghép "Vào " + tên mục.
              Ghép thì mục cuối ra "Vào bảng tin & nhắn riêng" — gãy nghĩa
              và dài quá một dòng. Tên mục đã nằm ngay phía trên rồi, nhắc
              lại trong nút là thừa.
            */}
                <Link
                  href={muc.href}
                  className="group mt-6 inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.1em] uppercase transition-opacity hover:opacity-70"
                  style={{ color: ink }}
                >
                  Vào xem
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Điều khiển */}
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => di(-1)}
                aria-label="Mục trước"
                className="grid size-11 place-items-center rounded-full border transition-colors"
                style={{ borderColor: `${ink}22`, color: ink }}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => di(1)}
                aria-label="Mục sau"
                className="grid size-11 place-items-center rounded-full border transition-colors"
                style={{ borderColor: `${ink}22`, color: ink }}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>

              {/* Chấm chỉ mục, bấm được để nhảy thẳng. Mẫu gốc không có, nên
              không có cách nào tới mục thứ tư ngoài bấm mũi tên ba lần. */}
              <div className="ml-2 flex items-center gap-2">
                {items.map((m, vt) => (
                  <button
                    key={m.href}
                    type="button"
                    onClick={() => toiMuc(vt)}
                    aria-label={`Tới mục ${m.title}`}
                    aria-current={vt === i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      vt === i ? "w-6" : "w-1.5 opacity-30",
                    )}
                    style={{ background: vt === i ? gold : ink }}
                  />
                ))}
              </div>
            </div>

            {/* Máy đọc màn hình: báo mục đang hiện, vì phần hình ở trên đã bị
            ẩn khỏi cây trợ năng. */}
            <p className="sr-only" aria-live="polite">
              Mục {i + 1} trên {n}: {muc.title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
