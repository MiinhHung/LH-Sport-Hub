import { Flame, Ghost, Swords, Trophy } from "@/components/icons";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LinkHoSo } from "@/components/thanh-vien/link-ho-so";
import { Avatar, Card, EmptyState, PageIntro } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bảng phong thần" };

const phanTram = (e: LeaderboardEntry) => Math.round(e.winRate * 100);

/* ------------------------------------------------------------------ */
/* Bục nhận giải                                                       */
/* ------------------------------------------------------------------ */

/*
 * Bục ba bậc: hạng 1 đứng giữa và cao nhất, như bục thật ở giải đấu.
 * Phân hạng bằng chiều cao bục, cỡ chữ và màu thương hiệu (vàng cho
 * hạng 1, navy cho hạng 2 và 3), không dùng huy chương emoji.
 */
const BUC = {
  1: {
    cao: "h-24 sm:h-28",
    nen: "bg-gold-400 text-navy-900",
    avatar: "lg" as const,
    so: "text-[40px] sm:text-[48px]",
  },
  2: {
    cao: "h-16 sm:h-20",
    nen: "bg-navy-900 text-gold-300",
    avatar: "md" as const,
    so: "text-[30px] sm:text-[36px]",
  },
  3: {
    cao: "h-11 sm:h-14",
    nen: "bg-navy-800 text-white",
    avatar: "md" as const,
    so: "text-[26px] sm:text-[30px]",
  },
};

function BacBuc({
  entry,
  hang,
  meId,
}: {
  entry: LeaderboardEntry | undefined;
  hang: 1 | 2 | 3;
  meId: string;
}) {
  // Giữ chỗ trống để hạng 1 vẫn đứng giữa khi chưa đủ ba người.
  if (!entry) return <li aria-hidden />;

  const b = BUC[hang];
  const isMe = entry.profile.id === meId;

  return (
    <li className="flex min-w-0 flex-col items-center">
      <LinkHoSo
        id={entry.profile.id}
        nguoiXem={meId}
        ten={entry.profile.fullName}
        className="rounded-full"
      >
        <Avatar
          name={entry.profile.fullName}
          src={entry.profile.avatarUrl}
          seed={entry.profile.id}
          size={b.avatar}
          className={cn(hang === 1 && "ring-2 ring-gold-400 ring-offset-2 ring-offset-ink-900")}
        />
      </LinkHoSo>

      <p className="mt-2.5 w-full truncate px-1 text-center text-[13.5px] font-bold text-ink-100 sm:text-[14.5px]">
        {entry.profile.fullName}
      </p>
      <p className="mt-0.5 text-center text-[12px] text-ink-500">
        {isMe ? (
          <span className="font-semibold text-gold-700 dark:text-gold-300">Bạn</span>
        ) : (
          <span className="tabular">{phanTram(entry)}% thắng</span>
        )}
      </p>

      {/* Bục: số trận thắng là con số chính, số hạng nằm trên mặt bục */}
      <p className="mt-2 flex items-baseline gap-1">
        <span
          className={cn(
            "tabular font-display leading-none font-bold text-ink-100",
            b.so,
          )}
        >
          {entry.wins}
        </span>
        <span className="text-[12px] font-medium text-ink-500">thắng</span>
      </p>

      <div
        className={cn(
          "mt-3 flex w-full items-start justify-center rounded-t-xl pt-2",
          b.cao,
          b.nen,
        )}
      >
        <span className="tabular font-display text-[20px] leading-none font-bold sm:text-[24px]">
          {hang}
        </span>
        <span className="sr-only">Hạng {hang}</span>
      </div>
    </li>
  );
}

function BucNhanGiai({
  top,
  meId,
}: {
  top: LeaderboardEntry[];
  meId: string;
}) {
  return (
    <section aria-labelledby="buc">
      <h2 id="buc" className="sr-only">
        Ba người dẫn đầu
      </h2>
      <Card className="overflow-hidden px-3 pt-6 sm:px-8 sm:pt-8">
        {/* Thứ tự hiển thị 2 - 1 - 3 cho hạng 1 đứng giữa */}
        <ol className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          <BacBuc entry={top[1]} hang={2} meId={meId} />
          <BacBuc entry={top[0]} hang={1} meId={meId} />
          <BacBuc entry={top[2]} hang={3} meId={meId} />
        </ol>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Danh hiệu                                                           */
/* ------------------------------------------------------------------ */

/** Một dòng danh hiệu vui - chỉ hiện khi thật sự có người đứng đầu hạng mục. */
function DanhHieu({
  title,
  entry,
  value,
  icon,
  canh,
  meId,
}: {
  title: string;
  entry: LeaderboardEntry | undefined;
  value: string;
  icon: ReactNode;
  /** Danh hiệu "xấu" (xù kèo) dùng tông đỏ cho khác hẳn. */
  canh?: boolean;
  meId: string;
}) {
  if (!entry) return null;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg",
          canh
            ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
            : "bg-ink-850 text-ink-300",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold text-ink-500">
          {title}
        </span>
        <span className="block truncate text-[14px] leading-snug font-semibold text-ink-100">
          <LinkHoSo
            id={entry.profile.id}
            nguoiXem={meId}
            ten={entry.profile.fullName}
            className="rounded hover:underline"
          >
            {entry.profile.fullName}
          </LinkHoSo>
        </span>
      </span>
      <span className="tabular shrink-0 text-right text-[12.5px] font-semibold text-ink-400">
        {value}
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Bảng xếp hạng                                                       */
/* ------------------------------------------------------------------ */

const COT =
  "grid-cols-[2rem_minmax(0,1fr)_auto] sm:grid-cols-[2.25rem_minmax(0,1fr)_repeat(4,3.75rem)]";

function SoHang({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "tabular font-display text-[15px] leading-none font-bold",
        rank === 1
          ? "text-gold-700 dark:text-gold-300"
          : rank <= 3
            ? "text-ink-100"
            : "text-ink-500",
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
  const topPlayer = [...played].sort((a, b) => b.played - a.played)[0];
  const topStreak = [...played]
    .filter((e) => e.currentStreak >= 2)
    .sort((a, b) => b.currentStreak - a.currentStreak)[0];
  const topGhost = [...board]
    .filter((e) => e.ghosted > 0)
    .sort((a, b) => b.ghosted - a.ghosted)[0];

  /* Chỉ người đã có ít nhất một trận thắng mới lên bục: team mới có hai
     người đánh thì người thua đứng bục bạc trông như được thưởng cho
     một trận thua. */
  const bucNhanGiai = played.slice(0, 3).filter((e) => e.wins > 0);

  return (
    <div className="space-y-6">
      <PageIntro
        title="Bảng phong thần"
        lead="Bảng xếp hạng dựa trên kết quả thi đấu thực tế được cả hai đội xác nhận."
      />

      {played.length === 0 ? (
        /*
          BẢNG NÀY RỖNG SUỐT TUẦN ĐẦU, VÀ ĐÓ LÀ CHUYỆN BÌNH THƯỜNG.
          Nó chỉ có dữ liệu sau khi một kèo được chốt kết quả và cả hai
          bên xác nhận — sớm nhất cũng phải qua một buổi ra sân.

          Nên màn hình rỗng ở đây không được là ngõ cụt. Cả trang không
          có một lối hành động nào khác: người mới mở ra chỉ thấy cái cúp
          với một câu thông báo, rồi thoát.
        */
        <EmptyState
          icon={<Trophy className="size-6" />}
          title="Chưa có kèo nào chốt kết quả"
          description="Đánh xong nhớ nhập kết quả, đủ hai bên xác nhận thì mới lên bảng. Ai thắng trận đầu là đứng đầu luôn."
          action={
            <LinkButton href="/keo/tao" variant="accent">
              <Swords className="size-4" />
              Thách một kèo
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            {bucNhanGiai.length > 0 && (
              <BucNhanGiai top={bucNhanGiai} meId={me.id} />
            )}

            {/* Bảng xếp hạng */}
            <section aria-labelledby="xep-hang">
              <Card className="overflow-hidden">
                <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
                  <h2 id="xep-hang" className="text-[16px] font-semibold text-ink-100">
                    Xếp hạng
                  </h2>
                  <span className="tabular text-[12.5px] text-ink-500">
                    {played.length} người đã ra sân
                  </span>
                </div>

                <div
                  className={cn(
                    "hidden gap-3 border-y border-ink-800 bg-ink-850 px-4 py-2 text-[12px] font-semibold text-ink-500 sm:grid sm:px-5",
                    COT,
                  )}
                >
                  <span>#</span>
                  <span>Thành viên</span>
                  <span className="text-right">Thắng</span>
                  <span className="text-right">Thua</span>
                  <span className="text-right">Tỉ lệ</span>
                  <span className="text-right">Chuỗi</span>
                </div>

                <ol className="divide-y divide-ink-800 border-t border-ink-800 sm:border-t-0">
                  {played.map((entry, i) => {
                    const isMe = entry.profile.id === me.id;
                    const tiLe = phanTram(entry);
                    return (
                      <li
                        key={entry.profile.id}
                        aria-current={isMe ? "true" : undefined}
                        className={cn(
                          "relative grid items-center gap-3 px-4 py-3 sm:px-5",
                          COT,
                          isMe && "bg-gold-50/60 dark:bg-gold-400/5",
                        )}
                      >
                        {/* Vạch vàng mép trái: tìm dòng của mình trong một giây */}
                        {isMe && (
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 w-[3px] bg-gold-400"
                          />
                        )}

                        <SoHang rank={i + 1} />

                        <div className="flex min-w-0 items-center gap-3">
                          <LinkHoSo
                            id={entry.profile.id}
                            nguoiXem={me.id}
                            ten={entry.profile.fullName}
                            className="shrink-0 rounded-full"
                          >
                            <Avatar
                              name={entry.profile.fullName}
                              src={entry.profile.avatarUrl}
                              seed={entry.profile.id}
                              size="md"
                            />
                          </LinkHoSo>
                          <div className="min-w-0">
                            <p className="flex min-w-0 items-center gap-2">
                              <LinkHoSo
                                id={entry.profile.id}
                                nguoiXem={me.id}
                                ten={entry.profile.fullName}
                                className="min-w-0 truncate rounded text-[14px] font-semibold text-ink-100 hover:underline"
                              >
                                {entry.profile.fullName}
                              </LinkHoSo>
                              {isMe && (
                                <span className="shrink-0 rounded-lg bg-navy-900 px-1.5 py-px text-[11px] font-semibold text-white dark:bg-ink-700">
                                  Bạn
                                </span>
                              )}
                            </p>
                            {/* Điện thoại: số liệu gom vào dòng phụ */}
                            <p className="tabular mt-0.5 truncate text-[12.5px] text-ink-500 sm:hidden">
                              {entry.wins} thắng
                              <span aria-hidden className="text-ink-600">
                                {" · "}
                              </span>
                              {entry.losses} thua
                            </p>
                            {entry.profile.department && (
                              <p className="mt-0.5 hidden truncate text-[12.5px] text-ink-500 sm:block">
                                {entry.profile.department}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="tabular font-display hidden text-right text-[16px] font-bold text-ink-100 sm:block">
                          {entry.wins}
                        </span>
                        <span className="tabular hidden text-right text-[14px] font-semibold text-ink-400 sm:block">
                          {entry.losses}
                        </span>
                        <span
                          className={cn(
                            "tabular hidden text-right text-[14px] font-semibold sm:block",
                            tiLe >= 50 ? "text-ink-200" : "text-ink-500",
                          )}
                        >
                          {tiLe}%
                        </span>
                        <span className="hidden items-center justify-end gap-1 sm:flex">
                          {entry.currentStreak >= 2 ? (
                            <span
                              className="tabular inline-flex items-center gap-1 text-[14px] font-bold text-gold-700 dark:text-gold-300"
                              title={`${entry.currentStreak} trận thắng liên tiếp`}
                            >
                              <Flame className="size-3.5" aria-hidden />
                              {entry.currentStreak}
                            </span>
                          ) : (
                            <span className="tabular text-[14px] text-ink-500">
                              {entry.currentStreak}
                            </span>
                          )}
                        </span>

                        {/* Cột gọn cho điện thoại: tỉ lệ thắng to, chuỗi bên dưới */}
                        <span className="flex flex-col items-end sm:hidden">
                          <span
                            className={cn(
                              "tabular font-display text-[16px] leading-none font-bold",
                              tiLe >= 50 ? "text-ink-100" : "text-ink-500",
                            )}
                          >
                            {tiLe}%
                          </span>
                          {entry.currentStreak >= 2 && (
                            <span className="tabular mt-1 inline-flex items-center gap-0.5 text-[12px] font-semibold text-gold-700 dark:text-gold-300">
                              <Flame className="size-3" aria-hidden />
                              {entry.currentStreak}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            </section>
          </div>

          {/* Danh hiệu */}
          <aside className="lg:sticky lg:top-10">
            <section aria-labelledby="danh-hieu">
              <Card className="overflow-hidden">
                <div className="px-4 pt-4 pb-3">
                  <h2 id="danh-hieu" className="text-[16px] font-semibold text-ink-100">
                    Danh hiệu
                  </h2>
                </div>
                <ul className="divide-y divide-ink-800 border-t border-ink-800">
                  <DanhHieu
                    title="Vua kèo"
                    entry={topWinner}
                    value={`${topWinner?.wins} thắng`}
                    icon={<Trophy className="size-[18px]" />}
                    meId={me.id}
                  />
                  <DanhHieu
                    title="Chăm nhất"
                    entry={topPlayer}
                    value={`${topPlayer?.played ?? 0} trận`}
                    icon={<Swords className="size-[18px]" />}
                    meId={me.id}
                  />
                  <DanhHieu
                    title="Đang có phong độ"
                    entry={topStreak}
                    value={`${topStreak?.currentStreak} liên tiếp`}
                    icon={<Flame className="size-[18px]" />}
                    meId={me.id}
                  />
                  <DanhHieu
                    title="Thánh xù kèo"
                    entry={topGhost}
                    value={`${topGhost?.ghosted} kèo bỏ dở`}
                    icon={<Ghost className="size-[18px]" />}
                    canh
                    meId={me.id}
                  />
                </ul>

                <div className="border-t border-ink-800 p-3">
                  <LinkButton href="/keo/tao" className="w-full">
                    <Swords className="size-4 text-gold-300" />
                    <span>Tạo kèo thách đấu</span>
                  </LinkButton>
                </div>
              </Card>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
