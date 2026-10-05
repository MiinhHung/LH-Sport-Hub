"use client";

import { CalendarClock, MapPin } from "lucide-react";

import { Avatar, Card, Dot, MetaLine } from "@/components/ui";
import {
  CHALLENGE_FORMATS,
  SPORTS,
  STAKES,
  formatStake,
  type ChallengeFormatKey,
  type SportKey,
  type StakeKey,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

type NguoiChoi = { id: string; fullName: string; avatarUrl: string | null };

/**
 * Thẻ kèo thu nhỏ, cập nhật theo từng ô đang gõ.
 *
 * VÌ SAO CẦN. Ở màn 1440 biểu mẫu tạo kèo chỉ rộng 672px, nửa phải
 * trang trống trơn suốt 1620px chiều cao. Mà thứ người ta thật sự muốn
 * biết khi điền — "cái kèo này hiện ra sẽ trông thế nào, có ai hiểu
 * mình đang thách gì không" — thì phải bấm Tạo rồi mới thấy.
 *
 * Cố ý DỰNG LẠI chứ không tái sử dụng `ChallengeCard`: thẻ thật cần một
 * bản ghi kèo đầy đủ (id, trạng thái, danh sách người tham gia kèm hồ
 * sơ, kết quả). Nặn ra một đối tượng giả đủ các trường đó để nuôi một
 * cái xem trước thì rủi ro hơn nhiều so với việc chép lại vài chục dòng
 * JSX — nhất là khi thẻ thật đổi hình dạng, bản giả sẽ gãy ngầm.
 *
 * Đổi lại, chỗ này phải đi cùng `challenge-card.tsx` bằng mắt. Chi tiết
 * quan trọng nhất là dải phần thưởng gạch vàng: đó là thứ người ta nhìn
 * đầu tiên trên thẻ thật.
 */
export function XemTruocKeo({
  title,
  sport,
  format,
  kind,
  pointsTarget,
  stakeType,
  stakeQty,
  stakeNote,
  nguoiTao,
  doiThu,
  dongDoi,
  buoiTap,
  hanDanh,
}: {
  title: string;
  sport: SportKey;
  format: ChallengeFormatKey;
  kind: "open" | "direct";
  pointsTarget: number | "";
  stakeType: StakeKey;
  stakeQty: number;
  stakeNote: string;
  nguoiTao: NguoiChoi;
  doiThu: NguoiChoi[];
  dongDoi: NguoiChoi | null;
  buoiTap: string | null;
  hanDanh: string;
}) {
  const spec = CHALLENGE_FORMATS[format];
  const stake = STAKES[stakeType];

  const doiA = [nguoiTao, ...(dongDoi ? [dongDoi] : [])];
  const doiB = doiThu;

  const han = hanDanh ? new Date(hanDanh) : null;
  const hanHopLe = han && !Number.isNaN(han.getTime()) ? han : null;

  return (
    <Card className="p-4">
      <MetaLine
        items={[
          <span key="tt" className="flex items-center gap-1.5">
            <Dot tone="lime" />
            {kind === "open" ? "Đang tìm đối" : "Chờ nhận lời"}
          </span>,
          `${SPORTS[sport].icon} ${spec.label}`,
          format === "free"
            ? "Không tính điểm"
            : pointsTarget === ""
              ? "Chưa chốt điểm"
              : `${pointsTarget} điểm`,
        ]}
      />

      <p className="font-display mt-2 text-[20px] leading-tight font-bold text-ink-100">
        {title.trim() || (
          <span className="text-ink-600 italic">Kèo chưa có tên</span>
        )}
      </p>

      {/* Hai đội. Ô trống là chỗ chưa ai nhận — đúng như thẻ thật. */}
      <div className="mt-4 flex items-center gap-3">
        <Ben nguoi={doiA} suc={spec.playersPerTeam} canhPhai={false} />
        <span
          aria-hidden
          className="font-display shrink-0 text-[12px] font-bold text-ink-600 italic"
        >
          VS
        </span>
        <Ben nguoi={doiB} suc={spec.playersPerTeam} canhPhai />
      </div>

      <div className="mt-4 flex items-center gap-3 border-t-2 border-gold-300 pt-3.5">
        <span className="text-[22px] leading-none" aria-hidden>
          {stake.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] leading-tight font-bold text-gold-700 dark:text-gold-300">
            {stakeType === "khac" && !stakeNote.trim() ? (
              <span className="text-ink-600 italic">Chưa ghi phần thưởng</span>
            ) : (
              formatStake(stakeType, stakeQty, stakeNote)
            )}
          </p>
          <p className="mt-0.5 text-[10.5px] font-semibold tracking-[0.12em] text-ink-500 uppercase">
            Đội thua bao đội thắng
          </p>
        </div>
      </div>

      {(buoiTap || hanHopLe) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] text-ink-500">
          {buoiTap && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{buoiTap}</span>
            </span>
          )}
          {hanHopLe && (
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3.5 shrink-0" aria-hidden />
              Hạn {formatDateTime(hanHopLe)}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

function Ben({
  nguoi,
  suc,
  canhPhai,
}: {
  nguoi: NguoiChoi[];
  suc: number;
  canhPhai: boolean;
}) {
  const trong = Math.max(0, suc - nguoi.length);

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-1.5 ${canhPhai ? "items-end" : ""}`}
    >
      <div
        className={`flex items-center gap-1.5 ${canhPhai ? "flex-row-reverse" : ""}`}
      >
        {nguoi.map((p) => (
          <Avatar
            key={p.id}
            name={p.fullName}
            src={p.avatarUrl}
            seed={p.id}
            size="sm"
          />
        ))}
        {Array.from({ length: trong }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="size-7 rounded-full border border-dashed border-ink-700"
          />
        ))}
      </div>
      <p className="w-full truncate text-[11.5px] font-semibold text-ink-400">
        {nguoi.length > 0
          ? nguoi.map((p) => p.fullName.trim().split(/\s+/).pop()).join(", ")
          : "Chưa ai nhận"}
      </p>
    </div>
  );
}
