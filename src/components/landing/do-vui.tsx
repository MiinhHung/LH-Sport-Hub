"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import * as React from "react";

/**
 * Đố vui cuối trang chủ: phát cầu để điền ngày thành lập công ty.
 *
 * Cách chơi: mấy quả cầu lông mang số nằm rải dưới sân. Bấm một quả để
 * người que cầm lên, kéo xuống để vung vợt lấy đà, thả ra thì cầu bay
 * vòng cung qua lưới rơi vào ô đang chờ. Đủ tám số thì tự chấm.
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
 * KÉO YẾU THÌ KHÔNG MẤT LƯỢT. Đây là câu đố về ngày thành lập, không
 * phải trò thi phát cầu — bắt ngắm thì người biết đáp án vẫn thua vì
 * tay. Kéo chưa đủ thì vợt về lại thế chuẩn bị, cầu vẫn trên tay.
 *
 * CÓ ĐƯỜNG CHƠI KHÔNG CẦN KÉO. Ai dùng bàn phím sẽ kẹt ở bước kéo, nên
 * quả cầu trên tay cũng là một cái nút: bấm hoặc Enter là phát.
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

/** Kéo xuống bao nhiêu pixel thì đủ đà phát cầu. */
const DA_TOI_THIEU = 26;

/** Kéo xa nhất chừng này, quá thì tay không ngả thêm. */
const KEO_TOI_DA = 110;

/** Góc vợt ở thế chuẩn bị, và góc lúc quét hết đà, tính bằng độ. */
const GOC_CHUAN_BI = -38;
const GOC_KET = 46;

/** Vợt quét qua góc này thì coi như chạm cầu. */
const GOC_CHAM = -4;

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
 * Người que đứng ở đâu trong khung sân, theo phần trăm.
 *
 * PHẢI ĐỨNG SÁT MÉP TRÁI. Đo bản trước với người đứng ở 17%: bàn tay
 * nằm ở x=127 còn ô đáp án đầu tiên ở x=97 — tức là ô ở BÊN TRÁI tay,
 * nên quả cầu bay giật lùi về sau. Phát cầu mà bay ngược thì hỏng hết
 * cả ý. Dời sang 6% thì cả tám ô đều nằm bên phải, cầu bay tới trước
 * như thật.
 */
const NGUOI_X = 6;
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
}: {
  so: number | null;
  size: number;
  ink: string;
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
        fill="#dcae42"
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
        fill="#00112e"
      >
        {so ?? ""}
      </text>
    </svg>
  );
}

/** Người que cầm vợt. Cánh tay cầm vợt xoay theo `goc`. */
function NguoiQue({
  goc,
  ink,
  gold,
}: {
  goc: ReturnType<typeof useMotionValue<number>>;
  ink: string;
  gold: string;
}) {
  /*
   * KHUNG NHÌN PHẢI RỘNG HƠN NGƯỜI QUE.
   *
   * Bản trước để khung khít đúng 96×120 quanh người. Nhưng cánh tay cầm
   * vợt XOAY quanh khớp vai, nên mặt vợt quét ra tới tận ngoài khung —
   * và SVG cắt phăng phần thò ra. Nhìn thành cây vợt cụt mất một khúc.
   * Chừa lề rộng ở cả bốn phía để vợt có chỗ quét, còn toạ độ người thì
   * giữ nguyên.
   */
  return (
    <svg
      width={170}
      height={190}
      viewBox="-44 -48 170 190"
      className="overflow-visible"
      aria-hidden
    >
      <g stroke={ink} strokeWidth={4} strokeLinecap="round" fill="none">
        {/* Đầu */}
        <circle cx={44} cy={16} r={10} />
        {/* Thân */}
        <path d="M 44 26 L 44 66" />
        {/* Hai chân, tấn hơi rộng */}
        <path d="M 44 66 L 32 98 M 44 66 L 58 96" />
        {/* Tay không cầm vợt đưa ra trước, đỡ quả cầu */}
        <path d="M 44 38 L 64 44" />
      </g>

      {/* Tay cầm vợt — cả cụm xoay quanh khớp vai */}
      <motion.g style={{ rotate: goc, originX: "44px", originY: "36px" }}>
        <path
          d="M 44 36 L 26 22"
          stroke={ink}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        {/* Cán vợt nối tiếp bàn tay */}
        <path
          d="M 26 22 L 14 10"
          stroke={ink}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Mặt vợt */}
        <ellipse
          cx={9}
          cy={5}
          rx={8}
          ry={10}
          transform="rotate(-42 9 5)"
          fill="none"
          stroke={gold}
          strokeWidth={2.6}
        />
        <path
          d="M 4 1 L 14 9 M 4 9 L 14 1"
          stroke={gold}
          strokeWidth={1}
          opacity={0.7}
        />
      </motion.g>
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
}: {
  dapAn?: string;
  ink: string;
  muted: string;
  gold: string;
  line: string;
}) {
  const soO = dapAn.length;

  const [daNhap, setDaNhap] = React.useState<string[]>([]);
  const [dangCam, setDangCam] = React.useState<number | null>(null);
  const [dangBay, setDangBay] = React.useState(false);
  const [ketQua, setKetQua] = React.useState<null | "dung" | "sai">(null);
  const [dangKeo, setDangKeo] = React.useState(false);

  const khungRef = React.useRef<HTMLDivElement>(null);
  const tayRef = React.useRef<HTMLDivElement>(null);
  const sanRef = React.useRef<HTMLDivElement>(null);
  const oRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  /** Hẹn giờ thu tay về. Giữ lại để dọn khi rời trang giữa cú vung. */
  const thuTayRef = React.useRef<number | undefined>(undefined);

  React.useEffect(
    () => () => {
      if (thuTayRef.current) window.clearTimeout(thuTayRef.current);
    },
    [],
  );

  /** Góc vợt, và tiến độ đường bay — motion value để chuyển động không
   *  đi qua vòng render của React. */
  const gocVot = useMotionValue(GOC_CHUAN_BI);
  const tienDo = useMotionValue(0);
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

  const lamLai = () => {
    setDaNhap([]);
    setDangCam(null);
    setKetQua(null);
    gocVot.set(GOC_CHUAN_BI);
  };

  /** Cho quả cầu bay theo parabol từ mặt vợt tới ô đang chờ. */
  const bay = React.useCallback(
    async (so: number) => {
      const khung = khungRef.current;
      const tay = tayRef.current;
      const o = oRefs.current[oDangCho];
      if (!khung || !tay || !o) return;

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

      await animate(tienDo, 1, { duration: 0.78, ease: "linear" });

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
      gocVot.set(GOC_CHUAN_BI);
      setDaNhap((cu) => [...cu, String(so)]);
      setDangCam(null);
      setDangBay(false);
      return;
    }

    /*
     * CÚ VUNG: LẤY ĐÀ, RỒI LÒ XO — VÀ KHÔNG ĐỢI NÓ DỪNG HẲN.
     *
     * Bản trước nhồi 84 độ vào 0,17 giây với đường cong dồn hết gia tốc
     * về cuối. Đo ra: cả cú vung chỉ được 9 khung hình, khung lớn nhất
     * nhảy 18,3 độ — mắt thấy giật một cái chứ không thấy vung. Xong lại
     * đứng chết 117ms ở điểm cuối mới thu tay, thành ra khựng thêm lần
     * nữa.
     *
     * Lò xo tự lo phần gia tốc và đà thừa: vợt lao tới, vọt quá điểm
     * cuối một chút rồi mới dội lại — đúng cái đà theo tay của một cú
     * đánh thật, mà không phải căn tay từng đoạn.
     *
     * Không `await`: thu tay bắt đầu từ giữa cú vung, nên hai chuyển động
     * nối vào nhau. Lò xo của motion mang theo vận tốc đang có khi bị
     * thay lệnh, nên chỗ đổi chiều không gãy.
     */
    let daThaCau = false;

    // Lấy đà: ngả ra sau một nhịp rất ngắn. Mắt cần thấy vợt đi ngược
    // trước thì mới đọc được cú lao tới là một cú đánh, chứ không phải
    // hình bị nhảy sang chỗ khác.
    //
    // `await ... .finished`, KHÔNG phải `.then` trên đối tượng trả về:
    // bản trước viết `.then` rồi đo ra vợt ngả về -56 độ và đứng im
    // luôn — nhánh đó không bao giờ chạy, cú vung mất hẳn.
    await animate(gocVot, GOC_CHUAN_BI - 18, {
      duration: 0.11,
      ease: [0.33, 1, 0.68, 1],
    }).finished;

    void animate(gocVot, GOC_KET, {
      type: "spring",
      stiffness: 190,
      damping: 16,
      mass: 1,
      onUpdate: (g) => {
        if (!daThaCau && g >= GOC_CHAM) {
          daThaCau = true;
          void bay(so);
        }
      },
    });

    thuTayRef.current = window.setTimeout(() => {
      void animate(gocVot, GOC_CHUAN_BI, {
        type: "spring",
        stiffness: 90,
        damping: 18,
        mass: 1,
      });
    }, 300);
  }, [bay, dangBay, dangCam, gocVot, xong]);

  React.useEffect(() => {
    if (daNhap.length !== soO) return;
    setKetQua(daNhap.join("") === dapAn ? "dung" : "sai");
  }, [daNhap, dapAn, soO]);

  /* --- kéo lấy đà --- */

  const batDauKeo = (e: React.PointerEvent) => {
    if (dangCam === null || dangBay) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDangKeo(true);
  };

  const keoTay = (e: React.PointerEvent) => {
    if (!dangKeo) return;
    const tay = tayRef.current;
    if (!tay) return;
    const r = tay.getBoundingClientRect();
    const dy = Math.max(0, e.clientY - (r.top + r.height / 2));
    const d = Math.min(dy, KEO_TOI_DA);
    // Kéo càng sâu, vợt càng ngả ra sau.
    gocVot.set(GOC_CHUAN_BI - (d / KEO_TOI_DA) * 100);
  };

  const thaTay = () => {
    if (!dangKeo) return;
    setDangKeo(false);
    const daNgaThem = GOC_CHUAN_BI - gocVot.get();
    if (daNgaThem >= (DA_TOI_THIEU / KEO_TOI_DA) * 100) {
      void phatCau();
    } else {
      void animate(gocVot, GOC_CHUAN_BI, {
        type: "spring",
        stiffness: 260,
        damping: 18,
      });
    }
  };

  const loiNhac =
    dangCam === null
      ? "Bấm một quả cầu ở dưới sân để cầm lên."
      : "Kéo xuống lấy đà rồi thả — hoặc bấm thẳng vào quả cầu trên tay.";

  return (
    <div ref={khungRef} className="relative mx-auto max-w-2xl">
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
                  return (
                    <div
                      key={i}
                      ref={(el) => {
                        oRefs.current[i] = el;
                      }}
                      className="font-display grid size-11 place-items-center rounded-xl border-2 text-[20px] font-bold transition-colors duration-200 sm:size-12 sm:text-[22px]"
                      style={{
                        borderColor:
                          ketQua === "sai"
                            ? "#e11d48"
                            : ketQua === "dung" || i === oDangCho
                              ? gold
                              : line,
                        color: ink,
                        background:
                          i === oDangCho && !xong ? `${gold}12` : "transparent",
                      }}
                    >
                      {daNhap[i] ?? ""}
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
                className="text-[10px] font-bold tracking-[0.14em] uppercase"
                style={{ color: muted, opacity: 0.8 }}
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
        <QuaCau so={dangCam} size={40} ink={ink} />
      </motion.div>

      {/* Sân */}
      <div
        ref={sanRef}
        className="relative mt-6 h-[300px] w-full select-none sm:h-[340px]"
      >
        {/* Lưới, nằm giữa người phát và mấy cái ô */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-[26%] h-[74px]"
          style={{
            borderTop: `2.5px solid ${ink}`,
            backgroundImage: `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 11px), repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px 11px)`,
          }}
        />

        {/* Mặt sân */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: line }}
        />

        {/*
          Người que.

          NEO THEO TOẠ ĐỘ TRONG HÌNH VẼ, không phải theo mép khung SVG.
          Khung đã được nới rộng ra bốn phía để cây vợt có chỗ quét, nên
          mép dưới khung không còn là bàn chân nữa — cứ neo theo mép thì
          người que lơ lửng trên mặt sân. Bàn chân nằm ở y=98, cách mép
          trên khung (-48) đúng 146; thân người ở x=44, cách mép trái
          (-44) đúng 88.
        */}
        <div
          className="absolute"
          style={{
            left: `${NGUOI_X}%`,
            top: `${NGUOI_Y}%`,
            transform: "translate(-88px, -146px)",
          }}
        >
          <NguoiQue goc={gocVot} ink={ink} gold={gold} />
        </div>

        {/* Quả cầu đang cầm trên tay — và cũng là nút phát cầu */}
        <div
          ref={tayRef}
          className="absolute"
          style={{
            // Bàn tay không cầm vợt ở (64,44) trong hình vẽ, tức là lệch
            // (20, -54) so với điểm neo của người que ở trên.
            left: `calc(${NGUOI_X}% + 20px)`,
            top: `calc(${NGUOI_Y}% - 54px)`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <button
            type="button"
            disabled={dangCam === null || dangBay || xong}
            onPointerDown={batDauKeo}
            onPointerMove={keoTay}
            onPointerUp={thaTay}
            onPointerCancel={thaTay}
            onClick={() => {
              if (!dangKeo) void phatCau();
            }}
            aria-label={
              dangCam === null
                ? "Chưa cầm quả cầu nào"
                : `Phát quả cầu số ${dangCam} vào ô thứ ${oDangCho + 1}`
            }
            className="grid cursor-grab touch-none place-items-center rounded-full transition-opacity duration-200 active:cursor-grabbing"
            // Tính thẳng ở đây chứ không dùng lớp `disabled:opacity-0`:
            // kiểu nội tuyến luôn thắng lớp tiện ích, nên để cả hai thì
            // quả cầu rỗng vẫn hiện trên tay lúc chưa nhặt gì.
            style={{ opacity: dangCam === null || dangBay ? 0 : 1 }}
          >
            <QuaCau so={dangCam} size={44} ink={ink} />
          </button>

          {/*
            CHỈ THẲNG VÀO CHỖ CẦN KÉO.

            Chỉ viết "kéo xuống lấy đà" ở dòng chữ phía trên là chưa đủ:
            đọc xong người ta vẫn không biết kéo vào đâu, vì cả cái sân
            chỗ nào cũng kéo được trông như nhau. Mũi tên nhấp nháy dính
            ngay dưới quả cầu thì chỉ đúng vào vật cần kéo.

            Tắt ngay khi tay bắt đầu kéo — chỉ dẫn đã xong việc, để lại
            thì che mất chính thứ nó đang chỉ.
          */}
          {dangCam !== null && !dangKeo && !dangBay && !xong && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-full left-1/2 mt-1 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 5, 0] }}
              transition={{
                opacity: { duration: 0.25 },
                y: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <svg width="14" height="20" viewBox="0 0 14 20">
                <path
                  d="M 7 1 L 7 15 M 2 10 L 7 16 L 12 10"
                  fill="none"
                  stroke={gold}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="mt-0.5 text-[11px] font-bold whitespace-nowrap"
                style={{ color: gold }}
              >
                Kéo xuống
              </span>
            </motion.div>
          )}
        </div>

        {/* Mười quả cầu nằm rải dưới sân */}
        {CHO_NAM.map((cho, n) => {
          const dangChon = dangCam === n;
          return (
            <button
              key={n}
              type="button"
              disabled={xong || dangBay}
              onClick={() => setDangCam(n)}
              aria-label={`Nhặt quả cầu số ${n}`}
              aria-pressed={dangChon}
              className="absolute rounded-full transition-[transform,opacity] duration-200 hover:-translate-y-1 disabled:opacity-40"
              style={{
                left: `${cho.x}%`,
                top: `${cho.y}%`,
                transform: `translate(-50%, -50%) rotate(${cho.r}deg)`,
                // Quả đang cầm trên tay thì mờ đi ở dưới sân, để thấy rõ
                // là nó đã được nhặt lên.
                opacity: dangChon ? 0.25 : 1,
              }}
            >
              <QuaCau so={n} size={46} ink={ink} />
            </button>
          );
        })}
      </div>

      {/* Kết quả */}
      <div className="mt-4 min-h-[104px] text-center">
        {ketQua === "dung" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="font-display text-[24px] font-bold sm:text-[28px]"
              style={{ color: ink }}
            >
              Chuẩn luôn! 🎉
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
            animate={{ x: [0, -8, 8, -5, 5, 0] }}
            transition={{ duration: 0.45 }}
          >
            <p
              className="font-display text-[22px] font-bold sm:text-[25px]"
              style={{ color: ink }}
            >
              Cầu ra ngoài rồi 😅
            </p>
            <p className="mt-2 text-[14.5px]" style={{ color: muted }}>
              Thử lại phát nữa xem.
            </p>
          </motion.div>
        )}

        {(ketQua !== null || daNhap.length > 0) && (
          <button
            type="button"
            onClick={lamLai}
            className="mt-4 text-[12.5px] font-bold tracking-[0.12em] uppercase underline-offset-4 hover:underline"
            style={{ color: gold }}
          >
            Chơi lại
          </button>
        )}
      </div>
    </div>
  );
}
