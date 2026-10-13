"use client";

import { SportIcon, StakeIcon } from "@/components/domain-icons";

import { VersusRow } from "@/components/VersusRow";
import { Badge, Card, MetaLine } from "@/components/ui";
import {
  CHALLENGE_FORMATS,
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
 * biết khi điền: "cái kèo này hiện ra sẽ trông thế nào, có ai hiểu
 * mình đang thách gì không" thì phải bấm Tạo rồi mới thấy.
 *
 * Cố ý DỰNG LẠI chứ không tái sử dụng `ChallengeCard`: thẻ thật cần một
 * bản ghi kèo đầy đủ (id, trạng thái, danh sách người tham gia kèm hồ
 * sơ, kết quả). Nặn ra một đối tượng giả đủ các trường đó để nuôi một
 * cái xem trước thì rủi ro hơn nhiều so với việc dựng lại vài chục dòng
 * JSX. Phần đối đầu thì dùng chung `VersusRow` nên luôn khớp thẻ thật.
 *
 * Chỗ này phải đi cùng `challenge-card.tsx` bằng mắt: cùng dòng badge,
 * cùng dải đối đầu, cùng dòng thông tin phụ.
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

  const doiA = [nguoiTao, ...(dongDoi ? [dongDoi] : [])];
  const doiB = doiThu;

  const han = hanDanh ? new Date(hanDanh) : null;
  const hanHopLe = han && !Number.isNaN(han.getTime()) ? han : null;

  return (
    <Card className="p-4">
      <Badge tone={kind === "open" ? "lime" : "amber"}>
        {kind === "open" ? "Đang tìm đối" : "Chờ nhận lời"}
      </Badge>

      <p className="mt-2.5 text-[17px] leading-snug font-bold text-ink-100">
        {title.trim() || <span className="text-ink-500">Kèo chưa có tên</span>}
      </p>

      {/* Hai đội. Ô trống là chỗ chưa ai nhận, đúng như thẻ thật. */}
      <VersusRow
        className="mt-3.5"
        teamA={{
          members: doiA,
          capacity: spec.playersPerTeam,
          emptyLabel: "Chưa ai nhận",
        }}
        teamB={{
          members: doiB,
          capacity: spec.playersPerTeam,
          emptyLabel: "Chưa ai nhận",
        }}
      />

      <MetaLine
        className="mt-3"
        items={[
          <span key="mon" className="flex items-center gap-1.5">
            <SportIcon sport={sport} className="size-3.5" />
            {spec.label}
            {format === "free"
              ? ""
              : pointsTarget === ""
                ? ", chưa chốt điểm"
                : `, ${pointsTarget} điểm`}
          </span>,
          <span
            key="cuoc"
            className="flex items-center gap-1.5 font-semibold text-ink-200"
          >
            <StakeIcon
              stake={stakeType}
              className="size-3.5 text-gold-700 dark:text-gold-300"
            />
            {stakeType === "khac" && !stakeNote.trim() ? (
              <span className="font-medium text-ink-500">
                Chưa ghi phần thưởng
              </span>
            ) : (
              formatStake(stakeType, stakeQty, stakeNote)
            )}
          </span>,
          buoiTap ? (
            <span key="buoi" className="truncate">
              {buoiTap}
            </span>
          ) : null,
          hanHopLe ? (
            <span key="han">Hạn {formatDateTime(hanHopLe)}</span>
          ) : null,
          !buoiTap && !hanHopLe ? (
            <span key="luc">Đánh lúc nào cũng được</span>
          ) : null,
        ]}
      />
    </Card>
  );
}
