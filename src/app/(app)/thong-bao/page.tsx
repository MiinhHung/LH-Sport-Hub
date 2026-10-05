import { Bell, CheckCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { Avatar, Card, EmptyState, PageIntro } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireProfile } from "@/lib/auth";
import { listNotifications } from "@/lib/notifications";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Thông báo" };

/** Emoji gợi ý loại sự kiện — nhanh hơn đọc chữ. */
const TYPE_ICON: Record<string, string> = {
  challenge_invited: "⚔️",
  challenge_accepted: "🤝",
  challenge_locked: "🔒",
  challenge_declined: "🙅",
  challenge_cancelled: "❌",
  challenge_left: "🚪",
  result_submitted: "📝",
  result_confirmed: "✅",
  result_disputed: "⚠️",
  result_auto_confirmed: "⏱️",
  debt_marked_paid: "💸",
  debt_paid_confirmed: "🎉",
  debt_waived: "🕊️",
  session_created: "📅",
  session_cancelled: "🌧️",
  session_reminder: "⏰",
  session_joined: "🙋",
  session_updated: "✏️",
  challenge_updated: "✏️",
};

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const items = await listNotifications(profile.id, 60);
  const unread = items.filter((n) => !n.isRead).length;

  async function markAll() {
    "use server";
    await markAllNotificationsReadAction();
  }

  async function markOne(formData: FormData) {
    "use server";
    await markNotificationReadAction({ status: "idle" }, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageIntro
        eyebrow="Hoạt động"
        title="Thông báo"
        lead={
          unread > 0
            ? `Bạn có ${unread} thông báo chưa đọc.`
            : "Bạn đã đọc hết rồi."
        }
        action={
          unread > 0 ? (
            <form action={markAll}>
              <SubmitButton
                variant="secondary"
                size="md"
                pendingText="Đang xử lý…"
              >
                <CheckCheck className="size-4" />
                Đánh dấu đã đọc hết
              </SubmitButton>
            </form>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-5" />}
          title="Chưa có thông báo nào"
          description="Khi có người thách kèo, nhập kết quả hay báo trả nợ, bạn sẽ thấy ở đây."
        />
      ) : (
        <Card className="divide-y divide-ink-800 overflow-hidden">
          {items.map((n) => (
            <article
              key={n.id}
              className={cn(
                "relative flex items-start gap-3 p-4 transition-colors",
                !n.isRead && "bg-gold-50/60 dark:bg-gold-400/10",
              )}
            >
              {!n.isRead && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-[3px] bg-gold-400"
                />
              )}

              <div className="relative shrink-0">
                {n.actor ? (
                  <Avatar
                    name={n.actor.fullName}
                    src={n.actor.avatarUrl}
                    seed={n.actor.id}
                    size="md"
                  />
                ) : (
                  <span className="grid size-10 place-items-center rounded-[11px] bg-ink-850 text-ink-500 ring-1 ring-ink-800">
                    <Bell className="size-4" aria-hidden />
                  </span>
                )}
                <span
                  aria-hidden
                  className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-ink-900 text-[10px] ring-1 ring-ink-800"
                >
                  {TYPE_ICON[n.type] ?? "🔔"}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2
                    className={cn(
                      "text-[14px] leading-snug",
                      n.isRead
                        ? "font-medium text-ink-300"
                        : "font-bold text-ink-100",
                    )}
                  >
                    {n.title}
                  </h2>
                  <time
                    className="shrink-0 pt-0.5 text-[11px] whitespace-nowrap text-ink-500"
                    dateTime={n.createdAt.toISOString()}
                  >
                    {timeAgo(n.createdAt)}
                  </time>
                </div>

                {n.message && (
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                    {n.message}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-3">
                  {n.href && (
                    <Link
                      href={n.href}
                      /* inline-flex + min-h-6: đo được 72×16px, thấp hơn
                         mức 24px tối thiểu cho vùng chạm. Dòng này lặp
                         lại ở mỗi thông báo nên lỗi nhân lên theo số
                         thông báo. */
                      className="inline-flex min-h-6 items-center text-xs font-bold text-link underline-offset-2 hover:underline"
                    >
                      Xem chi tiết
                    </Link>
                  )}
                  {!n.isRead && (
                    <form action={markOne}>
                      <input type="hidden" name="notificationId" value={n.id} />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-ink-500 transition-colors hover:text-ink-200"
                      >
                        Đánh dấu đã đọc
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </article>
          ))}
        </Card>
      )}
    </div>
  );
}
