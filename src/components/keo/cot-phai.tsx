import { ArrowRight, Clock, MapPin } from "@/components/icons";
import Link from "next/link";

import { Avatar, Card } from "@/components/ui";
import { getLeaderboard, listUpcomingSessions } from "@/lib/queries";
import { cn, dateTile, formatTime, timeUntil } from "@/lib/utils";

/**
 * Cột phải của trang Kèo.
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

function RailSection({
  id,
  title,
  href,
  children,
}: {
  id: string;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
          <h2 id={id} className="text-[16px] font-semibold text-ink-100">
            {title}
          </h2>
          <Link
            href={href}
            prefetch={false}
            className="group inline-flex items-center gap-1 text-[12.5px] font-semibold text-link"
          >
            Tất cả
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="px-2 pb-2">{children}</div>
      </Card>
    </section>
  );
}

/** Ô lịch kiểu tờ lịch xé, cùng dáng với cột phải của Bảng tin. */
function DateTile({ date }: { date: Date }) {
  const t = dateTile(date);
  return (
    <span className="flex w-12 shrink-0 flex-col overflow-hidden rounded-lg border border-ink-800 bg-ink-900 text-center">
      <span className="bg-navy-900 py-0.5 text-[10.5px] font-semibold text-gold-300">
        {t.thu}
      </span>
      <span className="tabular font-display pt-1 text-[19px] leading-none font-bold text-ink-100">
        {t.ngay}
      </span>
      <span className="pt-0.5 pb-1 text-[10.5px] font-medium text-ink-500">
        {t.thang}
      </span>
    </span>
  );
}

export async function CotPhaiKeo() {
  const [bang, buoiTap] = await Promise.all([
    getLeaderboard(),
    listUpcomingSessions(2),
  ]);

  // Chỉ xếp hạng người đã đánh ít nhất một kèo; người chưa đánh mà đứng
  // trong bảng "dẫn đầu" thì bảng đó chẳng nói lên điều gì.
  const dauBang = bang.filter((e) => e.played > 0).slice(0, 3);

  return (
    <aside className="space-y-6 lg:sticky lg:top-10">
      {dauBang.length > 0 && (
        <RailSection id="dau-bang" title="Đang dẫn đầu" href="/bang-phong-than">
          <ol>
            {dauBang.map((e, i) => (
              <li
                key={e.profile.id}
                className="flex items-center gap-3 rounded-xl p-2"
              >
                <span
                  aria-label={`Hạng ${i + 1}`}
                  className={cn(
                    "tabular grid size-6 shrink-0 place-items-center rounded-lg text-[12.5px] font-bold",
                    i === 0
                      ? "bg-gold-400 text-navy-900"
                      : "bg-ink-850 text-ink-400",
                  )}
                >
                  {i + 1}
                </span>
                <Avatar
                  name={e.profile.fullName}
                  src={e.profile.avatarUrl}
                  seed={e.profile.id}
                  size="sm"
                />
                <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-100">
                  {e.profile.fullName}
                </p>
                <span
                  className="tabular shrink-0 text-[12.5px] font-bold text-ink-200"
                  title={`Thắng ${e.wins} trên ${e.played} kèo`}
                >
                  {e.wins}
                  <span className="font-medium text-ink-500">/{e.played}</span>
                </span>
              </li>
            ))}
          </ol>
        </RailSection>
      )}

      {buoiTap.length > 0 && (
        <RailSection id="danh-o-dau" title="Sắp ra sân" href="/buoi-tap">
          <ul>
            {buoiTap.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/buoi-tap/${s.id}`}
                  className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-ink-850"
                >
                  <DateTile date={s.startsAt} />
                  <span className="min-w-0 flex-1 py-0.5">
                    <span className="block truncate text-[14px] leading-snug font-semibold text-ink-100">
                      {s.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                      <Clock className="size-3.5 shrink-0" aria-hidden />
                      <span className="tabular">{formatTime(s.startsAt)}</span>
                      <span aria-hidden className="text-ink-600">
                        ·
                      </span>
                      <span className="font-semibold text-gold-700 dark:text-gold-300">
                        {timeUntil(s.startsAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{s.venueName}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </RailSection>
      )}
    </aside>
  );
}
