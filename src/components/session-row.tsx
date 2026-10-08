import { MapPin, Wallet } from "lucide-react";
import Link from "next/link";

import { AvatarStack } from "@/components/ui";
import { SPORTS, type SportKey } from "@/lib/constants";
import {
  cn,
  dayLabel,
  formatTime,
  formatVnd,
  timeUntil,
  weekdayLabel,
} from "@/lib/utils";

/**
 * Một buổi tập trong danh sách lịch, dạng dòng trên một đường thời gian.
 *
 * BỐN LẦN SỬA MỚI RA HÌNH NÀY. Ba lần đầu hỏng vì ba lý do khác nhau, và
 * cả ba đều chỉ lộ ra khi chụp màn hình lại chứ không lộ ra lúc đọc mã:
 *
 * 1. Lưới hai cột thẻ cao. Xếp đúng thứ tự thời gian nhưng không nhóm,
 *    nên không trả lời được câu người ta thật sự hỏi: "thứ 7 này có đánh
 *    không, ai đi rồi". Trên điện thoại mỗi màn chỉ thấy một buổi rưỡi.
 * 2. Dòng gọn, nhưng dồn avatar, sĩ số, chữ "thiếu 2" và hai cái nút vào
 *    một cột 150px: chữ "đủ người" ĐÈ LÊN nút "Bận", chữ "thiếu" bị cắt,
 *    nhãn "+1 người" tụt xuống hai dòng chồng lên dãy avatar.
 * 3. Tách cột phải làm hai tầng thì hết đè nhau, nhưng "6/8 thiếu 2" vẫn
 *    tràn khỏi 188px, và khoảng giữa dòng thì trống hoác.
 *
 * Bản này chia lại việc: AI ĐI thuộc về cột nội dung (nó là thông tin,
 * và nó lấp đúng chỗ trống), còn cột phải chỉ giữ CÒN MẤY CHỖ và hai cái
 * nút. Mỗi cột một câu hỏi, không cột nào phải gánh hai thứ.
 *
 * THANH CHỖ TRỐNG THAY CHO CHỮ "6/8". Con số phải đọc rồi mới hiểu, còn
 * một thanh gần đầy thì liếc qua là biết sắp đủ. Chữ "thiếu 2" vẫn giữ
 * nhưng chỉ hiện khi còn một hai chỗ — thiếu năm người thì nói ra cũng
 * chẳng giục được ai.
 */

export type SessionRowData = {
  id: string;
  title: string;
  venueName: string;
  sport: string;
  startsAt: Date;
  maxPlayers: number | null;
  costTotal: number | null;
  going: { id: string; fullName: string; avatarUrl: string | null }[];
};

/** Ô ngày, đóng vai một nút trên đường thời gian bên trái. */
function ONgay({ ngay, toi }: { ngay: Date; toi: boolean }) {
  const tz = process.env.NEXT_PUBLIC_TIME_ZONE || "Asia/Ho_Chi_Minh";
  const soNgay = new Intl.DateTimeFormat("vi-VN", {
    timeZone: tz,
    day: "numeric",
  }).format(ngay);
  const thang = new Intl.DateTimeFormat("vi-VN", {
    timeZone: tz,
    month: "numeric",
  }).format(ngay);

  return (
    <div
      className={cn(
        "relative z-10 flex size-[54px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 transition-colors",
        toi
          ? "border-gold-400 bg-gold-400 text-navy-900"
          : "border-ink-800 bg-ink-900 text-ink-100",
      )}
    >
      <span
        className={cn(
          "text-[9.5px] font-bold tracking-[0.08em] uppercase",
          // /75 chứ không phải /70: chữ 9,5px vẫn tính là chữ thường nên
          // cần 4,5:1. Trên nền gold-400 thì /70 ra 4,60 — sát quá, chỉ
          // cần đổi sắc vàng một chút là trượt. /75 ra 5,17.
          toi ? "text-navy-900/75" : "text-ink-500",
        )}
      >
        {weekdayLabel(ngay).replace("Thứ ", "T")}
      </span>
      <span className="tabular font-display text-[21px] leading-none font-bold">
        {soNgay}
      </span>
      <span
        className={cn(
          "text-[9.5px]",
          // Trước là /60 — đo được 3,62:1, không đọc nổi trên nền vàng.
          // Thứ bậc so với dòng thứ ở trên giữ bằng độ đậm nét, không
          // bằng độ mờ, nên hai dòng cùng /75 mà vẫn phân biệt được.
          toi ? "text-navy-900/75" : "text-ink-500",
        )}
      >
        th{thang}
      </span>
    </div>
  );
}

/** Thanh chỗ trống. Không đặt giới hạn người thì không vẽ gì cả. */
function ThanhCho({ di, toiDa }: { di: number; toiDa: number | null }) {
  if (toiDa === null) return null;
  const phan = Math.min(1, di / toiDa);

  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-ink-800"
      role="img"
      aria-label={`${di} trên ${toiDa} người`}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          phan >= 1 ? "bg-emerald-500" : "bg-gold-400",
        )}
        style={{ width: `${phan * 100}%` }}
      />
    </div>
  );
}

export function SessionRow({
  session,
  toi,
  sapToiNhat,
  rsvp,
}: {
  session: SessionRowData;
  /** Mình đã nhận đi buổi này. */
  toi: boolean;
  /** Buổi gần nhất trong cả danh sách: cho nổi hơn một bậc. */
  sapToiNhat?: boolean;
  rsvp: React.ReactNode;
}) {
  const sport = SPORTS[session.sport as SportKey];
  const di = session.going.length;
  const isFull = session.maxPlayers !== null && di >= session.maxPlayers;
  const conThieu = session.maxPlayers !== null ? session.maxPlayers - di : null;
  const nhanNgay = dayLabel(session.startsAt);

  return (
    <li
      className={cn(
        "relative flex gap-3.5 px-3 py-4 transition-colors sm:gap-4 sm:px-4",
        toi && "bg-gold-50/70 dark:bg-gold-400/[0.07]",
      )}
    >
      {/*
        Đoạn đường thời gian, vẽ TRONG từng dòng chứ không phải một vạch
        dài vẽ sau cả danh sách. Bản trước vẽ ở ngoài rồi bị chính nền của
        thẻ danh sách phủ kín, nên chụp lại không thấy gì. Vẽ trong dòng
        thì nó nối liền qua mọi dòng bất kể dòng đó có nền vàng hay không.

        Toạ độ: lề 12px (sm: 16px) cộng nửa ô ngày 27px. Đã đo lại trên
        trang dựng thật: vạch nằm đúng x=124 trùng tâm ô ngày.

        Dùng ink-700 chứ không ink-800. Bản trước để ink-800 (#e4e9f2) —
        đúng màu viền — và chụp lại thì không thấy gì: trên nền thẻ trắng
        nó nhạt tới mức coi như không có.
      */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-[39px] w-px bg-ink-700 sm:left-[43px]"
      />

      {/* Vạch vàng mép trái khi mình có đi: thấy ngay buổi nào của mình
          mà không phải đọc chữ. */}
      {toi && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-gold-400"
        />
      )}

      <ONgay ngay={session.startsAt} toi={toi} />

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {/* Nội dung, và cả "ai đi" — vì đó là thông tin, không phải điều
            khiển, và nó lấp đúng chỗ trống giữa dòng. */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {sapToiNhat && (
              <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[9.5px] font-bold tracking-[0.1em] text-white uppercase dark:bg-gold-400 dark:text-navy-900">
                Sắp tới
              </span>
            )}
            {nhanNgay && (
              <span className="text-[11.5px] font-bold text-gold-700 dark:text-gold-300">
                {nhanNgay}
              </span>
            )}
            <span className="tabular text-[12.5px] font-bold text-ink-200">
              {formatTime(session.startsAt)}
            </span>
            <span className="text-[12px] text-ink-500">
              {sport.icon} {sport.label}
            </span>
            {!nhanNgay && (
              <span className="text-[11.5px] text-ink-500">
                {timeUntil(session.startsAt)}
              </span>
            )}
          </div>

          <h3 className="mt-1.5">
            <Link
              href={`/buoi-tap/${session.id}`}
              className="font-display text-[18px] leading-tight font-bold text-ink-100 transition-colors hover:text-link sm:text-[20px]"
            >
              {session.title}
            </Link>
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[12.5px] text-ink-400">
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-ink-500" aria-hidden />
              <span className="truncate">{session.venueName}</span>
            </span>
            {session.costTotal !== null && di > 0 && (
              <span className="flex items-center gap-1.5">
                <Wallet
                  className="size-3.5 shrink-0 text-ink-500"
                  aria-hidden
                />
                ~{formatVnd(Math.round(session.costTotal / di))}/người
              </span>
            )}
          </div>

          {di > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <AvatarStack people={session.going} max={5} showRest={false} />
              <span className="min-w-0 truncate text-[12px] text-ink-500">
                {session.going
                  .slice(0, 2)
                  .map((p) => p.fullName.split(" ").slice(-1)[0])
                  .join(", ")}
                {di > 2 ? ` và ${di - 2} người nữa` : ""}
              </span>
            </div>
          )}
        </div>

        {/*
          Cột phải chỉ trả lời một câu: còn mấy chỗ, và tôi bấm gì. Bề
          ngang 150px là đủ vì sĩ số giờ đứng một mình, không phải chen
          với dãy avatar như hai bản trước.
        */}
        <div className="flex flex-col gap-2 sm:w-[150px] sm:shrink-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="tabular text-[13px] font-bold text-ink-200">
              {di}
              {session.maxPlayers ? `/${session.maxPlayers}` : " người"}
            </span>
            {conThieu !== null && conThieu > 0 && conThieu <= 2 && (
              <span className="shrink-0 text-[11.5px] font-bold text-gold-700 dark:text-gold-300">
                thiếu {conThieu}
              </span>
            )}
            {isFull && (
              <span className="shrink-0 text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                đủ người
              </span>
            )}
          </div>

          <ThanhCho di={di} toiDa={session.maxPlayers} />

          {rsvp}
        </div>
      </div>
    </li>
  );
}
