import { SportIcon } from "@/components/domain-icons";
import { ArrowUpRight, Clock, MapPin, Wallet } from "@/components/icons";
import Link from "next/link";

import { AvatarStack } from "@/components/ui";
import { SPORTS, type SportKey } from "@/lib/constants";
import { directionsUrl } from "@/lib/maps";
import { cn, dateTile, formatTime, formatVnd, timeUntil } from "@/lib/utils";

/**
 * Một buổi tập trong danh sách lịch (dạng agenda: ô ngày bên trái, các
 * buổi của ngày đó xếp bên phải).
 *
 * BỐN LẦN SỬA MỚI RA CÁCH CHIA CỘT NÀY. Ba lần đầu hỏng vì ba lý do khác
 * nhau, và cả ba đều chỉ lộ ra khi chụp màn hình lại chứ không lộ ra lúc
 * đọc mã:
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
 * và nó lấp đúng chỗ trống), còn cột phải chỉ giữ CÒN MẤY CHỖ và nút báo
 * đi. Mỗi cột một câu hỏi, không cột nào phải gánh hai thứ.
 *
 * THANH CHỖ TRỐNG THAY CHO CHỮ "6/8". Con số phải đọc rồi mới hiểu, còn
 * một thanh gần đầy thì liếc qua là biết sắp đủ. Chữ "thiếu 2" vẫn giữ
 * nhưng chỉ hiện khi còn một hai chỗ: thiếu năm người thì nói ra cũng
 * chẳng giục được ai.
 */

export type SessionRowData = {
  id: string;
  title: string;
  venueName: string;
  venueAddress: string | null;
  mapUrl: string | null;
  sport: string;
  startsAt: Date;
  endsAt: Date;
  maxPlayers: number | null;
  costTotal: number | null;
  going: { id: string; fullName: string; avatarUrl: string | null }[];
};

/**
 * Ô lịch kiểu tờ lịch xé, cùng dáng với `DateTile` ở cột phải Bảng tin.
 * Hôm nay thì dải trên đổi sang vàng để thấy ngay mốc hiện tại.
 */
export function ONgay({
  ngay,
  homNay,
  lon,
  className,
}: {
  ngay: Date;
  homNay?: boolean;
  /** Bản to cho đầu trang chi tiết. */
  lon?: boolean;
  className?: string;
}) {
  const t = dateTile(ngay);
  return (
    <span
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-lg border border-ink-800 bg-ink-900 text-center",
        lon ? "w-16 rounded-xl sm:w-[72px]" : "w-12",
        className,
      )}
    >
      <span
        className={cn(
          "font-semibold",
          lon ? "py-1 text-[12px]" : "py-0.5 text-[10.5px]",
          homNay ? "bg-gold-400 text-navy-900" : "bg-navy-900 text-gold-300",
        )}
      >
        {t.thu}
      </span>
      <span
        className={cn(
          "tabular font-display leading-none font-bold text-ink-100",
          lon ? "pt-1.5 text-[28px] sm:text-[30px]" : "pt-1 text-[19px]",
        )}
      >
        {t.ngay}
      </span>
      <span
        className={cn(
          "font-medium text-ink-500",
          lon ? "pt-1 pb-1.5 text-[12px]" : "pt-0.5 pb-1 text-[10.5px]",
        )}
      >
        {t.thang}
      </span>
    </span>
  );
}

/** Thanh chỗ trống. Không đặt giới hạn người thì không vẽ gì cả. */
export function ThanhCho({
  di,
  toiDa,
  className,
}: {
  di: number;
  toiDa: number | null;
  className?: string;
}) {
  if (toiDa === null) return null;
  const phan = Math.min(1, di / toiDa);

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-ink-850",
        className,
      )}
      role="img"
      aria-label={`${di} trên ${toiDa} người`}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          phan >= 1 ? "bg-emerald-500" : "bg-gold-400",
        )}
        style={{ width: `${phan * 100}%` }}
      />
    </div>
  );
}

/** "3 tiếng", "1 tiếng 30 phút" */
export function doDai(tu: Date, den: Date): string {
  const phut = Math.max(0, Math.round((den.getTime() - tu.getTime()) / 60_000));
  const gio = Math.floor(phut / 60);
  const du = phut % 60;
  if (gio === 0) return `${du} phút`;
  return du === 0 ? `${gio} tiếng` : `${gio} tiếng ${du} phút`;
}

export function SessionRow({
  session,
  rsvp,
}: {
  session: SessionRowData;
  rsvp: React.ReactNode;
}) {
  const sport = SPORTS[session.sport as SportKey];
  const di = session.going.length;
  const isFull = session.maxPlayers !== null && di >= session.maxPlayers;
  const conThieu = session.maxPlayers !== null ? session.maxPlayers - di : null;
  const chiDuong = directionsUrl(
    session.venueName,
    session.venueAddress,
    session.mapUrl,
  );

  return (
    <article className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      {/*
        CỘT GIỜ TO BÊN TRÁI. Câu đầu tiên ai mở lịch cũng hỏi là "mấy giờ
        đánh", nên giờ bắt đầu là con số to nhất dòng, giờ kết thúc và độ
        dài nằm ngay dưới — liếc là đọc được cả khung giờ.
      */}
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="flex w-[64px] shrink-0 flex-col items-center rounded-xl bg-ink-850 px-2 py-2.5 text-center">
          <span className="tabular font-display text-[19px] leading-none font-bold text-ink-100">
            {formatTime(session.startsAt)}
          </span>
          <span aria-hidden className="my-1.5 h-3 w-px bg-ink-700" />
          <span className="tabular text-[12.5px] leading-none font-semibold text-ink-400">
            {formatTime(session.endsAt)}
          </span>
          <span className="mt-1.5 text-[10.5px] leading-tight font-medium text-ink-500">
            {doDai(session.startsAt, session.endsAt)}
          </span>
          <span className="sr-only">
            Từ {formatTime(session.startsAt)} đến {formatTime(session.endsAt)}
          </span>
        </div>

        {/* Nội dung, và cả "ai đi": đó là thông tin, không phải điều khiển. */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-500">
            <span className="flex items-center gap-1 font-semibold text-gold-700 dark:text-gold-300">
              <SportIcon sport={session.sport as SportKey} />
              {sport.label}
            </span>
            <span aria-hidden className="text-ink-600">
              ·
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 shrink-0" />
              {timeUntil(session.startsAt)}
            </span>
          </div>

          <h4 className="mt-1">
            <Link
              href={`/buoi-tap/${session.id}`}
              className="text-[16px] leading-snug font-semibold text-ink-100 transition-colors hover:text-link"
            >
              {session.title}
            </Link>
          </h4>

          {/* Sân: tên đậm, địa chỉ ngay dưới, chỉ đường một chạm */}
          <div className="mt-2 flex min-w-0 items-start gap-2 text-[13px]">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold-700 dark:text-gold-300" />
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold text-ink-200">
                  {session.venueName}
                </span>
                {chiDuong && (
                  <a
                    href={chiDuong}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-link hover:underline"
                  >
                    Chỉ đường
                    <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                )}
              </p>
              {session.venueAddress && (
                <p className="truncate text-[12.5px] text-ink-500">
                  {session.venueAddress}
                </p>
              )}
            </div>
          </div>

          {session.costTotal !== null && di > 0 && (
            <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-500">
              <Wallet className="size-4 shrink-0" />
              <span className="tabular">
                ~{formatVnd(Math.round(session.costTotal / di))}/người
              </span>
            </p>
          )}

        {di > 0 ? (
          <div className="mt-2.5 flex items-center gap-2">
            <AvatarStack
              people={session.going}
              max={5}
              size="xs"
              showRest={false}
            />
            <span className="min-w-0 truncate text-[12.5px] text-ink-500">
              {session.going
                .slice(0, 2)
                .map((p) => p.fullName.split(" ").slice(-1)[0])
                .join(", ")}
              {di > 2 ? ` và ${di - 2} người nữa` : ""}
            </span>
          </div>
        ) : (
          <p className="mt-2.5 text-[12.5px] text-ink-500">
            Chưa ai nhận đi.
          </p>
        )}
        </div>
      </div>

      {/*
        Cột phải chỉ trả lời một câu: còn mấy chỗ, và tôi bấm gì. Sĩ số
        đứng một mình, không phải chen với dãy avatar như các bản trước.
      */}
      <div className="flex flex-col gap-2 sm:w-[168px] sm:shrink-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="tabular text-[13px] font-bold text-ink-200">
            {di}
            {session.maxPlayers ? `/${session.maxPlayers}` : " người"}
            <span className="ml-1 font-medium text-ink-500">đi</span>
          </span>
          {conThieu !== null && conThieu > 0 && conThieu <= 2 && (
            <span className="shrink-0 text-[12px] font-semibold text-gold-700 dark:text-gold-300">
              thiếu {conThieu}
            </span>
          )}
          {isFull && (
            <span className="shrink-0 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
              đủ người
            </span>
          )}
        </div>

        <ThanhCho di={di} toiDa={session.maxPlayers} />

        {rsvp}
      </div>
    </article>
  );
}
