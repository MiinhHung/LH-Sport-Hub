import Link from "next/link";

import { ArrowRight, Swords } from "@/components/icons";
import { Avatar, Card } from "@/components/ui";
import type { DoiDau } from "@/lib/queries";
import { cn, timeAgo } from "@/lib/utils";

/**
 * Tỉ số đối đầu giữa người đang xem và người trong hồ sơ.
 *
 * KHỐI NÀY LÀ LÝ DO TRANG CÁ NHÂN TỒN TẠI.
 *
 * Số liệu chung của một người — đánh bao nhiêu, thắng bao nhiêu — thì
 * bảng phong thần đã có. Mở hồ sơ của một người trong team ra, câu hỏi
 * thật sự trong đầu là "mình với người này ai hơn ai". Đó là câu mà
 * không trang nào khác trong app trả lời được, và cũng là thứ trang cá
 * nhân của mạng xã hội thường không có.
 *
 * CHƯA ĐÁNH TRẬN NÀO THÌ KHÔNG HIỆN SỐ 0-0. Một cái tỉ số rỗng trông
 * như hai người đã đánh và hoà, trong khi sự thật là chưa gặp nhau bao
 * giờ. Nói thẳng ra bằng chữ, và biến nó thành một lời mời.
 */
type Nguoi = { id: string; fullName: string; avatarUrl: string | null };

/** Một bên của bảng tỉ số: ảnh, tên, con số to. */
function Ben({
  nguoi,
  ten,
  so,
  dan,
  phai,
}: {
  nguoi?: Nguoi;
  ten: string;
  so: number;
  /** Bên đang dẫn: số màu vàng. */
  dan: boolean;
  /** Bên phải thì đảo chiều để hai con số áp vào giữa. */
  phai?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        phai ? "flex-row-reverse text-right" : "",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3",
          phai ? "items-end sm:flex-row-reverse" : "items-start",
        )}
      >
        {nguoi && (
          <Avatar
            name={nguoi.fullName}
            src={nguoi.avatarUrl}
            seed={nguoi.id}
            size="md"
            className="ring-2 ring-white/10"
          />
        )}
        <span className="w-full truncate text-[13.5px] font-semibold text-white sm:w-auto">
          {ten}
        </span>
      </div>
      <span
        className={cn(
          "tabular font-display shrink-0 text-[44px] leading-none font-bold sm:text-[52px]",
          dan ? "text-gold-300" : "text-white/60",
        )}
      >
        {so}
      </span>
    </div>
  );
}

export function KhoiDoiDau({
  doiDau,
  tenHo,
  moi,
  ban,
  ho,
}: {
  doiDau: DoiDau;
  /** Tên ngắn của người trong hồ sơ, dùng trong câu chữ. */
  tenHo: string;
  /** Nút "Thách luôn" — hiện khi hai người chưa từng gặp. */
  moi?: React.ReactNode;
  /** Người đang xem và người trong hồ sơ, để đặt ảnh lên bảng tỉ số. */
  ban?: Nguoi;
  ho?: Nguoi;
}) {
  if (doiDau.tong === 0) {
    return (
      <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink-850 text-ink-300"
        >
          <Swords className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-ink-100">Đối đầu</p>
          <p className="mt-0.5 text-[13.5px] text-ink-500">
            Bạn và {tenHo} chưa đánh với nhau trận nào.
          </p>
        </div>
        {moi && <div className="shrink-0">{moi}</div>}
      </Card>
    );
  }

  const { banThang, hoThang } = doiDau;
  const banDanDau = banThang > hoThang;
  const hoa = banThang === hoThang;

  return (
    <section aria-labelledby="doi-dau">
      <Card className="overflow-hidden">
        <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
          <h2 id="doi-dau" className="text-[16px] font-semibold text-ink-100">
            Đối đầu
          </h2>
          <span className="tabular text-[12.5px] text-ink-500">
            {doiDau.tong} trận đã chốt
          </span>
        </div>

        {/* Bảng tỉ số kiểu sân đấu: nền navy, hai con số áp vào giữa,
            bên dẫn sáng màu vàng. */}
        <div className="mx-3 rounded-xl bg-navy-900 px-4 py-5 sm:mx-4 sm:px-6">
          <p className="sr-only">
            Tỉ số: bạn {banThang}, {tenHo} {hoThang}.
          </p>
          <div
            aria-hidden
            className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-5"
          >
            <Ben
              nguoi={ban}
              ten="Bạn"
              so={banThang}
              dan={banDanDau}
            />
            <span className="font-display text-[28px] leading-none font-bold text-white/40">
              -
            </span>
            <Ben
              nguoi={ho}
              ten={tenHo}
              so={hoThang}
              dan={!banDanDau && !hoa}
              phai
            />
          </div>
        </div>

        <p className="px-4 pt-3 text-center text-[13px] font-semibold text-ink-300 sm:px-5">
          {hoa
            ? `Hoà nhau sau ${doiDau.tong} trận`
            : banDanDau
              ? `Bạn đang dẫn sau ${doiDau.tong} trận`
              : `${tenHo} đang dẫn sau ${doiDau.tong} trận`}
        </p>

        {doiDau.ganNhat ? (
          <Link
            href={`/keo/${doiDau.ganNhat.id}`}
            className="mt-3 flex items-center gap-2 border-t border-ink-800 px-4 py-3 text-[12.5px] transition-colors hover:bg-ink-850 sm:px-5"
          >
            <span className="shrink-0 text-ink-500">Gần nhất</span>
            <span className="min-w-0 flex-1 truncate font-semibold text-ink-200">
              {doiDau.ganNhat.title}
            </span>
            {doiDau.ganNhat.completedAt && (
              <span className="shrink-0 text-ink-500">
                {timeAgo(doiDau.ganNhat.completedAt)}
              </span>
            )}
            <ArrowRight className="size-3.5 shrink-0 text-ink-500" aria-hidden />
          </Link>
        ) : (
          <div className="h-4" />
        )}
      </Card>
    </section>
  );
}
