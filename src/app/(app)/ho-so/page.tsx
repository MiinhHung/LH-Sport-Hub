import { Swords } from "lucide-react";
import type { Metadata } from "next";

import { ChallengeCard } from "@/components/challenge-card";
import { ProfileForm } from "@/components/forms/profile-form";
import { DaiDauHoSo } from "@/components/ho-so/dai-dau";
import { Card, CardBody, EmptyState, SectionTitle } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import type { RoleKey } from "@/lib/constants";
import { getLeaderboard, listChallenges } from "@/lib/queries";

export const metadata: Metadata = { title: "Hồ sơ của tôi" };

export default async function ProfilePage() {
  const profile = await requireProfile();

  const [board, myChallenges] = await Promise.all([
    getLeaderboard(),
    listChallenges({ tab: "mine", userId: profile.id, limit: 12 }),
  ]);

  const me = board.find((e) => e.profile.id === profile.id) ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/*
        Dải đầu thay cho PageIntro. Tiêu đề "Hồ sơ của tôi" đã bỏ: trang
        của chính mình thì không cần một dòng chữ nhắc lại điều đó, mà
        tên và mặt người ta nói rõ hơn nhiều.
      */}
      <DaiDauHoSo
        profile={{
          id: profile.id,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          department: profile.department,
          role: profile.role as RoleKey,
          skillLevel: profile.skillLevel,
          createdAt: profile.createdAt,
          lastActiveAt: profile.lastActiveAt,
        }}
        soLieu={
          me
            ? {
                played: me.played,
                wins: me.wins,
                losses: me.losses,
                winRate: me.winRate,
                currentStreak: me.currentStreak,
                bestStreak: me.bestStreak,
                ghosted: me.ghosted,
              }
            : null
        }
      />

      {/* Lịch sử kèo — đưa LÊN TRƯỚC biểu mẫu. Mở hồ sơ ra thì người ta
          muốn xem mình đã đánh những gì, chứ sửa phòng ban là việc vài
          tháng mới làm một lần. */}
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

      {/* Chỉnh sửa hồ sơ */}
      <section aria-labelledby="sua-ho-so">
        <SectionTitle>
          <span id="sua-ho-so">Chỉnh sửa thông tin</span>
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
    </div>
  );
}
