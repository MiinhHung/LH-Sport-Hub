import { Flame, Shield, Swords, Trophy } from "@/components/icons";
import type { ReactNode } from "react";

import { ChamHoatDong } from "@/components/ui/cham-hoat-dong";
import { Avatar, Card, MetaLine, Skeleton } from "@/components/ui";
import {
  ROLES,
  SKILL_LEVELS,
  type RoleKey,
  type SkillLevelKey,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";

/**
 * Đầu trang hồ sơ: một thẻ có dải navy, ảnh đại diện lớn đè lên, tên và
 * hàng bốn con số nằm luôn trong thẻ.
 *
 * TRANG HỒ SƠ TRƯỚC ĐÂY KHÔNG RA TRANG CÁ NHÂN. Chụp ở màn 1440: một
 * tiêu đề "Hồ sơ của tôi", bốn ô số liệu rời, rồi một biểu mẫu — còn ảnh
 * đại diện thì nằm lọt thỏm BÊN TRONG biểu mẫu, cạnh nút "Đổi ảnh". Đọc
 * ra một trang cài đặt tài khoản chứ không ra trang của một người.
 *
 * Thứ tự ở đây là thứ tự người ta thật sự muốn biết khi mở hồ sơ: mặt
 * ai, tên gì, đánh giỏi không. Biểu mẫu chỉnh sửa lui xuống dưới, vì
 * sửa hồ sơ là việc thỉnh thoảng mới làm.
 *
 * DẢI NAVY ĐẶC, KHÔNG PHẢI ẢNH BÌA. Ảnh bìa thì phải có chỗ cho người
 * dùng tải lên, mà việc đó chưa có trong app — bịa ra một ảnh bìa mặc
 * định thì ai cũng giống ai. Dải navy mỏng ở đầu thẻ là màu thương
 * hiệu, đủ làm nền cho ảnh đại diện đè lên; phần chữ nằm trên nền thẻ
 * thường nên dùng thẳng thang màu ink, sáng tối đều đọc được.
 */

/** Một ô số liệu trong hàng bốn ô dưới đầu hồ sơ. */
function O({
  nhan,
  so,
  phu,
  icon: Icon,
}: {
  nhan: string;
  so: number;
  phu?: string;
  icon: typeof Swords;
}) {
  return (
    <div className="min-w-0 bg-ink-900 px-4 py-4 sm:px-6">
      <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{nhan}</span>
      </p>
      <p className="tabular font-display mt-1.5 text-[28px] leading-none font-bold text-ink-100">
        {so}
      </p>
      {phu && <p className="mt-1.5 truncate text-[12px] text-ink-500">{phu}</p>}
    </div>
  );
}

export function DaiDauHoSo({
  profile,
  soLieu,
  bio,
  hanhDong,
  hoatDong,
}: {
  profile: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    department: string | null;
    role: RoleKey;
    skillLevel: string;
    createdAt: Date;
    lastActiveAt?: Date | string | null;
  };
  soLieu: {
    played: number;
    wins: number;
    losses: number;
    winRate: number;
    currentStreak: number;
    bestStreak: number;
    ghosted: number;
  } | null;
  /**
   * Câu tự giới thiệu. Trường `bio` có trong database và có ô nhập ở
   * trang hồ sơ từ lâu, nhưng TRƯỚC ĐÂY KHÔNG HIỆN Ở ĐÂU CẢ — ai điền
   * vào thì nó rơi vào hư không. Trang cá nhân là chỗ duy nhất hợp lý
   * cho nó.
   */
  bio?: string | null;
  /** Nút "Thách luôn" / "Nhắn tin" khi xem hồ sơ người khác. */
  hanhDong?: ReactNode;
  /**
   * Câu "Đang hoạt động" / "Hoạt động 20 phút trước".
   *
   * Ở đây có đủ chỗ nên nói hẳn bằng chữ chứ không bắt người ta đoán
   * qua một cái chấm — chấm chỉ nói được "đang", không nói được "cách
   * đây bao lâu".
   */
  hoatDong?: string;
}) {
  const skill = SKILL_LEVELS[profile.skillLevel as SkillLevelKey];

  return (
    <Card className="overflow-hidden">
      {/* Dải navy đầu thẻ: chỗ cho ảnh đại diện đè lên */}
      <div aria-hidden className="h-20 bg-navy-900 sm:h-24" />

      <div className="px-5 pb-5 sm:px-7 sm:pb-6">
        {/* Lưới thay cho flex: trên điện thoại nút hành động xuống dưới
            phần tên, từ sm thì đứng ngang hàng ảnh ở bên phải. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative -mt-12 shrink-0 justify-self-start sm:col-start-1 sm:row-start-1">
            <Avatar
              name={profile.fullName}
              src={profile.avatarUrl}
              seed={profile.id}
              size="xl"
              className="ring-4 ring-ink-900"
            />
            <ChamHoatDong
              lastActiveAt={profile.lastActiveAt ?? null}
              co="lg"
              className="right-1 bottom-1"
            />
          </div>

          {hanhDong && (
            <div className="order-last mt-4 flex flex-wrap items-center gap-2 sm:order-none sm:col-start-2 sm:row-start-1 sm:mt-0 sm:self-end sm:pb-1">
              {hanhDong}
            </div>
          )}

          <div className="mt-4 min-w-0 sm:col-span-2">
            <h1 className="font-display text-[26px] leading-tight font-bold text-ink-100 sm:text-[32px]">
              {profile.fullName}
            </h1>

            {/* Vai trò chỉ hiện khi KHÁC thành viên thường. Ai cũng là
                thành viên, nên gắn nhãn đó cho tất cả thì nhãn không
                phân biệt được gì. */}
            <MetaLine
              className="mt-2 text-[13.5px]"
              items={[
                profile.department,
                skill.label,
                profile.role !== "member" ? ROLES[profile.role].label : null,
              ]}
            />

            <MetaLine
              className="mt-1"
              items={[
                <span key="tu">Thành viên từ {formatDate(profile.createdAt)}</span>,
                hoatDong ? (
                  <span
                    key="hd"
                    className={
                      hoatDong === "Đang hoạt động"
                        ? "font-semibold text-emerald-700 dark:text-emerald-300"
                        : undefined
                    }
                  >
                    {hoatDong}
                  </span>
                ) : null,
              ]}
            />

            {bio && (
              <p className="mt-3 max-w-prose text-[14.5px] leading-relaxed text-ink-300">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bốn con số, nằm trong thẻ chứ không thành bốn cái thẻ rời. gap-px
          trên nền ink-800 vẽ đường kẻ giữa các ô, 2x2 hay 1x4 đều đúng. */}
      <div className="grid grid-cols-2 gap-px border-t border-ink-800 bg-ink-800 sm:grid-cols-4">
        <O
          nhan="Đã đánh"
          so={soLieu?.played ?? 0}
          icon={Swords}
          phu={soLieu?.played ? undefined : "Chưa có trận nào"}
        />
        <O
          nhan="Thắng"
          so={soLieu?.wins ?? 0}
          icon={Trophy}
          phu={
            soLieu && soLieu.played > 0
              ? `${Math.round(soLieu.winRate * 100)}% tỉ lệ thắng`
              : undefined
          }
        />
        <O
          nhan="Chuỗi thắng"
          so={soLieu?.currentStreak ?? 0}
          icon={Flame}
          phu={soLieu?.bestStreak ? `Kỷ lục ${soLieu.bestStreak}` : undefined}
        />
        <O
          nhan="Thua"
          so={soLieu?.losses ?? 0}
          icon={Shield}
          phu={soLieu?.ghosted ? `${soLieu.ghosted} kèo bỏ dở` : undefined}
        />
      </div>
    </Card>
  );
}

/** Khung chờ cùng dáng với `DaiDauHoSo`, dùng cho loading.tsx của hai trang hồ sơ. */
export function DaiDauHoSoSkeleton({ hanhDong }: { hanhDong?: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div aria-hidden className="h-20 bg-navy-900 sm:h-24" />
      <div className="px-5 pb-5 sm:px-7 sm:pb-6">
        <div className="flex items-end justify-between gap-4">
          <Skeleton className="-mt-12 size-24 rounded-full ring-4 ring-ink-900" />
          {hanhDong && (
            <div className="hidden gap-2 pb-1 sm:flex">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          )}
        </div>
        <Skeleton className="mt-4 h-8 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-60 max-w-full" />
        <Skeleton className="mt-2 h-3.5 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-ink-800 bg-ink-800 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-ink-900 px-4 py-4 sm:px-6">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="mt-2 h-7 w-10" />
          </div>
        ))}
      </div>
    </Card>
  );
}
