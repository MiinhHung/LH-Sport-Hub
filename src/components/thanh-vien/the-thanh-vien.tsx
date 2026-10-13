import Link from "next/link";

import { StartChatButton } from "@/components/chat/start-chat";
import { duongDanHoSo } from "@/components/thanh-vien/link-ho-so";
import { ChamHoatDong } from "@/components/ui/cham-hoat-dong";
import { Avatar, MetaLine } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import {
  ROLES,
  SKILL_LEVELS,
  type RoleKey,
  type SkillLevelKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ThanhVien = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
  role: RoleKey;
  skillLevel: string;
  lastActiveAt: Date | string | null;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
};

/**
 * Một dòng thành viên, nằm trong `<ul divide-y>` của danh sách.
 *
 * Trước đây mỗi người là một thẻ riêng, mười lăm thẻ giống hệt nhau xếp
 * lưới và thẻ của chính mình thấp hơn các thẻ cạnh bên. Một dòng gọn thì
 * mọi hàng cao bằng nhau, quét tên theo chiều dọc dễ hơn, và vẫn đủ chỗ
 * cho số liệu: ai chưa ra sân thì nói thẳng bằng một dòng chữ, ai đã
 * đánh thì có thanh tỉ lệ thắng để so nhanh.
 *
 * Không ghi "chưa ghi phòng ban": chỗ nào thiếu dữ liệu thì để trống.
 */
export function TheThanhVien({
  m,
  isMe,
  hang,
  nguoiXem,
}: {
  m: ThanhVien;
  isMe: boolean;
  /** Id người đang xem — để biết dẫn về /ho-so hay /thanh-vien/<id>. */
  nguoiXem: string;
  /** Thứ hạng trong team, chỉ truyền cho ba người đầu. */
  hang?: number;
}) {
  const skill = SKILL_LEVELS[m.skillLevel as SkillLevelKey];
  const daDanh = m.played > 0;
  const tiLe = Math.round(m.winRate * 100);
  const hoSo = duongDanHoSo(m.id, nguoiXem);

  return (
    <li
      className={cn(
        "relative flex items-center gap-3 px-4 py-3.5 sm:px-5",
        isMe && "bg-gold-50/60 dark:bg-gold-400/5",
      )}
    >
      {/* Vạch vàng mép trái đánh dấu dòng của mình */}
      {isMe && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-gold-400"
        />
      )}

      {/* Cả ảnh lẫn tên dẫn tới hồ sơ. Dòng này KHÔNG phải một liên kết
          nên lồng được thoải mái, khác thẻ kèo. */}
      <Link
        href={hoSo}
        aria-label={`Xem hồ sơ của ${m.fullName}`}
        className="relative shrink-0 rounded-full outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-gold-400/50"
      >
        <Avatar name={m.fullName} src={m.avatarUrl} seed={m.id} size="md" />
        <ChamHoatDong lastActiveAt={m.lastActiveAt} />
        {hang != null && (
          <span
            className="tabular font-display absolute -top-1 -left-1 grid size-5 place-items-center rounded-full border-2 border-ink-900 bg-gold-400 text-[10px] font-bold text-navy-900"
            title={`Hạng ${hang} trong team`}
          >
            {hang}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2">
          <Link
            href={hoSo}
            className="min-w-0 truncate rounded text-[15px] font-semibold text-ink-100 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-gold-400/50"
          >
            {m.fullName}
          </Link>
          {isMe && (
            <span className="shrink-0 rounded-lg bg-navy-900 px-1.5 py-px text-[11px] font-semibold text-white dark:bg-ink-700">
              Bạn
            </span>
          )}
        </p>
        <MetaLine
          className="mt-0.5"
          items={[
            m.department,
            skill.label,
            m.role !== "member" ? ROLES[m.role].label : null,
          ]}
        />

        {daDanh ? (
          <div className="mt-1.5 flex items-center gap-3">
            <p className="tabular shrink-0 text-[12.5px] text-ink-500">
              <span className="font-semibold text-ink-100">{m.wins}</span> thắng
              <span aria-hidden className="mx-1.5 text-ink-600">
                ·
              </span>
              <span className="font-semibold text-ink-300">{m.losses}</span> thua
              <span aria-hidden className="mx-1.5 text-ink-600">
                ·
              </span>
              <span
                className={cn(
                  "font-semibold",
                  tiLe >= 50
                    ? "text-gold-700 dark:text-gold-300"
                    : "text-ink-300",
                )}
              >
                {tiLe}%
              </span>
            </p>
            {/* Thanh tỉ lệ thắng: liếc một cái là thấy ai hơn ai. */}
            <div
              className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-ink-850 sm:block"
              role="img"
              aria-label={`Tỉ lệ thắng ${tiLe} phần trăm sau ${m.played} trận`}
            >
              <span
                className="block h-full rounded-full bg-gold-400"
                /* Tối thiểu 3% để 1% vẫn thấy; 0% thì trống hẳn. */
                style={{ width: tiLe === 0 ? "0%" : `${Math.max(tiLe, 3)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-1.5 text-[12.5px] text-ink-500">
            Chưa ra sân trận nào
          </p>
        )}
      </div>

      <div className="shrink-0">
        {isMe ? (
          <LinkButton href="/ho-so" variant="secondary" size="sm">
            Hồ sơ
          </LinkButton>
        ) : (
          <StartChatButton partnerId={m.id} />
        )}
      </div>
    </li>
  );
}
