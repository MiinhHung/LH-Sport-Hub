import { Bell, Check, CheckCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { Avatar, Card, EmptyState, PageIntro } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireProfile } from "@/lib/auth";
import { gomThongBao, type NhomThongBao } from "@/lib/gom-thong-bao";
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
  const mang = gomThongBao(items);

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
        /*
          CHIA THEO MỐC THỜI GIAN.

          Trước đây là một danh sách phẳng, mỗi dòng kèm chữ "2 ngày
          trước" — đọc mười dòng là mười lần tự tính xem cái nào mới hơn
          cái nào. Nhãn "Hôm nay / Hôm qua / Tuần này" làm việc đó một
          lần cho cả nhóm.
        */
        <div className="space-y-7">
          {mang.map((m) => (
            <section key={m.nhan} aria-labelledby={`moc-${m.nhan}`}>
              <h2
                id={`moc-${m.nhan}`}
                className="mb-2.5 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase"
              >
                {m.nhan}
              </h2>

              <Card className="divide-y divide-ink-800 overflow-hidden">
                {m.nhom.map((nhom) => (
                  <HangThongBao
                    key={nhom.ids[0]}
                    nhom={nhom}
                    markOne={markOne}
                  />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function HangThongBao({
  nhom,
  markOne,
}: {
  nhom: NhomThongBao;
  markOne: (formData: FormData) => Promise<void>;
}) {
  const nguoiDau = nhom.nguoi[0] ?? null;
  const conLai = nhom.nguoi.length - 1;

  return (
    /*
      CẢ HÀNG BẤM ĐƯỢC, BẰNG LIÊN KẾT PHỦ NỀN.

      Bản trước để một chữ "Xem chi tiết" riêng ở cuối mỗi dòng — đếm
      được 16 cái trên một màn hình, xếp thành một cột chữ xanh chạy dọc
      trang mà cái nào cũng như cái nào. Mà vùng bấm thì chỉ bằng đúng
      hai chữ đó, trong khi cả hàng rộng 700px nhìn đã như bấm được.

      Không bọc cả hàng trong thẻ `a` được, vì bên trong còn nút "đánh
      dấu đã đọc" — nút nằm trong liên kết là HTML sai. Nên liên kết là
      một lớp phủ `absolute inset-0`, còn nút được nâng lên trên bằng
      `relative z-10`.
    */
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 transition-colors",
        nhom.chuaDoc
          ? "bg-gold-50/60 dark:bg-gold-400/10"
          : "hover:bg-ink-850/60",
      )}
    >
      {nhom.chuaDoc && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-gold-400"
        />
      )}

      {nhom.href && (
        <Link
          href={nhom.href}
          className="absolute inset-0 z-0"
          aria-label={nhom.title}
        >
          <span className="sr-only">{nhom.title}</span>
        </Link>
      )}

      <div className="relative shrink-0">
        {nguoiDau ? (
          <Avatar
            name={nguoiDau.fullName}
            src={nguoiDau.avatarUrl}
            seed={nguoiDau.id}
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
          {TYPE_ICON[nhom.type] ?? "🔔"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "text-[14px] leading-snug",
              nhom.chuaDoc
                ? "font-bold text-ink-100"
                : "font-medium text-ink-300",
            )}
          >
            {nhom.title}
          </h3>
          <time
            className="shrink-0 pt-0.5 text-[11px] whitespace-nowrap text-ink-500"
            dateTime={nhom.createdAt.toISOString()}
          >
            {timeAgo(nhom.createdAt)}
          </time>
        </div>

        {nhom.message && (
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
            {nhom.message}
          </p>
        )}

        {/*
          Những người còn lại cùng làm việc này.

          Hiện bằng ảnh + một dòng chữ ngắn chứ KHÔNG viết lại câu tiêu
          đề thành "Hanna và 2 người nữa sẽ đi …": tiêu đề nằm sẵn trong
          database dưới dạng câu hoàn chỉnh, muốn ghép tên vào giữa thì
          phải cắt chuỗi, mà vế sau mỗi loại thông báo một khác — cắt sai
          một chỗ là ra câu vô nghĩa.
        */}
        {conLai > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex -space-x-2">
              {nhom.nguoi.slice(1, 5).map((p) => (
                <Avatar
                  key={p.id}
                  name={p.fullName}
                  src={p.avatarUrl}
                  seed={p.id}
                  size="xs"
                  className="ring-2 ring-ink-900"
                />
              ))}
            </div>
            <span className="text-[12px] text-ink-500">
              và {conLai} người nữa
            </span>
          </div>
        )}
      </div>

      {nhom.chuaDoc && (
        <form action={markOne} className="relative z-10 shrink-0">
          {nhom.ids.map((id) => (
            <input key={id} type="hidden" name="notificationId" value={id} />
          ))}
          <button
            type="submit"
            aria-label="Đánh dấu đã đọc"
            title="Đánh dấu đã đọc"
            className="grid size-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-100"
          >
            <Check className="size-4" />
          </button>
        </form>
      )}
    </div>
  );
}
