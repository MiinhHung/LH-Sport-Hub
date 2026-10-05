"use client";

import { useActionState, useRef, type ReactNode } from "react";

import { idleState, type ActionState } from "@/actions/types";
import { tachCau, useHoiLai } from "@/components/ui/hoi-lai";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ServerAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/**
 * Nút bấm gọi một server action, kèm các giá trị ẩn.
 * Tự hiện lỗi ngay dưới nút thay vì nuốt lặng.
 */
export function ActionButton({
  action,
  fields,
  children,
  variant = "primary",
  size = "md",
  className,
  wrapperClassName,
  confirmMessage,
  icon,
  disabled,
  title,
}: {
  action: ServerAction;
  fields: Record<string, string>;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  wrapperClassName?: string;
  /** Có giá trị thì hỏi lại trước khi gửi. */
  confirmMessage?: string;
  icon?: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const { hoi, hopThoai } = useHoiLai();
  const formRef = useRef<HTMLFormElement>(null);

  /*
   * Hỏi lại bằng hộp thoại của app thì phải CHỜ câu trả lời, mà
   * `onSubmit` thì không chờ được: hàm phải trả về ngay, nếu không
   * trình duyệt coi như không ai chặn và cứ thế gửi form đi.
   *
   * Nên chặn lần gửi đầu, hỏi, rồi tự gọi `requestSubmit()` lần hai.
   * Cờ này để lần hai đi thẳng qua, không rơi vào vòng hỏi lại.
   */
  const daHoiRoi = useRef(false);

  return (
    <form
      action={formAction}
      className={cn("inline-flex flex-col gap-1", wrapperClassName)}
      ref={formRef}
      onSubmit={async (event) => {
        if (!confirmMessage) return;
        if (daHoiRoi.current) {
          daHoiRoi.current = false;
          return;
        }
        event.preventDefault();
        const ok = await hoi({ ...tachCau(confirmMessage), nguyHiem: true });
        if (!ok) return;
        daHoiRoi.current = true;
        formRef.current?.requestSubmit();
      }}
    >
      {hopThoai}
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        title={title}
        icon={icon}
      >
        {children}
      </SubmitButton>
      {state.status === "error" && state.message && (
        <p className="max-w-[16rem] text-xs leading-snug text-rose-300">
          {state.message}
        </p>
      )}
      {state.status === "success" && state.message && (
        <p className="max-w-[16rem] text-xs leading-snug text-emerald-300">
          {state.message}
        </p>
      )}
    </form>
  );
}
