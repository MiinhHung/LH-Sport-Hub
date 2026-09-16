"use client";

import { Check, X } from "lucide-react";
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
        "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-200 disabled:opacity-60",
        active && tone === "gold" && "border-gold-300 bg-gold-100 text-gold-700",
        active && tone === "rose" && "border-rose-200 bg-rose-100 text-rose-700",
        !active &&
          "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:bg-ink-850 hover:text-ink-200 active:translate-y-px",
      )}
    >
      {children}
    </button>
  );
}

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
    <form action={action} className="space-y-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="flex gap-2.5">
        <Choice value="going" active={isGoing} tone="gold">
          {isGoing && <Check className="size-4" strokeWidth={3} />}
          {isGoing ? "Bạn sẽ đi" : "Tôi đi"}
        </Choice>
        <Choice value="not_going" active={isNotGoing} tone="rose">
          {isNotGoing && <X className="size-4" strokeWidth={3} />}
          {isNotGoing ? "Bạn không đi" : "Không đi"}
        </Choice>
      </div>
      {state.status === "error" && state.message && (
        <Alert tone="rose">{state.message}</Alert>
      )}
    </form>
  );
}
