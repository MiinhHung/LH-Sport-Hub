import { CalendarDays, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

import { Avatar, Card, SectionTitle } from "@/components/ui";
import { getLeaderboard, listUpcomingSessions } from "@/lib/queries";
import { formatDateTime, timeUntil } from "@/lib/utils";

/**
 * Cột phải của trang Kèo.
 *
 * TRANG KÈO TRƯỚC ĐÂY DÙNG MỘT CỘT GIỮA TRANG RỘNG. Chụp ở màn 1536:
 * tiêu đề, một dòng "Việc của bạn", hàng tab, rồi một hộp rỗng to đùng
 * với một icon bé tẹo ở giữa — khoảng 85% chiều cao màn hình không có
 * gì. Trong khi bảng tin ngay bên cạnh đã có cột phải và nhờ đó đỡ
 * trống hẳn.
 *
 * Hai khối ở đây không phải đồ trang trí nhét vào cho đầy, mà là hai câu
 * hỏi người ta thật sự có khi đang nhìn danh sách kèo:
 *
 *   "thách ai bây giờ?"      -> ba người đầu bảng phong thần
 *   "đánh ở buổi nào?"       -> buổi tập sắp tới
 *
 * `getLeaderboard` đo được 139ms ở lần gọi thứ hai nên gọi thêm ở đây
 * không đáng ngại; cả hai truy vấn chạy song song.
 */
export async function CotPhaiKeo() {
  const [bang, buoiTap] = await Promise.all([
    getLeaderboard(),
    listUpcomingSessions(2),
  ]);

  // Chỉ xếp hạng người đã đánh ít nhất một kèo; người chưa đánh mà đứng
  // trong bảng "dẫn đầu" thì bảng đó chẳng nói lên điều gì.
  const dauBang = bang.filter((e) => e.played > 0).slice(0, 3);

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      {dauBang.length > 0 && (
        <section aria-labelledby="dau-bang">
          <SectionTitle
            action={
              <Link
                href="/bang-phong-than"
                className="text-[12px] font-semibold text-link hover:underline"
              >
                Tất cả
              </Link>
            }
          >
            <Trophy className="size-4 text-gold-500" aria-hidden />
            <span id="dau-bang">Đang dẫn đầu</span>
          </SectionTitle>

          <Card className="divide-y divide-ink-800">
            {dauBang.map((e, i) => (
              <div key={e.profile.id} className="flex items-center gap-3 p-3">
                <span
                  aria-hidden
                  className="tabular font-display w-5 shrink-0 text-center text-[15px] font-bold text-ink-500"
                >
                  {i + 1}
                </span>
                <Avatar
                  name={e.profile.fullName}
                  src={e.profile.avatarUrl}
                  seed={e.profile.id}
                  size="sm"
                />
                <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-200">
                  {e.profile.fullName}
                </p>
                <span className="tabular shrink-0 text-[12.5px] font-bold text-ink-300">
                  {e.wins}
                  <span className="font-medium text-ink-500">/{e.played}</span>
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {buoiTap.length > 0 && (
        <section aria-labelledby="danh-o-dau">
          <SectionTitle
            action={
              <Link
                href="/buoi-tap"
                className="text-[12px] font-semibold text-link hover:underline"
              >
                Tất cả
              </Link>
            }
          >
            <CalendarDays className="size-4 text-gold-500" aria-hidden />
            <span id="danh-o-dau">Sắp ra sân</span>
          </SectionTitle>

          <div className="space-y-2.5">
            {buoiTap.map((s) => (
              <Card key={s.id} interactive className="overflow-hidden">
                <Link href={`/buoi-tap/${s.id}`} className="block p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink-100">
                      {s.title}
                    </p>
                    <span className="shrink-0 text-[10.5px] font-semibold text-gold-700 dark:text-gold-300">
                      {timeUntil(s.startsAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-400">
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                    {formatDateTime(s.startsAt)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-400">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{s.venueName}</span>
                  </p>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
