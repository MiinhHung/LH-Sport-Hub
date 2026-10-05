import { Users } from "lucide-react";
import type { Metadata } from "next";

import { DanhSachThanhVien } from "@/components/thanh-vien/danh-sach";
import type { ThanhVien } from "@/components/thanh-vien/the-thanh-vien";
import { EmptyState, PageIntro } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import type { RoleKey } from "@/lib/constants";
import { getLeaderboard, listMembers } from "@/lib/queries";

export const metadata: Metadata = { title: "Thành viên" };

export default async function MembersPage() {
  const me = await requireProfile();
  const [members, board] = await Promise.all([listMembers(), getLeaderboard()]);

  const statsById = new Map(board.map((e) => [e.profile.id, e]));

  // Gộp hồ sơ với số liệu ngay ở máy chủ: thẻ chỉ cần một đối tượng
  // phẳng, và phía trình duyệt khỏi phải mang theo cả bảng xếp hạng.
  const danhSach: ThanhVien[] = members.map((m) => {
    const s = statsById.get(m.id);
    return {
      id: m.id,
      fullName: m.fullName,
      avatarUrl: m.avatarUrl,
      department: m.department,
      role: m.role as RoleKey,
      skillLevel: m.skillLevel,
      lastActiveAt: m.lastActiveAt,
      played: s?.played ?? 0,
      wins: s?.wins ?? 0,
      losses: s?.losses ?? 0,
      winRate: s?.winRate ?? 0,
    };
  });

  const soDaRaSan = danhSach.filter((m) => m.played > 0).length;

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Đội hình"
        title="Thành viên"
        /* Câu dẫn nói thêm một con số có ích. "19 người đang hoạt động"
           thì đã thấy ngay ở lưới bên dưới rồi; "bao nhiêu người đã ra
           sân" mới là thứ phải đếm mới biết. */
        lead={
          soDaRaSan > 0
            ? `${danhSach.length} người trong team, ${soDaRaSan} người đã ra sân.`
            : `${danhSach.length} người đang hoạt động trong team.`
        }
      />

      {danhSach.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Chưa có thành viên nào"
          description="Mời anh em đăng ký bằng email công ty."
        />
      ) : (
        <DanhSachThanhVien members={danhSach} meId={me.id} />
      )}
    </div>
  );
}
