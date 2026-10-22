"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import * as React from "react";

import { GROUND_Y, VIEW } from "@/components/intro/athlete-rig";
import { cn } from "@/lib/utils";
import { CauThu, NHIP, TI_LE, cauTrenTay } from "./cau-thu";
import { EASE_OUT, REVEAL_OFFSET, SEC, SPRING } from "./motion";

/**
 * Đố vui cuối trang chủ: phát cầu để điền ngày thành lập công ty.
 *
 * Cách chơi: mấy quả cầu lông mang số nằm rải dưới sân. Bấm một quả để
 * người chơi cầm lên, bấm vào người chơi thì họ tung cầu, bật nhảy đập,
 * cầu bay vòng cung qua lưới rơi vào ô đang chờ. Đủ tám số thì tự chấm.
 *
 * ĐƯỜNG BAY TÍNH TỪNG KHUNG HÌNH, KHÔNG PHẢI BA ĐIỂM MỐC.
 *
 * Bản đầu cho quả cầu đi qua ba điểm mốc rồi để trình duyệt nội suy —
 * nhìn ra gãy khúc ở giữa và tốc độ đều đều như bị kéo dây. Ở đây chạy
 * một biến tiến độ 0→1 rồi mỗi khung hình tự tính toạ độ trên một đường
 * parabol thật, nên đường cong liền mạch: rời vợt thì nhanh, lên tới
 * đỉnh chậm lại, rơi xuống lại nhanh dần. Quả cầu cũng tự xoay theo
 * hướng đang bay, vì cầu lông thật luôn chúc đầu bần về phía trước.
 *
 * VỢT VÀ CẦU PHẢI KHỚP NHAU. Cầu chỉ rời tay đúng lúc mặt vợt quét qua
 * nó, chứ không phải bay ngay khi thả chuột. Sai một nhịp này thì thành
 * ra cầu tự bay còn vợt vung theo sau.
 *
 * KHÔNG BẮT NGẮM, KHÔNG BẮT KÉO. Đây là câu đố về ngày thành lập, không
 * phải trò thi phát cầu — bắt ngắm thì người biết đáp án vẫn thua vì
 * tay. Một cú bấm (hoặc Tab tới người chơi rồi Enter) là đủ.
 */

/**
 * Ngày thành lập Light Human: 29 tháng 5 năm 2020.
 *
 * Viết liền tám chữ số theo thứ tự ngày, tháng, năm. Đổi ngày thì sửa
 * đúng dòng này, số ô đáp án tự đếm theo độ dài chuỗi.
 *
 * Đáp án nằm trong mã nguồn nên ai mở xem mã trang là thấy. Với một câu
 * đố vui nội bộ thì không sao, nhưng đừng dùng cách này cho thứ gì cần
 * giữ kín thật.
 */
export const NGAY_THANH_LAP = "29052020";


/** Một nhịp thở lúc đứng chờ (giây). Chậm hơn màn mở đầu cho đỡ sốt ruột. */
const NHIP_THO = 1.8;

/** Bàn chân nằm ở đâu theo chiều cao khung nhân vật. */
const CHAN = GROUND_Y / VIEW.h;

/**
 * Chỗ nằm của mười quả cầu dưới sân, theo phần trăm khung sân.
 *
 * Đặt tay từng quả chứ không rải ngẫu nhiên: ngẫu nhiên thì máy chủ và
 * trình duyệt ra hai chỗ khác nhau, hỏng hydrate. Cũng cố ý chừa trống
 * khoảng bên trái cho người que đứng.
 */
const CHO_NAM = [
  { x: 47, y: 62, r: -14 },
  { x: 60, y: 76, r: 9 },
  { x: 73, y: 61, r: -6 },
  { x: 86, y: 74, r: 17 },
  { x: 95, y: 58, r: -11 },
  { x: 41, y: 84, r: 6 },
  { x: 54, y: 91, r: -20 },
  { x: 68, y: 86, r: 13 },
  { x: 81, y: 92, r: -8 },
  { x: 93, y: 85, r: 21 },
];

/**
 * Bàn chân người chơi chạm sân ở độ cao này, theo phần trăm khung sân.
 *
 * PHẢI ĐỨNG SÁT MÉP TRÁI. Đo bản người que với người đứng ở 17%: bàn
 * tay nằm ở x=127 còn ô đáp án đầu tiên ở x=97 — tức là ô ở BÊN TRÁI
 * tay, nên quả cầu bay giật lùi về sau. Điểm chạm cầu phải nằm bên trái
 * ô đầu tiên thì cầu mới bay tới trước như thật.
 *
 * Cỡ và chỗ đứng theo màn hình nằm ở hai biến CSS trên khung sân:
 * `--cao` (chiều cao khung nhân vật) và `--trai` (mép trái khung).
 */
const NGUOI_Y = 90;

/**
 * Tám ô đáp án chia làm ba nhóm, mỗi nhóm có nhãn riêng.
 *
 * Phải khớp với thứ tự chữ số trong `NGAY_THANH_LAP`: hai số ngày, hai
 * số tháng, bốn số năm.
 */
const NHOM = [
  { nhan: "Ngày", batDau: 0, soChuSo: 2 },
  { nhan: "Tháng", batDau: 2, soChuSo: 2 },
  { nhan: "Năm", batDau: 4, soChuSo: 4 },
];

/* ------------------------------------------------------------------ */

/** Quả cầu lông mang số. */
function QuaCau({
  so,
  size,
  ink,
  cork = "#dcae42",
  corkInk = "#00112e",
}: {
  so: number | null;
  size: number;
  ink: string;
  /** Màu đế bần và màu số trên đế. Mặc định là bản nền trắng. */
  cork?: string;
  corkInk?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      {/* Váy lông — hình thang xoè lên trên */}
      <path
        d="M 13 24 L 6 6 Q 20 1 34 6 L 27 24 Z"
        fill="#ffffff"
        stroke={ink}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      {/* Mấy nan lông */}
      <path
        d="M 20 23 L 20 3 M 16 23 L 12 4.5 M 24 23 L 28 4.5"
        stroke={ink}
        strokeWidth={1}
        opacity={0.45}
      />
      {/*
        Đế bần, và con số nằm trên đó.

        ĐẾ DÙNG VÀNG SÁNG, KHÔNG PHẢI MÀU VÀNG CỦA TRANG. Trang giới
        thiệu dùng gold-700 vì đó là sắc vàng đậm vừa đủ để LÀM CHỮ trên
        nền trắng. Nhưng ở đây vàng làm NỀN còn số mới là chữ — đo ra chữ
        navy trên gold-700 chỉ được 3,16:1, dưới ngưỡng đọc được, nên
        nhìn mờ mờ khó ra số. Đổi đế sang gold-400 thì lên 9,09:1.

        Vẫn viền navy quanh đế để nó không bị nhoà vào nền trắng của
        trang, vì gold-400 khá sáng.
      */}
      <circle
        cx={20}
        cy={28}
        r={10.5}
        fill={cork}
        stroke={ink}
        strokeWidth={1.4}
      />
      <text
        x={20}
        y={28.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={800}
        fill={corkInk}
      >
        {so ?? ""}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */

export function DoVui({
  dapAn = NGAY_THANH_LAP,
  ink,
  muted,
  gold,
  line,
  cork,
  corkInk,
  radius = "rounded-xl",
}: {
  dapAn?: string;
  ink: string;
  muted: string;
  gold: string;
  line: string;
  /** Màu đế bần của quả cầu và màu số trên đế (mặc định: bản nền trắng). */
  cork?: string;
  corkInk?: string;
  /** Bo góc của ô đáp án và sân. */
  radius?: string;
}) {
  const soO = dapAn.length;
  const reduce = useReducedMotion();

  const [daNhap, setDaNhap] = React.useState<string[]>([]);
  const [dangCam, setDangCam] = React.useState<number | null>(null);
  const [dangBay, setDangBay] = React.useState(false);

  const khungRef = React.useRef<HTMLDivElement>(null);
  const tayRef = React.useRef<HTMLSpanElement>(null);
  const sanRef = React.useRef<HTMLDivElement>(null);
  const oRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  /**
   * Mốc trên dòng thời gian của người chơi (ms, xem cau-thu.tsx), và tiến
   * độ đường bay — motion value để chuyển động không đi qua render.
   */
  const nhip = useMotionValue<number>(NHIP.thoTu);
  const tienDo = useMotionValue(0);

  /** Quả cầu đang cầm: theo tay trái lúc chờ, được tung lên khi đánh. */
  const cauX = useTransform(nhip, (ms) => `${cauTrenTay(ms).x}%`);
  const cauY = useTransform(nhip, (ms) => `${cauTrenTay(ms).y}%`);

  /**
   * Hoạt ảnh đang lái `nhip` (đứng thở / về thế / cú đập), để dừng khi đổi.
   *
   * MỖI LƯỢT LÁI CÓ MỘT SỐ THỨ TỰ. Dừng hoạt ảnh cũ không đủ: lời hẹn
   * `onComplete` của nó vẫn có thể chạy sau đó. Đo ra: bấm thẳng vào quả
   * cầu thì lúc nhả tay chạy "tua về thế", ngay sau đó cú click gọi cú
   * đập — rồi lời hẹn "tua xong thì đứng thở" của lượt cũ chen vào, cắt
   * ngang cú đập, quả cầu không bao giờ được phát. Giờ lời hẹn nào cũng
   * kiểm số thứ tự trước, lượt cũ thì im.
   */
  const laiRef = React.useRef<ReturnType<typeof animate> | null>(null);
  const theHe = React.useRef(0);
  const lai = React.useCallback(
    (tao: ((g: number) => ReturnType<typeof animate>) | null) => {
      laiRef.current?.stop();
      const g = ++theHe.current;
      laiRef.current = tao ? tao(g) : null;
    },
    [],
  );
  const conLuot = (g: number) => g === theHe.current;

  /** Đứng thở: lặp đoạn sẵn sàng → nhún → sẵn sàng, chậm và liền mạch. */
  const dungTho = React.useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      lai(null);
      nhip.set(NHIP.thoTu);
      return;
    }
    lai(() => {
      nhip.jump(NHIP.thoTu);
      return animate(nhip, NHIP.thoDen, {
        duration: NHIP_THO,
        ease: "linear",
        repeat: Infinity,
      });
    });
  }, [lai, nhip]);

  React.useEffect(() => {
    dungTho();
    return () => laiRef.current?.stop();
  }, [dungTho]);
  const bayHien = useMotionValue(0);

  /**
   * Hai đầu đường bay, đo ngay lúc phát cầu.
   *
   * Để trong ref chứ không trong state: `useTransform` bên dưới đọc nó
   * ở mỗi khung hình, mà đổi state giữa chừng thì cả cây render lại.
   */
  const duong = React.useRef({ x0: 0, y0: 0, x1: 0, y1: 0, dinh: 0 });

  /*
   * TOẠ ĐỘ TÍNH TỪ TIẾN ĐỘ, KHÔNG PHẢI GÁN TAY TRONG `onUpdate`.
   *
   * Bản trước gọi `animate(0, 1, { onUpdate })` — truyền hai con số trần
   * chứ không phải một motion value. Dạng đó không chạy như mong đợi:
   * nó nhảy thẳng tới đích trong đúng một khung hình, nên quả cầu chưa
   * bao giờ thật sự bay, chỉ là con số xuất hiện luôn trong ô. Nhìn thì
   * tưởng "hiệu ứng chưa mượt", thật ra là không có hiệu ứng nào cả.
   *
   * Ở đây chạy hẳn một motion value `tienDo` — đúng dạng mà cú vung vợt
   * vẫn dùng và vẫn chạy tốt — rồi suy ra toạ độ.
   */
  const bayX = useTransform(tienDo, (t) => {
    const d = duong.current;
    return d.x0 + (d.x1 - d.x0) * t;
  });

  /** Hai nhánh parabol nối ở đỉnh: lên chậm dần, rơi nhanh dần. */
  const bayY = useTransform(tienDo, (t) => {
    const d = duong.current;
    return t < 0.5
      ? d.y0 + (d.dinh - d.y0) * (1 - (1 - t * 2) ** 2)
      : d.dinh + (d.y1 - d.dinh) * ((t - 0.5) * 2) ** 2;
  });

  /**
   * ĐẾ BẦN ĐI TRƯỚC, KHÔNG PHẢI CHÙM LÔNG.
   *
   * Quả cầu lông nặng hết ở đế bần, nên bay kiểu gì nó cũng quay đế về
   * phía trước — lên thì đế hướng lên, rơi thì đế chúc xuống. Bản trước
   * cộng 90 độ, tức là lệch đúng nửa vòng, thành ra cầu bay chổng lông
   * đi trước suốt cả đường. Hình vẽ để đế ở phía DƯỚI, nên muốn đế theo
   * hướng bay thì phải TRỪ 90.
   *
   * Góc lấy từ đạo hàm của chính hai nhánh parabol ở trên, nên tới đỉnh
   * quả cầu tự lộn đầu như thật, không cần xử lý riêng.
   */
  const bayXoay = useTransform(tienDo, (t) => {
    const d = duong.current;
    const dx = d.x1 - d.x0;
    const dy =
      t < 0.5
        ? (d.dinh - d.y0) * 4 * (1 - 2 * t)
        : (d.y1 - d.dinh) * 8 * (t - 0.5);
    return (Math.atan2(dy, dx) * 180) / Math.PI - 90;
  });

  const oDangCho = daNhap.length;
  const xong = daNhap.length === soO;

  /*
    Đúng hay sai: TÍNH RA, không giữ trong state.

    Trước đây đây là một ô `useState` kèm một `useEffect` theo dõi
    `daNhap` để đặt giá trị — mà `react-hooks` bắt đúng chỗ đó
    (`set-state-in-effect`), và bắt có lý: kết quả không phải một thông
    tin độc lập, nó LUÔN suy ra được từ những gì đã điền.

    Giữ bằng state thì phải trả ba cái giá: thêm một vòng render sau khi
    điền xong, phải nhớ đặt lại `null` trong "Chơi lại", và tồn tại một
    nhịp mà ô đã điền đủ nhưng kết quả vẫn còn `null`. Tính ra thì cả ba
    biến mất — "Chơi lại" xoá `daNhap` là kết quả tự về `null`.

    Đổi lại, kết quả hiện sớm hơn đúng một nhịp render. Đã xem: khối kết
    quả dùng `initial`/`animate` của motion nên vẫn chạy hiệu ứng vào
    như cũ, chỉ bắt đầu sớm hơn; `aria-live` vẫn báo vì nội dung đổi từ
    rỗng sang có.
  */
  const ketQua: null | "dung" | "sai" = !xong
    ? null
    : daNhap.join("") === dapAn
      ? "dung"
      : "sai";

  /**
   * Số lượt chơi. "Chơi lại" giữa lúc quả cầu đang bay thì tăng số này,
   * cú bay cũ đáp xuống sau đó thấy lệch lượt nên không ghi số vào ô nữa.
   */
  const luotRef = React.useRef(0);

  const lamLai = () => {
    luotRef.current += 1;
    tienDo.stop();
    bayHien.set(0);
    // Không cần đặt lại kết quả: nó tính từ `daNhap`, xoá mảng là tự về null.
    setDaNhap([]);
    setDangCam(null);
    setDangBay(false);
    dungTho();
  };

  /** Cho quả cầu bay theo parabol từ mặt vợt tới ô đang chờ. */
  const bay = React.useCallback(
    async (so: number) => {
      const khung = khungRef.current;
      const tay = tayRef.current;
      const o = oRefs.current[oDangCho];
      if (!khung || !tay || !o) return;
      const luot = luotRef.current;

      const k = khung.getBoundingClientRect();
      const a = tay.getBoundingClientRect();
      const b = o.getBoundingClientRect();

      duong.current = {
        x0: a.left - k.left + a.width / 2,
        y0: a.top - k.top + a.height / 2,
        x1: b.left - k.left + b.width / 2,
        y1: b.top - k.top + b.height / 2,
        // Đỉnh vòng cung nhô cao hơn cả hai đầu, nhưng chỉ nhô vừa phải.
        // Đo bản trước để 110: đỉnh lên tới y = -127, tức là quả cầu bay
        // vọt ra khỏi khối, lượn qua cả dòng tiêu đề rồi mới rơi xuống.
        // Chặn không cho vượt quá mép trên: đo bản trước, đỉnh lên tới
        // y = -61 nên quả cầu lượn ra ngoài khối, chồng lên dòng tiêu đề.
        dinh: Math.max(-12, Math.min(a.top - k.top, b.top - k.top) - 28),
      };

      tienDo.jump(0);
      bayHien.set(1);

      await animate(tienDo, 1, { duration: SEC.flight, ease: "linear" });
      // Đã bấm "Chơi lại" trong lúc bay: bỏ cú này.
      if (luot !== luotRef.current) return;

      bayHien.set(0);
      setDaNhap((cu) => [...cu, String(so)]);
      setDangCam(null);
      setDangBay(false);
    },
    [bayHien, oDangCho, tienDo],
  );

  /** Vung hết đà; tới lúc mặt vợt quét qua cầu thì mới thả cầu đi. */
  const phatCau = React.useCallback(async () => {
    if (dangCam === null || dangBay || xong) return;
    setDangBay(true);

    const so = dangCam;
    const it = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (it) {
      setDaNhap((cu) => [...cu, String(so)]);
      setDangCam(null);
      setDangBay(false);
      return;
    }

    /*
     * CÚ ĐẬP: CHẠY TIẾP DÒNG THỜI GIAN CỦA MÀN MỞ ĐẦU, ĐÚNG TỐC ĐỘ THẬT.
     *
     * Từ chỗ đang đứng (thế thở, hoặc đang nén đà nếu vừa kéo) chạy một
     * mạch tới hết cú: nén → bật nhảy → chạm cầu → bẻ cổ tay → tiếp đất
     * → về thế sẵn sàng. Mọi easing, độ trễ của vợt, tóc, vạt áo đã nằm
     * sẵn trong dòng thời gian, nên y như cú đập ở màn mở đầu.
     *
     * Cầu chỉ rời đi đúng khung mặt vợt chạm (NHIP.cham), không phải lúc
     * thả chuột — sai nhịp này thì thành cầu tự bay còn vợt đuổi theo.
     */
    let daThaCau = false;
    lai((g) => {
      let tu = nhip.get();
      // Đang ở giữa nhịp thở thì nhảy về đầu đoạn lấy đà (cùng một dáng
      // sẵn sàng), khỏi chạy lại nửa nhịp thở thừa.
      if (tu < NHIP.daTu) tu = NHIP.daTu;
      nhip.jump(tu);
      return animate(nhip, NHIP.het, {
        duration: (NHIP.het - tu) / 1000,
        ease: "linear",
        onUpdate: (ms) => {
          if (!daThaCau && ms >= NHIP.cham && conLuot(g)) {
            daThaCau = true;
            void bay(so);
          }
        },
        onComplete: () => {
          if (conLuot(g)) dungTho();
        },
      });
    });
  }, [bay, dangBay, dangCam, dungTho, lai, nhip, xong]);

  const loiNhac =
    dangCam === null
      ? "Bấm một quả cầu ở dưới sân để cầm lên."
      : "Bấm vào người chơi để đập cầu vào ô đang chờ.";

  return (
    <div
      ref={khungRef}
      className="relative mx-auto max-w-2xl"
    >
      {/* Ô đáp án */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
        role="group"
        aria-label="Ngày thành lập: hai số ngày, hai số tháng, bốn số năm"
      >
        {NHOM.map((nhom, iNhom) => (
          <React.Fragment key={nhom.nhan}>
            {iNhom > 0 && (
              <span
                aria-hidden
                className="self-start pt-2 text-[18px]"
                style={{ color: line }}
              >
                /
              </span>
            )}

            <div className="flex flex-col items-center gap-1.5">
              <div className="flex gap-2 sm:gap-2.5">
                {Array.from({ length: nhom.soChuSo }).map((_, j) => {
                  const i = nhom.batDau + j;
                  const dangCho = i === oDangCho && !xong;
                  return (
                    <div
                      key={i}
                      ref={(el) => {
                        oRefs.current[i] = el;
                      }}
                      className={cn(
                        "font-display relative grid size-11 place-items-center border-2 text-[20px] font-bold transition-colors duration-[var(--m-instant)] sm:size-12 sm:text-[22px]",
                        radius,
                      )}
                      style={{
                        borderColor:
                          ketQua === "sai"
                            ? "#e11d48"
                            : ketQua === "dung" || i === oDangCho
                              ? gold
                              : line,
                        color: ink,
                        background: dangCho ? `${gold}12` : "transparent",
                      }}
                    >
                      {/* Chữ số rơi vào thì nảy một nhịp. `key` đổi theo
                          giá trị nên hoạt ảnh chạy lại đúng lúc điền. */}
                      {daNhap[i] != null && (
                        <motion.span
                          key={daNhap[i]}
                          className="relative"
                          initial={{ scale: 0.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            ...SPRING.pop,
                          }}
                        >
                          {daNhap[i]}
                        </motion.span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/*
                Ghi hẳn chữ NGÀY / THÁNG / NĂM dưới từng nhóm.

                Trước chỉ có hai dấu gạch chéo ngăn giữa tám cái ô. Người
                Việt quen ngày trước năm sau nên phần lớn sẽ đoán đúng,
                nhưng "đoán đúng" không phải là "biết chắc" — mà ở đây
                đoán sai thì mất luôn cả tám phát cầu rồi mới biết.
              */}
              <span
                className="text-[12px] font-semibold"
                style={{ color: muted }}
              >
                {nhom.nhan}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {ketQua === null && (
        <p className="mt-2 text-[12.5px]" style={{ color: muted }}>
          {loiNhac}
        </p>
      )}

      {/* Quả cầu đang bay — nằm ngoài luồng, chỉ hiện lúc bay */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-20"
        style={{
          x: bayX,
          y: bayY,
          rotate: bayXoay,
          opacity: bayHien,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <QuaCau so={dangCam} size={40} ink={ink} cork={cork} corkInk={corkInk} />
      </motion.div>

      {/*
        Sân.

        TRƯỚC ĐÂY LÀ BA NÉT RỜI, KHÔNG PHẢI MỘT KHUNG CẢNH. Chụp ở màn
        1440: một dải lưới ô vuông xám chạy suốt bề ngang, một gạch 1px
        ở tận đáy gọi là "mặt sân", và ở giữa là một khoảng trắng cao
        chừng 140px không có gì. Mười quả cầu thì lơ lửng trong khoảng
        trắng đó vì chẳng có gì đỡ chúng.

        Giờ dựng thành một cảnh thật: mặt sân hình thang có vạch kẻ chạy
        theo luật phối cảnh, lưới treo giữa hai cột chứ không tràn hết
        bề ngang, và mỗi quả cầu có một vệt bóng đổ dưới chân. Cùng ngôn
        ngữ với nền sân ở đầu trang.
      */}
      <div
        ref={sanRef}
        /*
         * `--cao`: chiều cao khung nhân vật; `--trai`: mép trái khung.
         * Hai ràng buộc kéo nhau: vợt ở thế cúp vung ra sau lưng gần sát
         * mép trái khung (khoảng 4% bề ngang), nên khung không được thò ra
         * ngoài trang; còn điểm chạm cầu (khoảng 49% bề ngang khung) phải
         * nằm BÊN TRÁI ô đáp án đầu tiên, không thì cầu bay giật lùi.
         *
         * Đo ở màn 390 (sân 340px, ô đầu ở x≈95): cao 250, trái 4px thì
         * điểm chạm ở x≈89. Từ sm trở lên sân rộng, cao 300, trái 10px.
         */
        className="relative mt-5 h-[320px] w-full [--cao:250px] [--trai:4px] select-none sm:h-[360px] sm:[--cao:300px] sm:[--trai:10px]"
      >
        {/*
          NỀN SÂN NẰM TRONG MỘT LỚP CẮT RIÊNG, không cắt ở khung ngoài.

          Lúc đầu tôi để `overflow-hidden` ngay trên khung — và cây vợt
          của người que bị xén mất một nửa, vì hình vẽ người que nới rộng
          44px sang trái cho cây vợt có chỗ quét, mà người lại đứng sát
          mép trái. Nền bo góc thì vẫn cần cắt, nên tách ra: lớp này cắt
          phần nền, còn người và mấy quả cầu nằm đè lên trên, không bị
          dao nào động tới.
        */}
        <div
          aria-hidden
          className={cn("absolute inset-0 overflow-hidden", radius)}
          style={{ background: `${ink}06` }}
        >
          {/* Mặt sân: hình thang, xa thì hẹp, gần thì rộng */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 600 360"
            preserveAspectRatio="none"
          >
            <polygon points="90,112 510,112 600,360 0,360" fill={`${ink}07`} />
            {/* Vạch biên hai bên và vạch cuối sân */}
            <path
              d="M90,112 L0,360 M510,112 L600,360 M90,112 L510,112"
              fill="none"
              stroke={line}
              strokeWidth={2}
            />
            {/* Mấy vạch ngang: càng gần càng thưa, đúng kiểu nhìn xa gần */}
            {[0.2, 0.46, 0.76].map((t) => {
              const y = 112 + (360 - 112) * t;
              const nua = 210 + (300 - 210) * t;
              return (
                <line
                  key={t}
                  x1={300 - nua}
                  y1={y}
                  x2={300 + nua}
                  y2={y}
                  stroke={line}
                  strokeWidth={1.5}
                />
              );
            })}
            {/* Vạch giữa sân */}
            <line
              x1={300}
              y1={112}
              x2={300}
              y2={360}
              stroke={line}
              strokeWidth={1.5}
            />
          </svg>
        </div>

        {/*
          Lưới: treo giữa hai cột, có dải mép trên như lưới thật.

          ĐỨNG ĐÚNG TRÊN VẠCH CUỐI SÂN. Bản đầu tôi để lưới rộng 8%–92%
          ở độ cao 22%, còn mép xa của sân thì chỉ rộng 25%–75% ở độ cao
          33% — hai cột lưới cắm ra ngoài sân và lơ lửng phía trên vạch.
          Giờ lưới rộng đúng bằng mép xa (15%–85%) và chân cột hạ xuống
          đúng vạch đó (31%), nên nó đứng trên sân chứ không trôi trong
          không khí.
        */}
        <div
          aria-hidden
          className="absolute right-[15%] left-[15%] h-[72px]"
          style={{ top: "calc(31% - 72px)" }}
        >
          {/* Hai cột */}
          <span
            className="absolute top-0 bottom-0 left-0 w-[3px] rounded-full"
            style={{ background: ink }}
          />
          <span
            className="absolute top-0 right-0 bottom-0 w-[3px] rounded-full"
            style={{ background: ink }}
          />
          {/* Dải mép trên */}
          <span
            className="absolute inset-x-0 top-0 h-[7px] rounded-[2px]"
            style={{ background: ink }}
          />
          {/* Mắt lưới — thưa và nhạt hơn bản cũ, để nó là hậu cảnh chứ
              không giành mắt với mấy quả cầu */}
          <span
            className="absolute inset-x-0 top-[7px] bottom-0"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 13px), repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px 13px)`,
            }}
          />
        </div>

        {/*
          Người chơi: cùng nhân vật với màn mở đầu — và cũng là nút phát cầu.

          BẤM VÀO NGƯỜI CHƠI LÀ ĐẬP. Bản trước bắt kéo quả cầu xuống lấy
          đà rồi thả; nhiều người không đoán ra phải kéo, mà kéo trên điện
          thoại còn dễ cuộn nhầm trang. Cả thân người là một nút to, dễ
          trúng, bàn phím Tab tới rồi Enter cũng được.

          NEO THEO BÀN CHÂN, không theo mép khung: chân nằm ở 94% chiều
          cao khung (GROUND_Y), nên đỉnh khung = mặt sân − 94% chiều cao.
        */}
        <button
          type="button"
          disabled={dangCam === null || dangBay || xong}
          onClick={() => void phatCau()}
          aria-label={
            dangCam === null
              ? "Người chơi: nhặt một quả cầu dưới sân trước"
              : `Đập quả cầu số ${dangCam} vào ô thứ ${oDangCho + 1}`
          }
          className="group/nguoi absolute cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 disabled:cursor-default"
          style={{
            left: "var(--trai)",
            top: `calc(${NGUOI_Y}% - var(--cao) * ${CHAN.toFixed(4)})`,
            height: "var(--cao)",
            width: `calc(var(--cao) * ${TI_LE.toFixed(4)})`,
          }}
        >
          {/* Quầng vàng dưới chân: hiện khi rê chuột, báo là bấm được. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[41%] h-[7%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-0 blur-md transition-opacity duration-[var(--m-instant)] group-enabled/nguoi:group-hover/nguoi:opacity-100"
            style={{ top: `${(CHAN * 100).toFixed(2)}%`, background: `${gold}66` }}
          />
          <span aria-hidden className="pointer-events-none absolute inset-0">
            <CauThu nhip={nhip} className="size-full overflow-visible" />
          </span>

          {/*
            Quả cầu đang cầm. Toạ độ theo % khung nhân vật: lúc chờ ở tay
            trái, lúc đánh được tung lên tới đúng điểm mặt vợt chạm (xem
            cauTrenTay). Đường bay vào ô đáp án xuất phát từ chỗ này.
          */}
          <motion.span
            ref={tayRef}
            aria-hidden
            className="pointer-events-none absolute block transition-opacity duration-[var(--m-instant)]"
            style={{
              left: cauX,
              top: cauY,
              translateX: "-50%",
              translateY: "-50%",
              opacity: dangCam === null || dangBay ? 0 : 1,
            }}
          >
            <QuaCau so={dangCam} size={44} ink={ink} cork={cork} corkInk={corkInk} />
          </motion.span>

          {/*
            Chỉ thẳng vào người chơi: "bấm vào đây". Đứng ngay cạnh đầu,
            nhịp nhẹ vài lần cho mắt bắt được rồi đứng yên.
          */}
          {dangCam !== null && !dangBay && !xong && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute top-[38%] left-[78%] flex items-center gap-1.5 whitespace-nowrap"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: reduce ? 0 : [0, -5, 0] }}
              transition={{
                opacity: { duration: SEC.fast },
                x: reduce
                  ? { duration: 0 }
                  : { duration: SEC.draw, repeat: 3, ease: "easeInOut" },
              }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14">
                <path
                  d="M 17 7 L 3 7 M 8 2 L 2 7 L 8 12"
                  fill="none"
                  stroke={gold}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[11.5px] font-bold" style={{ color: gold }}>
                Bấm để đập
              </span>
            </motion.span>
          )}
        </button>

        {/*
          Mười quả cầu nằm rải dưới sân.

          MỖI QUẢ CÓ BÓNG ĐỔ VÀ MỘT NHỊP THỞ RIÊNG. Trước đây chúng là
          mười cái nút phẳng lơ lửng giữa khoảng trắng — không có gì nói
          rằng chúng đang nằm trên mặt sân, cũng không có gì nói rằng
          chúng bấm được. Vệt bóng dưới chân đặt chúng xuống đất; nhịp
          nhấp nhô rất nhẹ (3px, mỗi quả lệch pha một chút) làm cả sân
          sống lên mà không thành ra nhấp nháy đòi chú ý.

          `repeatType: "mirror"` chứ không phải `"loop"`: loop thì tới
          cuối chu kỳ nó nhảy phắt về đầu, thành một cú giật mỗi vòng.
        */}
        {CHO_NAM.map((cho, n) => {
          const dangChon = dangCam === n;
          return (
            <motion.button
              key={n}
              type="button"
              disabled={xong || dangBay}
              onClick={() => setDangCam(n)}
              aria-label={`Nhặt quả cầu số ${n}`}
              aria-pressed={dangChon}
              className="absolute rounded-full disabled:opacity-40"
              style={{
                left: `${cho.x}%`,
                top: `${cho.y}%`,
                translateX: "-50%",
                translateY: "-50%",
                rotate: cho.r,
              }}
              // Quả đang cầm trên tay thì mờ đi ở dưới sân, để thấy rõ là nó
              // đã được nhặt lên. Không còn nhịp nhấp nhô vô hạn: chuyển động
              // chỉ để phản hồi thao tác của người chơi.
              animate={{ opacity: dangChon ? 0.25 : 1 }}
              transition={{ opacity: { duration: SEC.instant } }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.94 }}
            >
              <span
                aria-hidden
                className="absolute top-full left-1/2 h-[5px] w-[26px] -translate-x-1/2 rounded-[50%] blur-[1.5px]"
                style={{ background: `${ink}22` }}
              />
              <QuaCau so={n} size={46} ink={ink} cork={cork} corkInk={corkInk} />
            </motion.button>
          );
        })}
      </div>

      {/* Kết quả */}
      <div className="mt-4 min-h-[104px] text-center">
        {/* Vùng đọc to: trình đọc màn hình báo đúng/sai khi điền xong. */}
        <div aria-live="polite">
          {ketQua === "dung" && (
            <motion.div
              initial={{ opacity: 0, y: REVEAL_OFFSET / 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: SEC.base, ease: EASE_OUT }}
            >
              <p
                className="font-display text-[24px] font-bold sm:text-[28px]"
                style={{ color: ink }}
              >
                Chuẩn luôn!
              </p>
              <p className="mt-2 text-[14.5px]" style={{ color: muted }}>
                Nhớ ngày thành lập công ty thế này thì chắc cũng nhớ luôn lịch
                sáng thứ 7 chứ nhỉ.
              </p>
            </motion.div>
          )}

          {ketQua === "sai" && (
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: reduce ? 0 : [0, -8, 8, -5, 5, 0] }}
              transition={{ duration: SEC.base }}
            >
              <p
                className="font-display text-[22px] font-bold sm:text-[25px]"
                style={{ color: ink }}
              >
                Cầu ra ngoài rồi
              </p>
              <p className="mt-2 text-[14.5px]" style={{ color: muted }}>
                Thử lại phát nữa xem.
              </p>
            </motion.div>
          )}
        </div>

        {(ketQua !== null || daNhap.length > 0) && (
          <button
            type="button"
            onClick={lamLai}
            className="mt-4 inline-flex min-h-8 items-center px-2 text-[13.5px] font-semibold underline-offset-4 hover:underline"
            style={{ color: gold }}
          >
            Chơi lại
          </button>
        )}
      </div>
    </div>
  );
}
