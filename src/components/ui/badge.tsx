import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Badge variants chuẩn hóa cho thể thao:
 * - open: Đang tìm đối (vàng/amber ấm)
 * - matched: Sắp diễn ra / Đã chốt (xanh emerald)
 * - finished: Đã xong (trung tính slate)
 * - urgent: Cần xử lý / Tranh chấp (hổ phách / đỏ rose)
 * - primary: Navy thương hiệu
 * - outline: Viền mảnh thanh lịch
 */
export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[12px] font-semibold leading-normal whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        primary:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        open:
          "border-gold-200 bg-gold-50 text-gold-700 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300",
        matched:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        finished:
          "border-ink-800 bg-ink-850 text-ink-400",
        urgent:
          "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300",
        gold:
          "border-gold-200 bg-gold-50 text-gold-700 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300",
        outline:
          "border-ink-700 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: "lime" | "emerald" | "amber" | "rose" | "sky" | "violet" | "slate" | "navy";
}

export function Badge({ className, variant, tone, ...props }: BadgeProps) {
  // Hỗ trợ ánh xạ ngược tone cũ sang variant mới
  let resolvedVariant = variant;
  if (!resolvedVariant && tone) {
    switch (tone) {
      case "lime":
        resolvedVariant = "open";
        break;
      case "emerald":
        resolvedVariant = "matched";
        break;
      case "amber":
        resolvedVariant = "open";
        break;
      case "rose":
        resolvedVariant = "urgent";
        break;
      case "navy":
        resolvedVariant = "primary";
        break;
      case "slate":
      default:
        resolvedVariant = "finished";
        break;
    }
  }

  return (
    <div
      className={cn(badgeVariants({ variant: resolvedVariant ?? "default" }), className)}
      {...props}
    />
  );
}
