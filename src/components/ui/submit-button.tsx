"use client";

import { Loader2 } from "lucide-react";
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
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={buttonClass(variant, size, className)}
      {...props}
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
