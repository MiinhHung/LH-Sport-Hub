import Link from "next/link";
import {
  Layers,
  Megaphone,
  Swords,
  UserSearch,
} from "@/components/icons";
import { cn } from "@/lib/utils";

import type { FeedFilterKey } from "@/lib/feed";

export type { FeedFilterKey };

const FILTER_OPTIONS: {
  key: FeedFilterKey;
  label: string;
  icon: typeof Layers;
}[] = [
  { key: "all", label: "Tất cả", icon: Layers },
  { key: "keo", label: "Kèo thách đấu", icon: Swords },
  { key: "tim-nguoi", label: "Tìm người", icon: UserSearch },
  { key: "thong-bao", label: "Thông báo CLB", icon: Megaphone },
];

export function FeedFilter({
  activeKey = "all",
  baseQuery = {},
}: {
  activeKey?: FeedFilterKey;
  baseQuery?: Record<string, string>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Lọc bảng tin"
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
    >
      {FILTER_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = activeKey === opt.key;

        const params = new URLSearchParams();
        if (baseQuery.bai) params.set("bai", baseQuery.bai);
        if (opt.key !== "all") params.set("loai", opt.key);

        const href = params.toString() ? `?${params.toString()}` : "/bang-tin";

        return (
          <Link
            key={opt.key}
            href={href}
            scroll={false}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold transition-colors duration-150",
              isActive
                ? "border-navy-900 bg-navy-900 text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy-900"
                : "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:text-ink-100",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span>{opt.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
