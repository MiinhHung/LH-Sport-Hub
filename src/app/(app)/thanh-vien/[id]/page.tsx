import { ArrowLeft, Swords, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ChallengeCard } from "@/components/challenge-card";
import { StartChatButton } from "@/components/chat/start-chat";
import { DaiDauHoSo } from "@/components/ho-so/dai-dau";
import { KhoiDoiDau } from "@/components/thanh-vien/doi-dau";
import { Avatar, Card, EmptyState, SectionTitle } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { nhanHoatDong } from "@/lib/hoat-dong";
import type { RoleKey } from "@/lib/constants";
import {
  getBanHayDanh,
  getDoiDau,
  getLeaderboard,
  getProfileById,
  listChallenges,
} from "@/lib/queries";

/** Tên gọi thân mật: lấy hai chữ cuối, như cách người Việt gọi nhau. */
function tenNgan(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.slice(-2).join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getProfileById(id);
  return { title: p ? p.fullName : "Thành viên" };
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireProfile();

  // Hồ sơ của chính mình thì về trang hồ sơ, nơi có cả biểu mẫu chỉnh
  // sửa. Hai trang gần giống nhau mà một cái sửa được còn cái kia không
  // thì người ta sẽ loay hoay không hiểu vì sao.
  if (id === me.id) redirect("/ho-so");

  const profile = await getProfileById(id);
  if (!profile || profile.status !== "active") notFound();

  const [board, doiDau, banHayDanh, keoCuaHo] = await Promise.all([
    getLeaderboard(),
    getDoiDau(me.id, profile.id),
    getBanHayDanh(profile.id),
    listChallenges({ tab: "mine", userId: profile.id, limit: 8 }),
  ]);

  const soLieu = board.find((e) => e.profile.id === profile.id) ?? null;
  const ten = tenNgan(profile.fullName);

  /*
    "Thách luôn" mang sẵn người này sang trang tạo kèo.

    Trước đây muốn thách ai thì vào /keo/tao rồi tự dò trong danh sách
    thành viên. Mở hồ sơ một người ra mà vẫn phải đi đường vòng đó thì
    trang này chỉ để ngắm.
  */
  const thachLuon = (
    <LinkButton
      href={`/keo/tao?doi=${profile.id}`}
      variant="accent"
      size="sm"
      className="gap-1.5"
    >
      <Swords className="size-4" aria-hidden />
      Thách luôn
    </LinkButton>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <Link
        href="/thanh-vien"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Thành viên
      </Link>

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
        soLieu={soLieu}
        bio={profile.bio}
        hoatDong={nhanHoatDong(profile.lastActiveAt)}
        hanhDong={
          <>
            {thachLuon}
            <StartChatButton partnerId={profile.id} />
          </>
        }
      />

      <KhoiDoiDau doiDau={doiDau} tenHo={ten} moi={thachLuon} />

      {banHayDanh.length > 0 && (
        <section aria-labelledby="hay-danh-cung">
          <SectionTitle>
            <Users className="size-4 text-gold-500" aria-hidden />
            <span id="hay-danh-cung">Hay đánh cùng</span>
          </SectionTitle>

          <Card className="divide-y divide-ink-800">
            {banHayDanh.map((b) => (
              <Link
                key={b.id}
                href={b.id === me.id ? "/ho-so" : `/thanh-vien/${b.id}`}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-ink-850"
              >
                <Avatar
                  name={b.fullName}
                  src={b.avatarUrl}
                  seed={b.id}
                  size="sm"
                />
                <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-200">
                  {b.fullName}
                  {b.id === me.id && (
                    <span className="ml-1.5 text-[11px] font-bold text-link">
                      bạn
                    </span>
                  )}
                </p>
                <span className="tabular shrink-0 text-[12.5px] text-ink-500">
                  {b.soTran} trận
                </span>
              </Link>
            ))}
          </Card>
        </section>
      )}

      <section aria-labelledby="keo-cua-ho">
        <SectionTitle>
          <span id="keo-cua-ho">Kèo gần đây của {ten}</span>
        </SectionTitle>

        {keoCuaHo.length === 0 ? (
          <EmptyState
            icon={<Swords className="size-5" />}
            title={`${ten} chưa tham gia kèo nào`}
            description="Thách một kèo để mở hàng."
          />
        ) : (
          <div className="grid gap-3">
            {keoCuaHo.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                currentUserId={me.id}
                href={`/keo/${c.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
