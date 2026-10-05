import {
  AlertTriangle,
  CheckCheck,
  ClipboardPen,
  Swords,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ChallengeCard } from "@/components/challenge-card";
import { ChuaCoKeo } from "@/components/keo/chua-co-keo";
import { CotPhaiKeo } from "@/components/keo/cot-phai";
import { TeamFeed } from "@/components/team-feed";
import { Card, PageIntro, SectionTitle } from "@/components/ui";
import { FlowLink } from "@/components/ui/flow-button";
import { requireProfile } from "@/lib/auth";
import { SPORTS, SPORT_KEYS, type SportKey } from "@/lib/constants";
import { getMyTodos, listChallenges } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kèo" };

const TABS = [
  { key: "open", label: "Đang tìm đối" },
  { key: "todo", label: "Kèo của tôi" },
  { key: "done", label: "Đã xong" },
  { key: "all", label: "Tất cả" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function buildHref(tab: string, sport: string | null) {
  const params = new URLSearchParams();
  if (tab !== "open") params.set("tab", tab);
  if (sport) params.set("mon", sport);
  const query = params.toString();
  return query ? `/keo?${query}` : "/keo";
}

const TODO_STYLES = {
  violet:
    "border-violet-200 dark:border-violet-400/30 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100/70 dark:hover:bg-violet-500/20",
  amber:
    "border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100/70 dark:hover:bg-amber-500/20",
  sky: "border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100/70 dark:hover:bg-sky-500/20",
  rose: "border-rose-200 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100/70 dark:hover:bg-rose-500/20",
} as const;

const TODO_ICON_STYLES = {
  violet: "bg-violet-600",
  amber: "bg-amber-600",
  sky: "bg-sky-600",
  rose: "bg-rose-600",
} as const;

function TodoRow({
  href,
  tone,
  icon,
  label,
  detail,
}: {
  href: string;
  tone: keyof typeof TODO_STYLES;
  icon: ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
        TODO_STYLES[tone],
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg text-white",
          TODO_ICON_STYLES[tone],
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-ink-100">
          {label}
        </span>
        <span className="block truncate text-[13px] text-ink-400">
          {detail}
        </span>
      </span>
      <span aria-hidden className="shrink-0 text-ink-500">
        →
      </span>
    </Link>
  );
}

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mon?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const tab = (TABS.find((t) => t.key === params.tab)?.key ?? "open") as Tab;
  const sport =
    params.mon && SPORT_KEYS.includes(params.mon as SportKey)
      ? (params.mon as SportKey)
      : null;

  const [todos, challenges] = await Promise.all([
    getMyTodos(profile.id),
    listChallenges({ tab, sport, userId: profile.id }),
  ]);

  const todoCount =
    todos.invites.length +
    todos.needResult.length +
    todos.needConfirm.length +
    todos.disputed.length;

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Thách đấu"
        title="Kèo"
        lead="Nơi mọi người thách đấu và giao kèo với nhau hehehe"
        action={<FlowLink href="/keo/tao" text="Tạo kèo" />}
      />

      {/* Việc đang chờ chính người dùng xử lý */}
      {todoCount > 0 && (
        <section aria-labelledby="viec-cua-ban">
          <SectionTitle>
            <Zap className="size-4 text-gold-500" aria-hidden />
            <span id="viec-cua-ban">Việc của bạn ({todoCount})</span>
          </SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {todos.invites.map((c) => (
              <TodoRow
                key={c.id}
                href={`/keo/${c.id}`}
                tone="violet"
                icon={<Swords className="size-4" />}
                label="Có người thách bạn"
                detail={c.title}
              />
            ))}
            {todos.needConfirm.map((c) => (
              <TodoRow
                key={c.id}
                href={`/keo/${c.id}`}
                tone="amber"
                icon={<CheckCheck className="size-4" />}
                label="Chờ bạn xác nhận kết quả"
                detail={c.title}
              />
            ))}
            {todos.needResult.map((c) => (
              <TodoRow
                key={c.id}
                href={`/keo/${c.id}`}
                tone="sky"
                icon={<ClipboardPen className="size-4" />}
                label="Đánh xong chưa? Nhập kết quả"
                detail={c.title}
              />
            ))}
            {todos.disputed.map((c) => (
              <TodoRow
                key={c.id}
                href={`/keo/${c.id}`}
                tone="rose"
                icon={<AlertTriangle className="size-4" />}
                label="Đang tranh chấp kết quả"
                detail={c.title}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bộ lọc — tab gạch chân trên một nét kẻ, kiểu mục lục tạp chí.
          Trước đây là hai tầng pill chồng lên nhau, vừa chiếm chỗ vừa
          khiến mắt không biết tầng nào quan trọng hơn. */}
      <section
        aria-label="Bộ lọc kèo"
        className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-ink-800"
      >
        <div className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={buildHref(t.key, sport)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 pb-2.5 text-[14px] font-semibold whitespace-nowrap transition-colors duration-200",
                tab === t.key
                  ? "border-ink-100 text-ink-100"
                  : "border-transparent text-ink-500 hover:border-ink-700 hover:text-ink-200",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="no-scrollbar -mx-4 flex items-center gap-3 overflow-x-auto px-4 pb-2.5">
          <Link
            href={buildHref(tab, null)}
            className={cn(
              "text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-colors",
              !sport
                ? "text-gold-700 dark:text-gold-300"
                : "text-ink-500 hover:text-ink-300",
            )}
          >
            Tất cả
          </Link>
          {SPORT_KEYS.map((key) => (
            <Link
              key={key}
              href={buildHref(tab, key)}
              className={cn(
                "text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-colors",
                sport === key
                  ? "text-gold-700 dark:text-gold-300"
                  : "text-ink-500 hover:text-ink-300",
              )}
            >
              {SPORTS[key].icon} {SPORTS[key].label}
            </Link>
          ))}
        </div>
      </section>

      {/*
        HAI CỘT, như bảng tin. Trang này trước đây là một cột giữa trang
        rộng: chụp ở màn 1536 thì khoảng 85% chiều cao không có gì. Cột
        phải trả lời hai câu người ta thật sự có khi đang nhìn danh sách
        kèo — thách ai, và đánh ở buổi nào.
      */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <section aria-label="Danh sách kèo">
            {challenges.length === 0 ? (
              <ChuaCoKeo
                tieuDe={
                  tab === "open"
                    ? "Chưa có kèo nào đang tìm đối"
                    : "Chưa có kèo nào ở mục này"
                }
                moTa={
                  tab === "open"
                    ? "Mở màn đi — tạo một kèo rồi xem ai dám nhận."
                    : "Thử đổi bộ lọc phía trên xem sao."
                }
                choTaoKeo={tab === "open"}
              />
            ) : (
              /*
                MỘT CỘT, không phải hai.

                Lưới hai cột có nghĩa khi danh sách chiếm cả bề ngang
                trang. Từ lúc có cột phải thì cột trái chỉ còn 776px,
                chia đôi ra 382px mỗi thẻ — mà một thẻ kèo phải chứa hai
                đội, chữ VS ở giữa, dải tiền cược và dãy avatar. Đã đo
                đúng 382px, và nhìn thì thấy ngay là chật.
              */
              <div className="grid gap-3">
                {challenges.map((challenge, i) => (
                  <div
                    key={challenge.id}
                    className="animate-rise"
                    style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                  >
                    <ChallengeCard
                      challenge={challenge}
                      currentUserId={profile.id}
                      href={`/keo/${challenge.id}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ảnh của team — để cuối cột trái, không tranh chỗ với nội dung chính */}
          <TeamFeed />
        </div>

        {/* Cột phải chỉ hiện từ lg, giống bảng tin: dưới mức đó màn hình
            chỉ đủ chỗ cho chính danh sách kèo. */}
        <div className="hidden lg:block">
          <CotPhaiKeo />
        </div>
      </div>
    </div>
  );
}
