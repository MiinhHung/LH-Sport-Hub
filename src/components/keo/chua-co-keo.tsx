import { Swords } from "lucide-react";

import { FlowLink } from "@/components/ui/flow-button";

/**
 * Chỗ hiện khi chưa có kèo nào.
 *
 * TRẠNG THÁI RỖNG PHẢI LÀM VIỆC, ĐỪNG XIN LỖI. Bản trước là một hộp
 * viền nét đứt to đùng, giữa hộp một icon bé tẹo và hai dòng chữ xám —
 * chụp ở màn 1536 thì nó chiếm gần hết phần dưới trang mà không nói
 * được điều gì ngoài "ở đây không có gì".
 *
 * Giờ dựng hai thẻ kèo GIẢ, mờ đi ở phía sau, rồi đặt lời mời lên trên.
 * Người chưa từng tạo kèo nhìn một cái là biết kèo trông ra sao: có tên,
 * có tiền cược, có người nhận. Đó là thứ một dòng chữ "tạo kèo đầu tiên"
 * không bao giờ nói được.
 *
 * Hai thẻ giả mang `aria-hidden` và không có liên kết nào: chúng là hình
 * minh hoạ, không phải dữ liệu. Máy đọc màn hình đi thẳng tới lời mời,
 * không phải nghe kể về hai kèo không có thật.
 *
 * Dùng chữ nghiêng mờ chứ không phải tên người thật: bịa ra "Minh Hùng
 * thách Thu Hà" thì có người sẽ tưởng là kèo thật rồi bấm vào.
 */

function TheGia({
  tieuDe,
  cuoc,
  nghieng,
}: {
  tieuDe: string;
  cuoc: string;
  nghieng: string;
}) {
  return (
    <div
      aria-hidden
      className={`rounded-2xl border border-ink-800 bg-ink-900 p-4 shadow-[var(--shadow-soft)] ${nghieng}`}
    >
      <div className="flex items-center gap-2">
        <span className="h-5 w-14 rounded-full bg-ink-850" />
        <span className="h-5 w-16 rounded-full bg-ink-850" />
      </div>
      <p className="font-display mt-3 text-[18px] leading-tight font-bold text-ink-300">
        {tieuDe}
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2 dark:border-gold-400/25 dark:bg-gold-400/10">
        <span className="text-[13px] font-bold text-gold-700 dark:text-gold-300">
          {cuoc}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="size-7 rounded-full bg-ink-850" />
        <span className="size-7 rounded-full bg-ink-850" />
        <span className="ml-auto h-4 w-12 rounded-full bg-ink-850" />
      </div>
    </div>
  );
}

export function ChuaCoKeo({
  tieuDe,
  moTa,
  choTaoKeo,
}: {
  tieuDe: string;
  moTa: string;
  /** Chỉ mời tạo kèo ở tab "đang tìm đối"; tab khác thì rỗng là do bộ lọc. */
  choTaoKeo: boolean;
}) {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl">
      {/* Hai thẻ giả nằm dưới, mờ và hơi nghiêng */}
      <div className="pointer-events-none grid gap-3 p-1 opacity-45 blur-[1.5px] select-none lg:grid-cols-2">
        <TheGia
          tieuDe="Đánh đơn, thua bao nước"
          cuoc="2 chai nước"
          nghieng="-rotate-1"
        />
        <TheGia
          tieuDe="Đôi nam nữ, ai thua bao bữa sáng"
          cuoc="1 bữa sáng"
          nghieng="rotate-1"
        />
      </div>

      {/* Lớp mờ dần để chữ ở trên luôn đọc được, bất kể thẻ giả màu gì */}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-ink-950/85 to-ink-950"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span
          aria-hidden
          className="grid size-11 place-items-center rounded-xl border border-gold-200 bg-gold-50 text-gold-700 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300"
        >
          <Swords className="size-5" />
        </span>

        <h3 className="font-display mt-3.5 text-[19px] font-bold text-ink-100">
          {tieuDe}
        </h3>
        <p className="mt-1.5 max-w-[38ch] text-[13.5px] leading-relaxed text-ink-500">
          {moTa}
        </p>

        {choTaoKeo && (
          <div className="mt-5">
            <FlowLink href="/keo/tao" text="Tạo kèo đầu tiên" />
          </div>
        )}
      </div>
    </div>
  );
}
