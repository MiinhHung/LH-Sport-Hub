import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Button variants chuẩn shadcn/ui với design tokens:
 * - Primary: Navy thương hiệu đậm nét, tương phản tối đa
 * - Accent: Vàng kim, chữ navy (accent duy nhất của app)
 * - Secondary: Thẻ nổi viền mảnh 1px
 * - Ghost: Tinh giản cho các hành động phụ
 * - Destructive: Màu đỏ cảnh báo
 * - Outline: Viền nhẹ trong suốt
 */
/*
 * HIỆU ỨNG RÊ CHUỘT, dùng chung cho mọi nút:
 *  - nhô lên 1px kèm bóng đổ (trừ `ghost`: nút trong suốt nằm giữa danh
 *    sách mà nhảy lên thì rối mắt); bấm thì lún về;
 *  - icon trong nút phóng nhẹ và nghiêng một chút;
 *  - nút đặc (`primary`, `accent`) có thêm một vệt sáng quét ngang —
 *    vẽ bằng background-image chạy background-position, KHÔNG dùng lớp
 *    phủ + overflow-hidden, vì nhiều nút icon có chấm báo thò ra ngoài
 *    mép, cắt tràn là mất chấm.
 * Giảm chuyển động: giữ đổi màu, bỏ nhô lên và vệt quét.
 */
const QUET =
  "bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.32)_50%,transparent_65%)] bg-[length:250%_100%] bg-[position:160%_0] bg-no-repeat hover:bg-[position:-60%_0] motion-reduce:bg-none";
const NHO_LEN =
  "hover:-translate-y-px active:translate-y-0 motion-reduce:hover:translate-y-0";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap outline-none transition-[background-color,background-position,border-color,box-shadow,color,transform,translate] duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] [&_svg]:transition-[scale,rotate] [&_svg]:duration-300 [&_svg]:ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:[&_svg]:scale-110 hover:[&_svg]:-rotate-6 motion-reduce:hover:[&_svg]:scale-100 motion-reduce:hover:[&_svg]:rotate-0",
  {
    variants: {
      variant: {
        primary: cn(
          "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:shadow-[0_10px_24px_-10px_rgba(0,26,74,0.6)]",
          QUET,
          NHO_LEN,
        ),
        accent: cn(
          "bg-gold-accent text-navy-900 font-semibold hover:bg-gold-accent-hover hover:shadow-[0_10px_24px_-8px_rgba(200,149,26,0.6)] dark:bg-primary dark:text-primary-foreground",
          QUET,
          NHO_LEN,
        ),
        secondary: cn(
          "bg-card text-foreground font-medium border border-ink-700 hover:border-gold-400 hover:bg-muted hover:shadow-[0_8px_18px_-10px_rgba(0,26,74,0.35)]",
          NHO_LEN,
        ),
        ghost:
          "text-muted-foreground font-medium hover:bg-muted hover:text-foreground",
        destructive: cn(
          "bg-destructive text-destructive-foreground font-semibold hover:bg-rose-700 hover:shadow-[0_10px_24px_-10px_rgba(225,29,72,0.6)]",
          NHO_LEN,
        ),
        danger: cn(
          "bg-destructive text-destructive-foreground font-semibold hover:bg-rose-700 hover:shadow-[0_10px_24px_-10px_rgba(225,29,72,0.6)]",
          NHO_LEN,
        ),
        outline: cn(
          "border border-ink-700 bg-transparent text-foreground font-medium hover:border-gold-400 hover:bg-muted hover:shadow-[0_8px_18px_-10px_rgba(0,26,74,0.35)]",
          NHO_LEN,
        ),
      },
      size: {
        sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
        md: "h-10 px-4 text-sm rounded-lg gap-2",
        lg: "h-11 px-6 text-sm rounded-lg gap-2",
        icon: "size-10 rounded-lg p-0 flex items-center justify-center",
        "icon-sm": "size-8 rounded-lg p-0 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonVariant = NonNullable<ButtonVariantProps["variant"]>;
export type ButtonSize = NonNullable<ButtonVariantProps["size"]>;

export function buttonClass(
  variant: ButtonVariantProps["variant"] = "primary",
  size: ButtonVariantProps["size"] = "md",
  className?: string,
) {
  return cn(buttonVariants({ variant, size, className }));
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export interface LinkButtonProps
  extends React.ComponentProps<typeof Link>,
    ButtonVariantProps {}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
LinkButton.displayName = "LinkButton";
