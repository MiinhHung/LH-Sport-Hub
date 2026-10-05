import { Flame, Shield, Swords, Trophy } from "lucide-react";

import { Avatar, Badge } from "@/components/ui";
import { ROLES, SKILL_LEVELS, type RoleKey, type SkillLevelKey } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

/**
 * Dải đầu trang hồ sơ: nền navy, ảnh đại diện lớn đè lên, tên và bốn con
 * số nằm luôn trong đó.
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
 * NỀN NAVY ĐẶC, KHÔNG PHẢI ẢNH BÌA. Ảnh bìa thì phải có chỗ cho người
 * dùng tải lên, mà việc đó chưa có trong app — bịa ra một ảnh bìa mặc
 * định thì ai cũng giống ai, và thêm một thứ nữa phải nghĩ cách cho họ
 * đổi. Nền navy là màu thương hiệu, và nó làm nền cho ảnh đại diện nổi
 * lên, vốn là mục đích duy nhất của dải này.
 */

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
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.12em] text-white/50 uppercase">
        <Icon className="size-3.5" aria-hidden />
        {nhan}
      </p>
      <p className="tabular font-display mt-1 text-[26px] leading-none font-bold text-white">
        {so}
      </p>
      {phu && <p className="mt-1 truncate text-[11.5px] text-white/45">{phu}</p>}
    </div>
  );
}

export function DaiDauHoSo({
  profile,
  soLieu,
}: {
  profile: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    department: string | null;
    role: RoleKey;
    skillLevel: string;
    createdAt: Date;
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
}) {
  const skill = SKILL_LEVELS[profile.skillLevel as SkillLevelKey];

  return (
    <section className="overflow-hidden rounded-3xl bg-navy-900">
      {/*
        Hai quầng sáng rất mờ cho nền đỡ phẳng. Cùng thủ pháp với nền
        hero ở trang giới thiệu, chỉ nhẹ hơn nhiều vì ở đây nền chỉ là
        nền, không phải thứ đáng nhìn.
      */}
      <div className="relative px-5 pt-7 pb-6 sm:px-8 sm:pt-9">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(70% 60% at 12% 0%, rgba(220,174,66,0.16), transparent 62%)",
              "radial-gradient(60% 55% at 92% 20%, rgba(159,192,255,0.10), transparent 60%)",
            ].join(","),
          }}
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Avatar
            name={profile.fullName}
            src={profile.avatarUrl}
            seed={profile.id}
            size="xl"
            className="shrink-0 ring-4 ring-navy-900"
          />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] leading-tight font-bold text-white sm:text-[34px]">
              {profile.fullName}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <Badge tone="amber">{skill.label}</Badge>
              {/* Vai trò chỉ hiện khi KHÁC thành viên thường. Ai cũng là
                  thành viên, nên gắn nhãn đó cho tất cả thì nhãn không
                  phân biệt được gì. */}
              {profile.role !== "member" && (
                <Badge tone="violet">{ROLES[profile.role].label}</Badge>
              )}
              {profile.department && (
                <span className="text-[12.5px] text-white/55">
                  {profile.department}
                </span>
              )}
            </div>

            <p className="mt-2 text-[12.5px] text-white/45">
              Thành viên từ {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Bốn con số, nằm trong dải chứ không thành bốn cái thẻ rời */}
      <div className="grid grid-cols-2 gap-5 border-t border-white/10 bg-navy-950/40 px-5 py-5 sm:grid-cols-4 sm:px-8">
        <O
          nhan="Đã đánh"
          so={soLieu?.played ?? 0}
          icon={Swords}
          phu={soLieu?.played ? undefined : "chưa có trận nào"}
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
          phu={soLieu?.bestStreak ? `kỷ lục ${soLieu.bestStreak}` : undefined}
        />
        <O
          nhan="Thua"
          so={soLieu?.losses ?? 0}
          icon={Shield}
          phu={soLieu?.ghosted ? `${soLieu.ghosted} kèo bỏ dở` : undefined}
        />
      </div>
    </section>
  );
}
