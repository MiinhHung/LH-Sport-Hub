import Link from "next/link";

import { Card } from "@/components/ui";
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
 * CHƯA ĐÁNH TRẬN NÀO THÌ KHÔNG HIỆN SỐ 0–0. Một cái tỉ số rỗng trông
 * như hai người đã đánh và hoà, trong khi sự thật là chưa gặp nhau bao
 * giờ. Nói thẳng ra bằng chữ, và biến nó thành một lời mời.
 */
export function KhoiDoiDau({
  doiDau,
  tenHo,
  moi,
}: {
  doiDau: DoiDau;
  /** Tên ngắn của người trong hồ sơ, dùng trong câu chữ. */
  tenHo: string;
  /** Nút "Thách luôn" — hiện khi hai người chưa từng gặp. */
  moi?: React.ReactNode;
}) {
  if (doiDau.tong === 0) {
    return (
      <Card className="p-5 text-center">
        <p className="text-[13.5px] text-ink-400">
          Bạn và {tenHo} chưa đánh với nhau trận nào.
        </p>
        {moi && <div className="mt-3.5 flex justify-center">{moi}</div>}
      </Card>
    );
  }

  const { banThang, hoThang } = doiDau;
  const banDanDau = banThang > hoThang;
  const hoa = banThang === hoThang;

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-5 text-center">
        <p className="text-[10.5px] font-bold tracking-[0.16em] text-ink-500 uppercase">
          Bạn và {tenHo}
        </p>

        {/* Hai con số to, bên thắng nhiều hơn thì đậm màu vàng. Dấu gạch
            ở giữa cố ý mảnh và mờ: thứ cần đọc là hai con số. */}
        <p className="font-display mt-2 flex items-center justify-center gap-3 text-[38px] leading-none font-bold sm:text-[44px]">
          <span
            className={cn(
              "tabular",
              banDanDau
                ? "text-gold-700 dark:text-gold-300"
                : hoa
                  ? "text-ink-200"
                  : "text-ink-500",
            )}
          >
            {banThang}
          </span>
          <span aria-hidden className="text-[26px] font-normal text-ink-700">
            –
          </span>
          <span
            className={cn(
              "tabular",
              !banDanDau && !hoa
                ? "text-gold-700 dark:text-gold-300"
                : hoa
                  ? "text-ink-200"
                  : "text-ink-500",
            )}
          >
            {hoThang}
          </span>
        </p>

        <p className="mt-2 text-[12.5px] text-ink-500">
          {hoa
            ? `Hoà nhau sau ${doiDau.tong} trận`
            : banDanDau
              ? `Bạn đang dẫn sau ${doiDau.tong} trận`
              : `${tenHo} đang dẫn sau ${doiDau.tong} trận`}
        </p>
      </div>

      {doiDau.ganNhat && (
        <Link
          href={`/keo/${doiDau.ganNhat.id}`}
          className="mt-4 flex items-center gap-2 border-t border-ink-800 px-5 py-3 text-[12.5px] transition-colors hover:bg-ink-850"
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
        </Link>
      )}
    </Card>
  );
}
