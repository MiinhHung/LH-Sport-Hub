import { Pencil, Swords } from "@/components/icons";
import type { Metadata } from "next";

import { ChallengeCard } from "@/components/challenge-card";
import { ProfileForm } from "@/components/forms/profile-form";
import { DaiDauHoSo } from "@/components/ho-so/dai-dau";
import { Card, CardBody, EmptyState, SectionTitle } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
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
    <div className="mx-auto max-w-3xl space-y-6">
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
        hanhDong={
          <LinkButton href="#sua-ho-so" variant="secondary" size="sm">
            <Pencil className="size-3.5" aria-hidden />
            Sửa hồ sơ
          </LinkButton>
        }
      />

      {/* Lịch sử kèo, đưa LÊN TRƯỚC biểu mẫu. Mở hồ sơ ra thì người ta
          muốn xem mình đã đánh những gì, chứ sửa phòng ban là việc vài
          tháng mới làm một lần. */}
      <section aria-labelledby="lich-su">
        <SectionTitle>
          <span id="lich-su">Kèo gần đây của bạn</span>
        </SectionTitle>

        {myChallenges.length === 0 ? (
          /*
            Câu mô tả cũ đã chỉ đúng đường — "vào mục Kèo" — nhưng bắt
            người ta tự đi tìm. Chỉ đường bằng chữ rồi để đó thì vẫn là
            ngõ cụt, chỉ là ngõ cụt lịch sự hơn.

            Hai nút vì có hai cách mở hàng khác hẳn nhau: nhận kèo người
            khác đã treo (nhanh, không phải nghĩ gì), hoặc tự dựng kèo.
            Cách thứ nhất để trước vì nó dễ hơn cho người mới.
          */
          <EmptyState
            icon={<Swords className="size-6" />}
            title="Bạn chưa tham gia kèo nào"
            description="Nhận một kèo đang tìm đối là có tên trên bảng ngay."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <LinkButton href="/keo" variant="accent">
                  <Swords className="size-4" />
                  Xem kèo đang mở
                </LinkButton>
                <LinkButton href="/keo/tao" variant="secondary">
                  Tự tạo kèo
                </LinkButton>
              </div>
            }
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

      {/* Chỉnh sửa hồ sơ. scroll-mt để nút "Sửa hồ sơ" ở đầu trang nhảy
          tới không bị mép trên cắt mất tiêu đề. */}
      <section aria-labelledby="sua-ho-so-tieu-de" id="sua-ho-so" className="scroll-mt-6">
        <Card>
          <div className="border-b border-ink-800 px-4 py-4 sm:px-6">
            <h2 id="sua-ho-so-tieu-de" className="text-[16px] font-semibold text-ink-100">
              Chỉnh sửa thông tin
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Tên, ảnh và trình độ hiện trên bảng xếp hạng và thẻ thành viên.
            </p>
          </div>
          <CardBody className="sm:p-6">
            <ProfileForm
              profile={{
                id: profile.id,
                fullName: profile.fullName,
                avatarUrl: profile.avatarUrl,
                department: profile.department,
                skillLevel: profile.skillLevel,
                bio: profile.bio,
                qrUrl: profile.qrUrl,
              }}
            />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
