import Link from "next/link";

import { StartChatButton } from "@/components/chat/start-chat";
import { Avatar, Badge, Card } from "@/components/ui";
import { ROLES, SKILL_LEVELS, type RoleKey, type SkillLevelKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ThanhVien = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
  role: RoleKey;
  skillLevel: string;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
};

/**
 * Một thẻ thành viên.
 *
 * BA THỨ ĐÃ SỬA so với bản cũ:
 *
 * 1. CHIỀU CAO BẰNG NHAU. Thẻ của chính mình trước đây không có nút
 *    "Nhắn tin" nên thấp hơn hẳn các thẻ bên cạnh, hàng lưới gãy một
 *    khoảng. Giờ thẻ là `flex-col h-full`, phần hành động đẩy xuống đáy
 *    bằng `mt-auto`, và thẻ của mình cũng có một hành động thật ("Xem
 *    hồ sơ") chứ không bỏ trống.
 *
 * 2. BỎ "CHƯA GHI PHÒNG BAN". Chỗ nào không có dữ liệu thì để trống,
 *    đừng in ra một câu nhắc rằng nó trống — mười lăm thẻ cùng in một
 *    dòng xám giống nhau thì mắt chỉ thấy nhiễu.
 *
 * 3. BA CỘT SỐ 0 THÀNH MỘT DÒNG CHỮ. Người chưa đánh trận nào trước đây
 *    vẫn hiện "Thắng 0 / Thua 0 / Tỉ lệ —", ba con số rỗng chiếm một
 *    phần ba chiều cao thẻ. Giờ chỉ một dòng "Chưa ra sân trận nào", còn
 *    người đã đánh thì được một thanh tỉ lệ thắng — nhờ đó các thẻ
 *    trông KHÁC nhau, thay vì hai mươi ô giống hệt.
 */
export function TheThanhVien({
  m,
  isMe,
  hang,
}: {
  m: ThanhVien;
  isMe: boolean;
  /** Thứ hạng trong team, chỉ truyền cho ba người đầu. */
  hang?: number;
}) {
  const skill = SKILL_LEVELS[m.skillLevel as SkillLevelKey];
  const daDanh = m.played > 0;
  const tiLe = Math.round(m.winRate * 100);

  return (
    <Card
      className={cn(
        "flex h-full flex-col p-4",
        isMe && "border-navy-100 bg-navy-50 dark:border-navy-600/35 dark:bg-navy-600/15",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar name={m.fullName} src={m.avatarUrl} seed={m.id} size="lg" />
          {hang != null && (
            <span
              className="tabular font-display absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-ink-900 bg-gold-400 text-[10px] font-bold text-navy-950"
              title={`Hạng ${hang} trong team`}
            >
              {hang}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink-100">
            {m.fullName}
            {isMe && (
              <span className="ml-1.5 text-[11px] font-bold text-link">bạn</span>
            )}
          </p>
          {m.department && (
            <p className="truncate text-[12.5px] text-ink-500">{m.department}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Badge tone="slate">{skill.label}</Badge>
            {m.role !== "member" && (
              <Badge tone="navy">{ROLES[m.role].label}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 border-t border-ink-800 pt-3">
        {daDanh ? (
          <>
            <p className="flex items-baseline justify-between gap-2">
              <span className="text-[12.5px] text-ink-400">
                <span className="tabular font-bold text-ink-200">{m.wins}</span>{" "}
                thắng
                <span aria-hidden className="mx-1.5 text-ink-700">
                  ·
                </span>
                <span className="tabular font-bold text-ink-200">
                  {m.losses}
                </span>{" "}
                thua
              </span>
              <span
                className={cn(
                  "tabular text-[14px] font-bold",
                  tiLe >= 50
                    ? "text-gold-700 dark:text-gold-300"
                    : "text-ink-500",
                )}
              >
                {tiLe}%
              </span>
            </p>

            {/* Thanh tỉ lệ thắng. Con số 67% nói đúng chừng ấy thông tin,
                nhưng mười lăm thẻ toàn số thì phải đọc từng cái mới so
                được; thanh thì liếc một cái là thấy ai hơn ai. */}
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-850"
              role="img"
              aria-label={`Tỉ lệ thắng ${tiLe} phần trăm sau ${m.played} trận`}
            >
              <span
                className="block h-full rounded-full bg-gold-400"
                /* Kéo lên tối thiểu 3% để 1% vẫn nhìn thấy được, nhưng 0%
                   thì phải trống hẳn — một vạch vàng cỏn con ở người
                   chưa thắng trận nào là nói sai. */
                style={{ width: tiLe === 0 ? "0%" : `${Math.max(tiLe, 3)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-[12.5px] text-ink-500">Chưa ra sân trận nào</p>
        )}
      </div>

      {/* mt-auto: dù khối số liệu phía trên cao thấp khác nhau, hàng nút
          vẫn nằm sát đáy nên các thẻ cùng hàng thẳng chân với nhau. */}
      <div className="mt-auto pt-3">
        {isMe ? (
          <Link
            href="/ho-so"
            className="block rounded-xl border border-ink-800 px-3 py-1.5 text-center text-[13px] font-semibold text-ink-300 transition-colors hover:border-ink-700 hover:text-ink-100"
          >
            Xem hồ sơ của bạn
          </Link>
        ) : (
          <StartChatButton
            partnerId={m.id}
            className="w-full [&_button]:w-full"
          />
        )}
      </div>
    </Card>
  );
}
