import type { Metadata } from "next";
import Link from "next/link";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import {
  AlertTriangle,
  Ban,
  Bell,
  CalendarClock,
  CalendarDays,
  CalendarX,
  Check,
  CheckCheck,
  ClipboardPen,
  Clock,
  Handshake,
  Lock,
  LogOut,
  Pencil,
  ShieldCheck,
  Smile,
  Swords,
  UserPlus,
  Wallet,
  X,
} from "@/components/icons";
import { Avatar, Card, EmptyState, PageIntro } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireProfile } from "@/lib/auth";
import { gomThongBao, type NhomThongBao } from "@/lib/gom-thong-bao";
import { listNotifications } from "@/lib/notifications";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Thông báo" };

/* ------------------------------------------------------------------ */
/* Biểu tượng theo loại                                                */
/* ------------------------------------------------------------------ */

type Sac = "navy" | "vang" | "do";

/** Ba biểu tượng lấy thẳng từ Phosphor (bộ chung chưa có), nét bold như bộ chung. */
function BatTay({ className }: { className?: string }) {
  return <Handshake weight="bold" aria-hidden className={className} />;
}
function LichHuy({ className }: { className?: string }) {
  return <CalendarX weight="bold" aria-hidden className={className} />;
}
function ThemNguoi({ className }: { className?: string }) {
  return <UserPlus weight="bold" aria-hidden className={className} />;
}

/*
 * Mỗi loại sự kiện một biểu tượng trong ô vuông nhỏ, nhìn là biết chuyện
 * gì mà chưa cần đọc. Sắc ô chỉ có ba: xám navy cho việc thường, vàng
 * cho chuyện tiền / kết quả, đỏ nhạt cho việc bị huỷ hay có tranh cãi.
 */
const LOAI: Record<
  string,
  { Icon: (p: { className?: string }) => React.ReactElement; sac: Sac }
> = {
  challenge_invited: { Icon: Swords, sac: "navy" },
  challenge_accepted: { Icon: BatTay, sac: "navy" },
  challenge_locked: { Icon: Lock, sac: "navy" },
  challenge_declined: { Icon: X, sac: "do" },
  challenge_cancelled: { Icon: Ban, sac: "do" },
  challenge_left: { Icon: LogOut, sac: "do" },
  challenge_updated: { Icon: Pencil, sac: "navy" },
  result_submitted: { Icon: ClipboardPen, sac: "navy" },
  result_confirmed: { Icon: CheckCheck, sac: "vang" },
  result_disputed: { Icon: AlertTriangle, sac: "do" },
  result_auto_confirmed: { Icon: Clock, sac: "vang" },
  debt_marked_paid: { Icon: Wallet, sac: "vang" },
  debt_paid_confirmed: { Icon: ShieldCheck, sac: "vang" },
  debt_waived: { Icon: Smile, sac: "vang" },
  session_created: { Icon: CalendarDays, sac: "navy" },
  session_cancelled: { Icon: LichHuy, sac: "do" },
  session_reminder: { Icon: CalendarClock, sac: "navy" },
  session_joined: { Icon: ThemNguoi, sac: "navy" },
  session_updated: { Icon: Pencil, sac: "navy" },
};

const SAC_O: Record<Sac, string> = {
  navy: "bg-ink-850 text-ink-300",
  vang: "bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300",
  do: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

/* ------------------------------------------------------------------ */
/* Trang                                                               */
/* ------------------------------------------------------------------ */

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
        title="Thông báo"
        lead={
          unread > 0
            ? `Bạn có ${unread} thông báo chưa đọc.`
            : items.length > 0
              ? "Bạn đã đọc hết rồi."
              : undefined
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
          icon={<Bell className="size-6" />}
          title="Chưa có thông báo nào"
          description="Khi có người thách kèo, nhập kết quả hay báo trả nợ, bạn sẽ thấy ở đây."
          action={
            <LinkButton href="/keo" variant="secondary">
              <Swords className="size-4" />
              Xem các kèo
            </LinkButton>
          }
        />
      ) : (
        /*
          CHIA THEO MỐC THỜI GIAN.

          Trước đây là một danh sách phẳng, mỗi dòng kèm chữ "2 ngày
          trước" — đọc mười dòng là mười lần tự tính xem cái nào mới hơn
          cái nào. Nhãn "Hôm nay / Hôm qua / Tuần này" làm việc đó một
          lần cho cả nhóm.

          id của tiêu đề mốc dùng chỉ số, không dùng nhãn: nhãn có dấu
          cách ("Hôm nay"), mà `aria-labelledby` tách id theo dấu cách.
        */
        <div className="space-y-6">
          {mang.map((m, i) => {
            const chuaDoc = m.nhom.filter((n) => n.chuaDoc).length;
            return (
              <section key={m.nhan} aria-labelledby={`moc-${i}`}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2
                    id={`moc-${i}`}
                    className="text-[16px] font-semibold text-ink-100"
                  >
                    {m.nhan}
                  </h2>
                  {chuaDoc > 0 && (
                    <span className="text-[12.5px] font-semibold text-ink-500">
                      <span className="tabular">{chuaDoc}</span> chưa đọc
                    </span>
                  )}
                </div>

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
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Một hàng                                                            */
/* ------------------------------------------------------------------ */

function HangThongBao({
  nhom,
  markOne,
}: {
  nhom: NhomThongBao;
  markOne: (formData: FormData) => Promise<void>;
}) {
  const nguoiDau = nhom.nguoi[0] ?? null;
  const conLai = nhom.nguoi.length - 1;
  const loai = LOAI[nhom.type] ?? { Icon: Bell, sac: "navy" as const };
  const Icon = loai.Icon;

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
        "relative flex items-start gap-3.5 px-4 py-3.5 transition-colors sm:px-5",
        nhom.href && "hover:bg-ink-850/60",
      )}
    >
      {nhom.chuaDoc && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-gold-500"
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

      {/* Ô biểu tượng theo loại, góc dưới là ảnh người gây ra việc */}
      <div className="relative shrink-0">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-lg",
            SAC_O[loai.sac],
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        {nguoiDau && (
          <Avatar
            name={nguoiDau.fullName}
            src={nguoiDau.avatarUrl}
            seed={nguoiDau.id}
            size="xs"
            className="absolute -right-1.5 -bottom-1.5 size-5 text-[8px] ring-2 ring-ink-900"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
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

        {nhom.message && (
          <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-500">
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
        <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-500">
          <time dateTime={nhom.createdAt.toISOString()}>
            {timeAgo(nhom.createdAt)}
          </time>
          {conLai > 0 && (
            <>
              <span aria-hidden className="text-ink-600">
                ·
              </span>
              <span className="flex -space-x-1.5">
                {nhom.nguoi.slice(1, 5).map((p) => (
                  <Avatar
                    key={p.id}
                    name={p.fullName}
                    src={p.avatarUrl}
                    seed={p.id}
                    size="xs"
                    className="size-5 text-[8px] ring-2 ring-ink-900"
                  />
                ))}
              </span>
              <span>và {conLai} người nữa</span>
            </>
          )}
        </div>
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
            className="grid size-10 place-items-center rounded-lg text-ink-500 transition-[background-color,color,transform] hover:bg-ink-850 hover:text-ink-100 active:scale-95"
          >
            <Check className="size-4" />
          </button>
        </form>
      )}
    </div>
  );
}
