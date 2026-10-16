import { SportIcon } from "@/components/domain-icons";
import {
  AlertTriangle,
  CheckCheck,
  ChevronRight,
  ClipboardPen,
  Swords,
} from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ChallengeCard } from "@/components/challenge-card";
import { ChuaCoKeo } from "@/components/keo/chua-co-keo";
import { CotPhaiKeo } from "@/components/keo/cot-phai";
import { Badge, Card, PageIntro } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
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

/*
 * Chỉ có hai màu theo đúng bảng nghĩa của DESIGN.md: vàng = việc đang chờ
 * bạn làm, đỏ = tranh chấp.
 */
const TODO_TILES = {
  gold: "bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
} as const;

function TodoRow({
  href,
  tone,
  icon,
  label,
  detail,
}: {
  href: string;
  tone: keyof typeof TODO_TILES;
  icon: ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-ink-850"
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            TODO_TILES[tone],
          )}
          aria-hidden
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] leading-snug font-semibold text-ink-100">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink-500">
            {detail}
          </span>
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-ink-500 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </li>
  );
}

/** Chip lọc dạng viên, cùng kiểu với các bộ lọc khác trong app. */
function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
        active
          ? "border-navy-900 bg-navy-900 text-white dark:border-ink-600 dark:bg-ink-700"
          : "border-ink-800 text-ink-400 hover:border-ink-700 hover:text-ink-100",
      )}
    >
      {children}
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
    <div className="space-y-6">
      <PageIntro
        title="Kèo đấu"
        lead="Sân chơi thách đấu nội bộ: tự tạo kèo, ghép đội 1v1 hoặc 2v2 và phân định thắng thua."
        action={
          <LinkButton href="/keo/tao" variant="accent">
            <Swords className="size-4" />
            <span>Tạo kèo mới</span>
          </LinkButton>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* Việc đang chờ chính người dùng xử lý: một thẻ, các dòng ngăn bằng đường kẻ */}
          {todoCount > 0 && (
            <section aria-labelledby="viec-cua-ban">
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-ink-800 px-4 py-3">
                  <h2
                    id="viec-cua-ban"
                    className="text-[16px] font-semibold text-ink-100"
                  >
                    Kèo của bạn cần xử lý
                  </h2>
                  <Badge tone="lime" className="tabular">
                    {todoCount}
                  </Badge>
                </div>
                <ul className="divide-y divide-ink-800">
                  {todos.invites.map((c) => (
                    <TodoRow
                      key={c.id}
                      href={`/keo/${c.id}`}
                      tone="gold"
                      icon={<Swords className="size-[18px]" />}
                      label="Có người thách bạn"
                      detail={c.title}
                    />
                  ))}
                  {todos.needConfirm.map((c) => (
                    <TodoRow
                      key={c.id}
                      href={`/keo/${c.id}`}
                      tone="gold"
                      icon={<CheckCheck className="size-[18px]" />}
                      label="Chờ bạn xác nhận kết quả"
                      detail={c.title}
                    />
                  ))}
                  {todos.needResult.map((c) => (
                    <TodoRow
                      key={c.id}
                      href={`/keo/${c.id}`}
                      tone="gold"
                      icon={<ClipboardPen className="size-[18px]" />}
                      label="Đánh xong chưa? Nhập kết quả"
                      detail={c.title}
                    />
                  ))}
                  {todos.disputed.map((c) => (
                    <TodoRow
                      key={c.id}
                      href={`/keo/${c.id}`}
                      tone="rose"
                      icon={<AlertTriangle className="size-[18px]" />}
                      label="Đang tranh chấp kết quả"
                      detail={c.title}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {/* Bộ lọc: trạng thái bên trái, môn bên phải. Dưới sm thì mỗi
              nhóm một hàng, trượt ngang được nếu không đủ chỗ. */}
          <section
            aria-label="Bộ lọc kèo"
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5"
          >
            <nav
              aria-label="Lọc theo trạng thái"
              className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            >
              {TABS.map((t) => (
                <Pill
                  key={t.key}
                  href={buildHref(t.key, sport)}
                  active={tab === t.key}
                >
                  {t.label}
                </Pill>
              ))}
            </nav>

            <nav
              aria-label="Lọc theo môn"
              className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            >
              <Pill href={buildHref(tab, null)} active={!sport}>
                Mọi môn
              </Pill>
              {SPORT_KEYS.map((key) => (
                <Pill key={key} href={buildHref(tab, key)} active={sport === key}>
                  <SportIcon sport={key} />
                  {SPORTS[key].label}
                </Pill>
              ))}
            </nav>
          </section>

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
                    ? "Mở màn đi: tạo một kèo rồi xem ai dám nhận."
                    : "Thử đổi bộ lọc phía trên xem sao."
                }
                choTaoKeo={tab === "open"}
              />
            ) : (
              /*
                MỘT CỘT, không phải hai.

                Lưới hai cột có nghĩa khi danh sách chiếm cả bề ngang
                trang. Từ lúc có cột phải thì cột trái chỉ còn chừng
                776px, chia đôi ra 382px mỗi thẻ — mà một thẻ kèo phải
                chứa hai đội, chữ VS ở giữa, dải phần thưởng và dãy
                avatar. Đã đo đúng 382px, và nhìn thì thấy ngay là chật.
              */
              <div className="space-y-4">
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
