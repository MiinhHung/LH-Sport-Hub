import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Hành động chính dùng navy thương hiệu — chữ trắng trên navy đạt 15:1.
 * Gold chỉ dùng làm nền cho nút "accent" với chữ navy; gold làm CHỮ trên
 * nền trắng thì không đủ tương phản nên tránh.
 */
const VARIANTS = {
  primary:
    "bg-navy-900 text-white font-semibold shadow-[var(--shadow-card)] hover:bg-navy-800 hover:shadow-[var(--shadow-lift)] active:translate-y-px active:shadow-[var(--shadow-soft)]",
  accent:
    "bg-gradient-gold text-navy-900 font-bold shadow-[var(--shadow-card)] hover:brightness-[1.06] hover:shadow-[var(--shadow-lift)] active:translate-y-px",
  secondary:
    "bg-ink-900 text-ink-200 font-medium border border-ink-700 shadow-[var(--shadow-soft)] hover:border-ink-600 hover:bg-ink-850 active:translate-y-px",
  ghost:
    "text-ink-400 font-medium hover:bg-ink-850 hover:text-ink-100 active:translate-y-px",
  danger:
    "bg-rose-600 text-white font-semibold shadow-[var(--shadow-card)] hover:bg-rose-700 active:translate-y-px",
  outline:
    "border border-ink-100/20 text-ink-100 font-medium hover:border-ink-100/40 hover:bg-navy-50 dark:hover:bg-navy-600/15 active:translate-y-px",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-[15px] rounded-xl gap-2",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap outline-none transition-all duration-200",
    "focus-visible:ring-4 focus-visible:ring-gold-400/30",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button className={buttonClass(variant, size, className)} {...props} />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
