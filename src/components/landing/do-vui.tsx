"use client";

import { motion, useAnimate, useMotionValue } from "motion/react";
import * as React from "react";

/**
 * Đố vui cuối trang chủ: bắn ná để điền ngày thành lập công ty.
 *
 * Cách chơi: bấm một con số ở hàng dưới để nạp lên ná, kéo túi ná xuống
 * rồi thả — viên số bay lên rơi vào ô đang chờ. Điền đủ thì tự chấm.
 *
 * KHÔNG BẮT NGƯỜI CHƠI NGẮM. Ná chỉ cần kéo đủ mạnh là viên số vào đúng
 * ô; kéo yếu quá thì nó tuột về chứ không bắn hụt. Đây là câu đố về ngày
 * thành lập, không phải trò thi bắn cung — bắt ngắm thì người trả lời
 * đúng vẫn có thể thua, mà thua vì tay chứ không vì không biết.
 *
 * CÓ ĐƯỜNG CHƠI KHÔNG CẦN KÉO. Kéo thả là thao tác chuột/cảm ứng; ai
 * dùng bàn phím sẽ kẹt ở bước bắn. Nên chính viên số trên ná cũng là một
 * cái nút: bấm hoặc Enter là nó bay.
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

/** Bao nhiêu pixel kéo xuống thì coi là đủ lực bắn. */
const LUC_TOI_THIEU = 28;

/** Kéo xa nhất chừng này, quá thì dây không giãn thêm. */
const KEO_TOI_DA = 120;

function ChuThich({ text, color }: { text: string; color: string }) {
  return (
    <p className="mt-2 text-[12.5px]" style={{ color }}>
      {text}
    </p>
  );
}

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
  const [dangTai, setDangTai] = React.useState<number | null>(null);
  const [dangBay, setDangBay] = React.useState(false);
  const [ketQua, setKetQua] = React.useState<null | "dung" | "sai">(null);

  const khungRef = React.useRef<HTMLDivElement>(null);
  const naRef = React.useRef<HTMLDivElement>(null);
  const oRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [scope, animate] = useAnimate();

  // Độ căng của dây ná, theo pixel kéo xuống.
  const kx = useMotionValue(0);
  const ky = useMotionValue(0);
  const [dangKeo, setDangKeo] = React.useState(false);

  const oDangCho = daNhap.length;
  const xong = daNhap.length === soO;

  const lamLai = () => {
    setDaNhap([]);
    setDangTai(null);
    setKetQua(null);
  };

  /** Cho viên số bay từ ná lên ô đang chờ, rồi mới ghi vào kết quả. */
  const ban = React.useCallback(async () => {
    if (dangTai === null || dangBay || xong) return;

    const khung = khungRef.current;
    const na = naRef.current;
    const o = oRefs.current[oDangCho];
    if (!khung || !na || !o) return;

    setDangBay(true);
    kx.set(0);
    ky.set(0);

    const k = khung.getBoundingClientRect();
    const a = na.getBoundingClientRect();
    const b = o.getBoundingClientRect();

    const x0 = a.left - k.left + a.width / 2;
    const y0 = a.top - k.top + a.height / 2;
    const x1 = b.left - k.left + b.width / 2;
    const y1 = b.top - k.top + b.height / 2;

    const it = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (it) {
      // Bật giảm chuyển động thì bỏ luôn đường bay, đặt thẳng vào ô.
      setDaNhap((cu) => [...cu, String(dangTai)]);
      setDangTai(null);
      setDangBay(false);
      return;
    }

    await animate(
      scope.current,
      {
        // Điểm giữa nhô cao hơn cả hai đầu — đó là cái làm ra đường vòng
        // cung. Đi thẳng thì giống viên số bị hút chứ không phải bị bắn.
        x: [x0, (x0 + x1) / 2, x1],
        y: [y0, Math.min(y0, y1) - 90, y1],
        scale: [1, 1.08, 0.9],
        opacity: [1, 1, 0],
      },
      { duration: 0.52, ease: [0.3, 0, 0.2, 1] },
    );

    setDaNhap((cu) => [...cu, String(dangTai)]);
    setDangTai(null);
    setDangBay(false);
  }, [animate, dangBay, dangTai, kx, ky, oDangCho, scope, xong]);

  // Chấm bài khi vừa đủ số.
  React.useEffect(() => {
    if (daNhap.length !== soO) return;
    setKetQua(daNhap.join("") === dapAn ? "dung" : "sai");
  }, [daNhap, dapAn, soO]);

  const batDauKeo = (e: React.PointerEvent) => {
    if (dangTai === null || dangBay) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDangKeo(true);
  };

  const dangKeoTay = (e: React.PointerEvent) => {
    if (!dangKeo) return;
    const na = naRef.current;
    if (!na) return;
    const r = na.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const d = Math.min(Math.hypot(dx, dy), KEO_TOI_DA);
    const goc = Math.atan2(dy, dx);
    kx.set(Math.cos(goc) * d);
    // Chỉ cho kéo xuống: kéo lên thì viên số sẽ phải bay xuống dưới, mà
    // mấy cái ô lại nằm phía trên.
    ky.set(Math.max(0, Math.sin(goc) * d));
  };

  const thaTay = () => {
    if (!dangKeo) return;
    setDangKeo(false);
    const du = ky.get() >= LUC_TOI_THIEU;
    if (du) {
      void ban();
    } else {
      // Chưa đủ lực thì dây tuột về, không mất lượt.
      kx.set(0);
      ky.set(0);
    }
  };

  return (
    <div ref={khungRef} className="relative mx-auto max-w-xl">
      {/* Ô đáp án */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
        role="group"
        aria-label="Ngày thành lập, tám chữ số"
      >
        {Array.from({ length: soO }).map((_, i) => (
          <React.Fragment key={i}>
            <div
              ref={(el) => {
                oRefs.current[i] = el;
              }}
              className="font-display grid size-11 place-items-center rounded-xl border-2 text-[20px] font-bold transition-colors duration-200 sm:size-12 sm:text-[22px]"
              style={{
                borderColor:
                  ketQua === "sai"
                    ? "#e11d48"
                    : ketQua === "dung"
                      ? gold
                      : i === oDangCho
                        ? gold
                        : line,
                color: ink,
                background: i === oDangCho && !xong ? `${gold}12` : "transparent",
              }}
            >
              {daNhap[i] ?? ""}
            </div>

            {/* Gạch chia ngày / tháng / năm cho dễ đọc */}
            {(i === 1 || i === 3) && (
              <span aria-hidden className="text-[18px]" style={{ color: line }}>
                /
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {ketQua === null && (
        <ChuThich
          text={
            dangTai === null
              ? "Bấm một con số ở dưới để nạp lên ná."
              : "Kéo viên số xuống rồi thả — hoặc bấm thẳng vào nó."
          }
          color={muted}
        />
      )}

      {/* Viên số đang bay. Nằm ngoài luồng, chỉ hiện trong lúc bay. */}
      <motion.div
        ref={scope}
        aria-hidden
        className="font-display pointer-events-none absolute top-0 left-0 z-20 grid size-11 place-items-center rounded-xl text-[20px] font-bold shadow-lg"
        style={{
          background: gold,
          color: "#00112e",
          opacity: 0,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        {dangTai ?? ""}
      </motion.div>

      {/* Cái ná */}
      <div className="mt-10 flex flex-col items-center">
        <div className="relative h-28 w-24">
          <svg
            viewBox="0 0 96 112"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            {/* Dây: nối hai chạc tới túi, co giãn theo tay kéo */}
            <motion.path
              d="M 22 26 L 48 40 L 74 26"
              fill="none"
              stroke={gold}
              strokeWidth={3}
              strokeLinecap="round"
              style={{
                // Dây chỉ là trang trí ăn theo túi; vẽ lại bằng transform
                // rẻ hơn tính lại đường path mỗi khung hình.
                translateY: ky,
                translateX: kx,
              }}
            />
            {/* Hai chạc và cán */}
            <path
              d="M 22 26 L 30 58 Q 48 74 66 58 L 74 26"
              fill="none"
              stroke={ink}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 48 70 L 48 106"
              stroke={ink}
              strokeWidth={9}
              strokeLinecap="round"
            />
          </svg>

          {/* Túi ná — cũng là viên số đang nạp, và cũng là nút bắn */}
          <motion.div
            ref={naRef}
            style={{ x: kx, y: ky }}
            className="absolute top-[34px] left-1/2 -translate-x-1/2"
          >
            <button
              type="button"
              disabled={dangTai === null || dangBay || xong}
              onPointerDown={batDauKeo}
              onPointerMove={dangKeoTay}
              onPointerUp={thaTay}
              onPointerCancel={thaTay}
              onClick={() => {
                // Bấm thường (không kéo) cũng bắn — đường chơi cho bàn phím.
                if (!dangKeo) void ban();
              }}
              aria-label={
                dangTai === null
                  ? "Chưa nạp số nào"
                  : `Bắn số ${dangTai} vào ô thứ ${oDangCho + 1}`
              }
              className="font-display grid size-11 cursor-grab touch-none place-items-center rounded-xl text-[20px] font-bold shadow-md transition-opacity active:cursor-grabbing disabled:opacity-0"
              style={{ background: gold, color: "#00112e" }}
            >
              {dangTai ?? ""}
            </button>
          </motion.div>
        </div>

        {/* Hàng số để chọn */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: 10 }).map((_, n) => (
            <button
              key={n}
              type="button"
              disabled={xong || dangBay}
              onClick={() => setDangTai(n)}
              aria-label={`Nạp số ${n}`}
              aria-pressed={dangTai === n}
              className="font-display size-10 rounded-xl border text-[17px] font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40"
              style={{
                borderColor: dangTai === n ? gold : line,
                background: dangTai === n ? `${gold}1f` : "transparent",
                color: ink,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Kết quả */}
      <div className="mt-8 min-h-[104px] text-center">
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
              Chưa đúng rồi 😅
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
