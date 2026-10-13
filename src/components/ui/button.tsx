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
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap outline-none transition-[background-color,border-color,box-shadow,color,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
        accent:
          "bg-gold-accent text-navy-900 font-semibold hover:bg-gold-accent-hover dark:bg-primary dark:text-primary-foreground",
        secondary:
          "bg-card text-foreground font-medium border border-ink-700 hover:bg-muted",
        ghost:
          "text-muted-foreground font-medium hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground font-semibold hover:bg-rose-700",
        danger:
          "bg-destructive text-destructive-foreground font-semibold hover:bg-rose-700",
        outline:
          "border border-ink-700 bg-transparent text-foreground font-medium hover:bg-muted",
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
