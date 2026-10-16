import { Crown, Flame, Ghost, Swords, Trophy } from "@/components/icons";
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
 * Bục ba bậc trên nền navy: hạng 1 đứng giữa, cao nhất, đội vương miện.
 * Ba màu kim loại vàng – bạc – đồng phân hạng; số hạng chỉ in một lần,
 * to trên mặt bục, còn số trận thắng gom vào một dòng nhỏ dưới tên.
 *
 * LUÔN ĐỦ BA BẬC. Team mới có một người thắng thì bản cũ chỉ còn một
 * khối vàng trơ trọi giữa khung. Bậc chưa có người giờ là ô trống viền
 * đứt kèm lời rủ "thắng một kèo để lên bục" — vừa đủ hình, vừa có cớ
 * để đi thách kèo.
 */
const BUC = {
  1: {
    cao: "h-28 sm:h-36",
    mat: "bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 text-navy-950",
    vien: "ring-gold-300 shadow-[0_0_32px_rgba(232,197,106,0.55)]",
    avatar: "xl" as const,
    avatarNho: "size-20 sm:size-24",
    so: "text-[52px] sm:text-[64px]",
    tre: "[animation-delay:120ms]",
  },
  2: {
    cao: "h-20 sm:h-24",
    mat: "bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 text-navy-900",
    vien: "ring-slate-300",
    avatar: "lg" as const,
    avatarNho: "size-14 sm:size-16",
    so: "text-[40px] sm:text-[48px]",
    tre: "[animation-delay:240ms]",
  },
  3: {
    cao: "h-14 sm:h-16",
    mat: "bg-gradient-to-b from-[#e8b07c] via-[#c98a52] to-[#9a5f2c] text-white",
    vien: "ring-[#d99a62]",
    avatar: "lg" as const,
    avatarNho: "size-14 sm:size-16",
    so: "text-[34px] sm:text-[40px]",
    tre: "[animation-delay:360ms]",
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
  const b = BUC[hang];
  const isMe = entry?.profile.id === meId;

  return (
    <li className="flex min-w-0 flex-col items-center">
      {entry ? (
        <>
          <div className="relative">
            {hang === 1 && (
              <Crown
                aria-hidden
                className="absolute -top-7 left-1/2 size-7 -translate-x-1/2 fill-gold-400 text-gold-300 drop-shadow-[0_2px_8px_rgba(232,197,106,0.6)] sm:-top-8 sm:size-8"
              />
            )}
            <LinkHoSo
              id={entry.profile.id}
              nguoiXem={meId}
              ten={entry.profile.fullName}
              className="block rounded-full"
            >
              <Avatar
                name={entry.profile.fullName}
                src={entry.profile.avatarUrl}
                seed={entry.profile.id}
                size={b.avatar}
                className={cn("ring-[3px] ring-offset-[3px] ring-offset-navy-950", b.vien, b.avatarNho)}
              />
            </LinkHoSo>
          </div>

          <p className="mt-3 flex w-full min-w-0 items-center justify-center gap-1.5 px-1">
            <span className="truncate text-[13.5px] font-bold text-white sm:text-[15px]">
              {entry.profile.fullName}
            </span>
            {isMe && (
              <span className="shrink-0 rounded-full bg-gold-400 px-1.5 py-px text-[10.5px] font-bold text-navy-950">
                Bạn
              </span>
            )}
          </p>
          <p className="tabular mt-1 text-center text-[12px] text-white/60 sm:text-[12.5px]">
            <span className="font-semibold text-white/90">{entry.wins}</span> thắng
            <span aria-hidden className="text-white/30">
              {" · "}
            </span>
            {phanTram(entry)}%
          </p>
        </>
      ) : (
        <>
          <span
            aria-hidden
            className={cn(
              "grid place-items-center rounded-full border-2 border-dashed border-white/20 text-[22px] font-bold text-white/30",
              b.avatarNho,
            )}
          >
            ?
          </span>
          <p className="mt-3 text-[13.5px] font-semibold text-white/50 sm:text-[14.5px]">
            Còn trống
          </p>
          <p className="mt-1 px-1 text-center text-[11.5px] leading-snug text-white/40 sm:text-[12px]">
            Thắng 1 kèo để lên bục
          </p>
        </>
      )}

      {/* Mặt bục: mọc lên từ sàn, số hạng in to */}
      <div
        className={cn(
          "animate-podium relative mt-4 flex w-full items-start justify-center overflow-hidden rounded-t-2xl pt-2",
          b.cao,
          b.tre,
          entry ? b.mat : "border border-b-0 border-dashed border-white/15 bg-white/[0.03] text-white/20",
        )}
      >
        {/* Vệt sáng mép trên như mặt bục kim loại */}
        {entry && (
          <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-white/40" />
        )}
        <span className={cn("tabular font-display leading-none font-black", b.so)}>
          {hang}
        </span>
        <span className="sr-only">
          Hạng {hang}
          {!entry && ": còn trống"}
        </span>
      </div>
    </li>
  );
}

function BucNhanGiai({
  top,
  meId,
  soNguoi,
}: {
  top: LeaderboardEntry[];
  meId: string;
  soNguoi: number;
}) {
  return (
    <section aria-labelledby="buc">
      <div className="relative isolate overflow-hidden rounded-2xl bg-navy-950 px-3 pt-6 ring-1 ring-white/10 sm:px-8 sm:pt-7">
        {/* Nền: quầng vàng sau hạng 1, lưới mờ, vạch sàn */}
        <div
          aria-hidden
          className="absolute top-10 left-1/2 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-gold-400/20 blur-[90px]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
        />

        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="buc"
            className="font-sport text-[13px] font-bold tracking-[0.25em] text-gold-300 uppercase"
          >
            Top 3 dẫn đầu
          </h2>
          <span className="tabular text-[12.5px] text-white/50">
            {soNguoi} người đã ra sân
          </span>
        </div>

        {/* Thứ tự hiển thị 2 - 1 - 3 cho hạng 1 đứng giữa */}
        <ol className="mt-10 grid grid-cols-3 items-end gap-2 sm:mt-12 sm:gap-5">
          <BacBuc entry={top[1]} hang={2} meId={meId} />
          <BacBuc entry={top[0]} hang={1} meId={meId} />
          <BacBuc entry={top[2]} hang={3} meId={meId} />
        </ol>
      </div>
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
            <BucNhanGiai
              top={bucNhanGiai}
              meId={me.id}
              soNguoi={played.length}
            />

            {/* Bảng xếp hạng */}
            <section aria-labelledby="xep-hang">
              <Card className="overflow-hidden">
                <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
                  <h2 id="xep-hang" className="text-[16px] font-semibold text-ink-100">
                    Xếp hạng
                  </h2>
                  <span className="text-[12.5px] text-ink-500">
                    Theo số trận thắng
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
