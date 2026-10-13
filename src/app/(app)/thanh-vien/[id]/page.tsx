import { ArrowLeft, Swords } from "@/components/icons";
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
    >
      <Swords className="size-4" aria-hidden />
      Thách luôn
    </LinkButton>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/thanh-vien"
        className="-my-1 inline-flex items-center gap-1.5 rounded-lg py-1 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
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

      <KhoiDoiDau
        doiDau={doiDau}
        tenHo={ten}
        moi={thachLuon}
        ban={{ id: me.id, fullName: me.fullName, avatarUrl: me.avatarUrl }}
        ho={{
          id: profile.id,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
        }}
      />

      {banHayDanh.length > 0 && (
        <section aria-labelledby="hay-danh-cung">
          <Card className="overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
              <h2
                id="hay-danh-cung"
                className="text-[16px] font-semibold text-ink-100"
              >
                Hay đánh cùng
              </h2>
              <span className="text-[12.5px] text-ink-500">Số trận chung</span>
            </div>
            <ul className="divide-y divide-ink-800 border-t border-ink-800">
              {banHayDanh.map((b) => (
                <li key={b.id}>
                  <Link
                    href={b.id === me.id ? "/ho-so" : `/thanh-vien/${b.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-850 sm:px-5"
                  >
                    <Avatar
                      name={b.fullName}
                      src={b.avatarUrl}
                      seed={b.id}
                      size="md"
                    />
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-[14px] font-semibold text-ink-100">
                        {b.fullName}
                      </span>
                      {b.id === me.id && (
                        <span className="shrink-0 rounded-lg bg-navy-900 px-1.5 py-px text-[11px] font-semibold text-white dark:bg-ink-700">
                          Bạn
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[12.5px] text-ink-500">
                      <span className="tabular font-display text-[16px] font-bold text-ink-100">
                        {b.soTran}
                      </span>{" "}
                      trận
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section aria-labelledby="keo-cua-ho">
        <SectionTitle>
          <span id="keo-cua-ho">Kèo gần đây của {ten}</span>
        </SectionTitle>

        {keoCuaHo.length === 0 ? (
          /*
            Trang này ĐÃ có nút "Thách luôn" ở dải đầu. Vẫn đặt thêm một
            nút ở đây vì khoảng cách: trên màn 390px, chỗ này nằm dưới ảnh
            đại diện, khối đối đầu và tiêu đề mục — người đọc tới được đây
            là đã cuộn qua gần một màn hình.

            Đọc "Thách một kèo để mở hàng" rồi phải cuộn ngược lên tìm nút
            là chỗ dễ bỏ cuộc. Đặt nút ngay tại điểm nảy ra ý định.
          */
          <EmptyState
            icon={<Swords className="size-6" />}
            title={`${ten} chưa tham gia kèo nào`}
            description="Thách một kèo để mở hàng cho người ta."
            action={
              <LinkButton href={`/keo/tao?doi=${profile.id}`} variant="accent">
                <Swords className="size-4" />
                Thách {ten}
              </LinkButton>
            }
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
