"use client";

import { useActionState } from "react";

import { openConversationAction } from "@/actions/chat";
import { idleState } from "@/actions/types";
import { Avatar } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

/** Ô tròn có ảnh + tên, bấm vào là mở cuộc trò chuyện. */
export function StartChatTile({
  person,
}: {
  person: { id: string; fullName: string; avatarUrl: string | null };
}) {
  const [state, action] = useActionState(openConversationAction, idleState);
  const shortName = person.fullName.trim().split(/\s+/).slice(-2).join(" ");

  return (
    <form action={action} className="shrink-0">
      <input type="hidden" name="partnerId" value={person.id} />
      <button
        type="submit"
        className="group flex w-20 flex-col items-center gap-2 rounded-xl px-1 py-2 transition-colors hover:bg-ink-850"
        title={`Nhắn tin cho ${person.fullName}`}
      >
        <Avatar
          name={person.fullName}
          src={person.avatarUrl}
          seed={person.id}
          size="lg"
          className="transition-transform duration-300 group-hover:-translate-y-0.5"
        />
        <span className="line-clamp-2 text-center text-[11.5px] leading-tight font-medium text-ink-400">
          {shortName}
        </span>
      </button>
      {state.status === "error" && state.message && (
        <p className="mt-1 text-[10.5px] text-rose-600 dark:text-rose-400">{state.message}</p>
      )}
    </form>
  );
}

/** Nút "Nhắn tin" dùng ở trang hồ sơ / danh sách thành viên. */
export function StartChatButton({
  partnerId,
  className,
  label = "Nhắn tin",
}: {
  partnerId: string;
  className?: string;
  label?: string;
}) {
  const [state, action] = useActionState(openConversationAction, idleState);

  return (
    <form action={action} className={cn("inline-block", className)}>
      <input type="hidden" name="partnerId" value={partnerId} />
      <SubmitButton variant="secondary" size="sm" pendingText="Đang mở…">
        {label}
      </SubmitButton>
      {state.status === "error" && state.message && (
        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{state.message}</p>
      )}
    </form>
  );
}
