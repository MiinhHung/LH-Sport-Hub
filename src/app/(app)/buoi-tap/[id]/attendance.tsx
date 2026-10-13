"use client";

import { Check, X } from "@/components/icons";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { setAttendanceAction } from "@/actions/sessions";
import { idleState } from "@/actions/types";
import { Alert } from "@/components/ui";
import { cn } from "@/lib/utils";

function Choice({
  value,
  active,
  children,
  tone,
}: {
  value: "going" | "not_going";
  active: boolean;
  children: React.ReactNode;
  tone: "gold" | "rose";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="answer"
      value={value}
      disabled={pending}
      aria-pressed={active}
      className={cn(
        "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-[14px] font-semibold outline-none transition-[background-color,border-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-gold-400/40 active:scale-[0.98] disabled:opacity-60",
        active && tone === "gold" && "border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300",
        active && tone === "rose" && "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
        !active && "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:text-ink-100",
      )}
    >
      {children}
    </button>
  );
}

/** Hai nút chọn: đi hoặc không đi. Bên đang chọn có viền, chữ và dấu tích. */
export function AttendanceButtons({
  sessionId,
  isGoing,
  isNotGoing,
}: {
  sessionId: string;
  isGoing: boolean;
  isNotGoing: boolean;
}) {
  const [state, action] = useActionState(setAttendanceAction, idleState);

  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div
        role="group"
        aria-label="Bạn có đi buổi này không"
        className="flex gap-2"
      >
        <Choice value="going" active={isGoing} tone="gold">
          {isGoing && <Check className="size-4" aria-hidden />}
          {isGoing ? "Bạn sẽ đi" : "Tôi đi"}
        </Choice>
        <Choice value="not_going" active={isNotGoing} tone="rose">
          {isNotGoing && <X className="size-4" aria-hidden />}
          {isNotGoing ? "Bạn không đi" : "Không đi"}
        </Choice>
      </div>
      {state.status === "error" && state.message && (
        <Alert tone="rose">{state.message}</Alert>
      )}
    </form>
  );
}
