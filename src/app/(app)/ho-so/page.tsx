import { Flame, HandCoins, Swords, Trophy } from "lucide-react";
import type { Metadata } from "next";

import { ChallengeCard } from "@/components/challenge-card";
import { ProfileForm } from "@/components/forms/profile-form";
import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  PageIntro,
  SectionTitle,
  Stat,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { ROLES, SKILL_LEVELS, type SkillLevelKey } from "@/lib/constants";
import { getLeaderboard, listChallenges } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Hồ sơ của tôi" };

export default async function ProfilePage() {
  const profile = await requireProfile();

  const [board, myChallenges] = await Promise.all([
    getLeaderboard(),
    listChallenges({ tab: "mine", userId: profile.id, limit: 12 }),
  ]);

  const me = board.find((e) => e.profile.id === profile.id);
  const skill = SKILL_LEVELS[profile.skillLevel as SkillLevelKey];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageIntro
        eyebrow="Cá nhân"
        title="Hồ sơ của tôi"
        lead={`Thành viên từ ${formatDate(profile.createdAt)}.`}
        action={
          <div className="flex gap-1.5">
            <Badge tone="navy">{ROLES[profile.role].label}</Badge>
            <Badge tone="slate">{skill.label}</Badge>
          </div>
        }
      />

      {/* Số liệu */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat
          label="Đã đánh"
          value={me?.played ?? 0}
          icon={<Swords className="size-3.5" />}
          tone="navy"
        />
        <Stat
          label="Thắng"
          value={me?.wins ?? 0}
          sub={
            me && me.played > 0
              ? `${Math.round(me.winRate * 100)}% tỉ lệ thắng`
              : "chưa có trận nào"
          }
          icon={<Trophy className="size-3.5" />}
          tone="emerald"
        />
        <Stat
          label="Chuỗi thắng"
          value={me?.currentStreak ?? 0}
          sub={me?.bestStreak ? `kỷ lục ${me.bestStreak}` : undefined}
          icon={<Flame className="size-3.5" />}
          tone="amber"
        />
        <Stat
          label="Đang nợ"
          value={me?.owedUnits ?? 0}
          sub={me?.owedSummary || "sạch nợ"}
          icon={<HandCoins className="size-3.5" />}
          tone="rose"
        />
      </div>

      {/* Chỉnh sửa hồ sơ */}
      <section aria-labelledby="sua-ho-so">
        <SectionTitle>
          <span id="sua-ho-so">Thông tin cá nhân</span>
        </SectionTitle>
        <Card>
          <CardBody className="sm:p-6">
            <ProfileForm
              profile={{
                id: profile.id,
                fullName: profile.fullName,
                avatarUrl: profile.avatarUrl,
                department: profile.department,
                skillLevel: profile.skillLevel,
                bio: profile.bio,
              }}
            />
          </CardBody>
        </Card>
      </section>

      {/* Lịch sử kèo */}
      <section aria-labelledby="lich-su">
        <SectionTitle>
          <span id="lich-su">Kèo gần đây của bạn</span>
        </SectionTitle>

        {myChallenges.length === 0 ? (
          <EmptyState
            icon={<Swords className="size-5" />}
            title="Bạn chưa tham gia kèo nào"
            description="Vào mục Kèo, nhận một kèo đang tìm đối là có tên trên bảng ngay."
          />
        ) : (
          <div className="grid gap-3">
            {myChallenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                currentUserId={profile.id}
                href={`/keo/${c.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
