"use client";

import { Loader2 } from "@/components/icons";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { buttonClass, type ButtonSize, type ButtonVariant } from "./button";

/**
 * Nút submit tự khoá và hiện spinner trong lúc server action chạy.
 * Phải nằm bên trong <form> thì useFormStatus mới hoạt động.
 */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  pendingText,
  icon,
  disabled,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pendingText?: string;
  icon?: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || Boolean(disabled)}
      aria-busy={pending}
      className={buttonClass(variant, size, className)}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {pendingText ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
