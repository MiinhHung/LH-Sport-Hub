import { Flame, Ghost, HandCoins, Medal, Trophy } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  Avatar,
  Badge,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  SectionTitle,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bảng phong thần" };

/** Thẻ danh hiệu vui — chỉ hiện khi thật sự có người đứng đầu hạng mục. */
function Crown({
  title,
  subtitle,
  entry,
  value,
  icon,
  tone,
}: {
  title: string;
  subtitle: string;
  entry: LeaderboardEntry | undefined;
  value: string;
  icon: ReactNode;
  tone: "gold" | "rose" | "sky";
}) {
  if (!entry) return null;

  const tones = {
    gold: "border-gold-200 bg-gold-50",
    rose: "border-rose-200 bg-rose-50",
    sky: "border-sky-200 bg-sky-50",
  };
  const chips = {
    gold: "bg-gold-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
  };

  return (
    <div className={cn("rounded-2xl border p-4", tones[tone])}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg text-white",
            chips[tone],
          )}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] leading-tight font-bold text-ink-100">
            {title}
          </p>
          <p className="text-[10.5px] text-ink-500">{subtitle}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <Avatar
          name={entry.profile.fullName}
          src={entry.profile.avatarUrl}
          seed={entry.profile.id}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-bold text-ink-100">
            {entry.profile.fullName}
          </p>
          <p className="text-[12.5px] font-semibold text-ink-500">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) {
    return (
      <span className="tabular grid size-7 shrink-0 place-items-center text-[13px] font-bold text-ink-500">
        {rank}
      </span>
    );
  }
  const styles = [
    "bg-gradient-gold text-navy-900",
    "bg-ink-700 text-white",
    "bg-amber-700 text-white",
  ];
  return (
    <span
      className={cn(
        "tabular grid size-7 shrink-0 place-items-center rounded-lg text-[13px] font-extrabold",
        styles[rank - 1],
      )}
    >
      {rank}
    </span>
  );
}

export default async function LeaderboardPage() {
  const me = await requireProfile();
  const board = await getLeaderboard();

  const played = board.filter((e) => e.played > 0);

  const topWinner = played[0];
  const topDebtor = [...board]
    .filter((e) => e.owedUnits > 0)
    .sort((a, b) => b.owedUnits - a.owedUnits)[0];
  const topStreak = [...played]
    .filter((e) => e.currentStreak >= 2)
    .sort((a, b) => b.currentStreak - a.currentStreak)[0];
  const topGhost = [...board]
    .filter((e) => e.ghosted > 0)
    .sort((a, b) => b.ghosted - a.ghosted)[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bảng phong thần"
        description="Chỉ tính những kèo đã được cả hai đội xác nhận kết quả."
      />

      {played.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="Chưa có kèo nào chốt kết quả"
          description="Đánh xong nhớ vào nhập kết quả, xác nhận đủ hai bên thì mới lên bảng."
        />
      ) : (
        <>
          {/* Danh hiệu */}
          <section aria-labelledby="danh-hieu">
            <SectionTitle>
              <Medal className="size-4 text-gold-500" aria-hidden />
              <span id="danh-hieu">Danh hiệu</span>
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Crown
                title="Vua kèo"
                subtitle="Thắng nhiều nhất"
                entry={topWinner}
                value={`${topWinner?.wins} trận thắng`}
                icon={<Trophy className="size-4" />}
                tone="gold"
              />
              <Crown
                title="Chúa nợ"
                subtitle="Nợ nhiều nhất chưa trả"
                entry={topDebtor}
                value={topDebtor?.owedSummary || `${topDebtor?.owedUnits} phần`}
                icon={<HandCoins className="size-4" />}
                tone="rose"
              />
              <Crown
                title="Đang có phong độ"
                subtitle="Chuỗi thắng hiện tại"
                entry={topStreak}
                value={`${topStreak?.currentStreak} trận liên tiếp`}
                icon={<Flame className="size-4" />}
                tone="sky"
              />
              <Crown
                title="Thánh xù kèo"
                subtitle="Nhận kèo rồi bỏ"
                entry={topGhost}
                value={`${topGhost?.ghosted} kèo bỏ dở`}
                icon={<Ghost className="size-4" />}
                tone="rose"
              />
            </div>
          </section>

          {/* Bảng xếp hạng */}
          <section aria-labelledby="xep-hang">
            <SectionTitle>
              <span id="xep-hang">Xếp hạng ({played.length})</span>
            </SectionTitle>

            <Card className="overflow-hidden">
              <div className="hidden grid-cols-[auto_1fr_repeat(4,4.5rem)] gap-3 border-b border-ink-800 bg-ink-850/60 px-4 py-2.5 text-[11px] font-bold tracking-wide text-ink-500 uppercase sm:grid">
                <span>#</span>
                <span>Thành viên</span>
                <span className="text-right">Thắng</span>
                <span className="text-right">Thua</span>
                <span className="text-right">Tỉ lệ</span>
                <span className="text-right">Đang nợ</span>
              </div>

              <ul className="divide-y divide-ink-800">
                {played.map((entry, i) => {
                  const isMe = entry.profile.id === me.id;
                  return (
                    <li
                      key={entry.profile.id}
                      className={cn(
                        "grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_repeat(4,4.5rem)]",
                        isMe && "bg-navy-50",
                      )}
                    >
                      <RankBadge rank={i + 1} />

                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar
                          name={entry.profile.fullName}
                          src={entry.profile.avatarUrl}
                          seed={entry.profile.id}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-ink-200">
                            {entry.profile.fullName}
                            {isMe && (
                              <span className="ml-1.5 text-[11px] font-bold text-navy-700">
                                bạn
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[11.5px] text-ink-500 sm:hidden">
                            {entry.wins}T · {entry.losses}B ·{" "}
                            {Math.round(entry.winRate * 100)}%
                          </p>
                          {entry.currentStreak >= 2 && (
                            <p className="hidden text-[11px] font-semibold text-gold-700 sm:block">
                              🔥 {entry.currentStreak} trận thắng liên tiếp
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="tabular hidden text-right text-[14px] font-bold text-emerald-700 sm:block">
                        {entry.wins}
                      </span>
                      <span className="tabular hidden text-right text-[14px] font-semibold text-ink-400 sm:block">
                        {entry.losses}
                      </span>
                      <span className="tabular hidden text-right text-[14px] font-semibold text-ink-300 sm:block">
                        {Math.round(entry.winRate * 100)}%
                      </span>
                      <span className="hidden justify-end sm:flex">
                        {entry.owedUnits > 0 ? (
                          <Badge tone="rose">{entry.owedUnits}</Badge>
                        ) : (
                          <span className="text-[13px] text-ink-600">—</span>
                        )}
                      </span>

                      {/* Cột gọn cho điện thoại */}
                      <span className="flex justify-end sm:hidden">
                        {entry.owedUnits > 0 ? (
                          <Badge tone="rose">nợ {entry.owedUnits}</Badge>
                        ) : (
                          <Badge tone="emerald">sạch</Badge>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
