import {
  Ban,
  CalendarDays,
  CheckCheck,
  FileText,
  Flag,
  ShieldCheck,
  Swords,
  Trash2,
  UserCog,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

/**
 * Nhật ký hoạt động của trang quản trị.
 *
 * TRƯỚC ĐÂY TRANG NÀY IN THẲNG MÃ RA MÀN HÌNH: `challenge.move_team`,
 * `result.auto_confirm`, `admin.set_role` — trong một ô `<code>` nền
 * xám. Mã đó viết cho lập trình viên đọc log, không phải cho một người
 * trong team mở trang quản trị ra xem hôm qua có chuyện gì. Ngay cả
 * admin của team này cũng là dân văn phòng, không phải kỹ sư.
 *
 * Mỗi mã giờ thành một câu tiếng Việt và một cái icon theo nhóm việc,
 * nên liếc qua là phân biệt được việc kèo với việc quản trị. Mã gốc vẫn
 * còn ở `title` của dòng: khi cần tra cứu thì rê chuột vào là thấy.
 */

type Mau = "gold" | "sky" | "violet" | "rose" | "emerald" | "slate";

const MAU: Record<Mau, string> = {
  gold: "bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  violet:
    "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  emerald:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  slate: "bg-ink-850 text-ink-400",
};

/**
 * Câu mô tả viết ở ngôi thứ ba, nối ngay sau tên người làm:
 * "Minh Hùng · tạo một kèo mới".
 */
const VIEC: Record<string, { chu: string; icon: LucideIcon; mau: Mau }> = {
  "admin.set_role": { chu: "đổi vai trò của một thành viên", icon: UserCog, mau: "violet" },
  "admin.suspend": { chu: "khoá một tài khoản", icon: Ban, mau: "rose" },
  "admin.reactivate": { chu: "mở khoá một tài khoản", icon: ShieldCheck, mau: "emerald" },

  "challenge.create": { chu: "tạo một kèo mới", icon: Swords, mau: "gold" },
  "challenge.join": { chu: "nhận một kèo", icon: Swords, mau: "gold" },
  "challenge.accept": { chu: "đồng ý một lời thách", icon: Swords, mau: "gold" },
  "challenge.decline": { chu: "từ chối một lời thách", icon: Swords, mau: "slate" },
  "challenge.leave": { chu: "rút khỏi một kèo", icon: Swords, mau: "slate" },
  "challenge.cancel": { chu: "huỷ một kèo", icon: Swords, mau: "slate" },
  "challenge.delete": { chu: "xoá một kèo", icon: Trash2, mau: "rose" },
  "challenge.move_team": { chu: "chuyển người sang đội khác", icon: Swords, mau: "gold" },

  "result.submit": { chu: "nhập kết quả một kèo", icon: CheckCheck, mau: "emerald" },
  "result.resubmit": { chu: "nhập lại kết quả một kèo", icon: CheckCheck, mau: "emerald" },
  "result.confirm": { chu: "xác nhận kết quả", icon: CheckCheck, mau: "emerald" },
  "result.auto_confirm": { chu: "kết quả tự chốt sau thời hạn", icon: CheckCheck, mau: "slate" },
  "result.dispute": { chu: "báo sai kết quả", icon: Flag, mau: "rose" },

  "post.create": { chu: "đăng một bài", icon: FileText, mau: "sky" },
  "post.delete": { chu: "xoá một bài", icon: Trash2, mau: "rose" },
  "post.pin": { chu: "ghim một bài", icon: FileText, mau: "sky" },
  "post.unpin": { chu: "bỏ ghim một bài", icon: FileText, mau: "slate" },
  "comment.delete": { chu: "xoá một bình luận", icon: Trash2, mau: "rose" },

  "session.create": { chu: "tạo một buổi tập", icon: CalendarDays, mau: "sky" },
  "session.attendance": { chu: "điểm danh buổi tập", icon: CalendarDays, mau: "sky" },
  "session.cancel": { chu: "huỷ một buổi tập", icon: CalendarDays, mau: "slate" },
  "session.delete": { chu: "xoá một buổi tập", icon: Trash2, mau: "rose" },

  "profile.update": { chu: "cập nhật hồ sơ", icon: UserCog, mau: "slate" },
};

/**
 * Mã lạ thì tự dựng một câu tạm từ chính nó thay vì in nguyên mã.
 * Thêm một hành động mới mà quên khai báo ở trên vẫn ra được chữ đọc
 * hiểu được, chứ không rơi về `challenge.move_team`.
 */
const NHOM: Record<string, string> = {
  admin: "quản trị",
  challenge: "kèo",
  result: "kết quả",
  post: "bài viết",
  comment: "bình luận",
  session: "buổi tập",
  profile: "hồ sơ",
};

function doc(action: string) {
  const biet = VIEC[action];
  if (biet) return biet;

  const [nhom] = action.split(".");
  return {
    chu: `thao tác ${NHOM[nhom] ?? "khác"}`,
    icon: ShieldCheck,
    mau: "slate" as Mau,
  };
}

export function NhatKy({
  logs,
  nameById,
}: {
  logs: { id: string; action: string; actorId: string | null; createdAt: Date }[];
  nameById: Map<string, string>;
}) {
  return (
    <Card className="divide-y divide-ink-800 overflow-hidden">
      {logs.map((log) => {
        const { chu, icon: Icon, mau } = doc(log.action);
        const ten = log.actorId
          ? (nameById.get(log.actorId) ?? "Người dùng đã xoá")
          : "Hệ thống";

        return (
          <div
            key={log.id}
            className="flex items-center gap-3 px-4 py-2.5"
            title={log.action}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-lg",
                MAU[mau],
              )}
            >
              <Icon className="size-3.5" />
            </span>

            <p className="min-w-0 flex-1 truncate text-[13.5px] text-ink-300">
              <span className="font-semibold text-ink-100">{ten}</span> {chu}
            </p>

            {/* "3 giờ trước" đọc nhanh hơn ngày giờ đầy đủ, mà ngày giờ
                vẫn còn ở tooltip cho lúc cần chính xác. */}
            <time
              dateTime={log.createdAt.toISOString()}
              title={formatDateTime(log.createdAt)}
              className="shrink-0 text-[11.5px] whitespace-nowrap text-ink-500"
            >
              {timeAgo(log.createdAt)}
            </time>
          </div>
        );
      })}
    </Card>
  );
}
