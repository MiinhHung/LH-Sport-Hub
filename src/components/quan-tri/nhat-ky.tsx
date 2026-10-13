import {
  Ban,
  CalendarDays,
  CheckCheck,
  FileText,
  Flag,
  Pencil,
  ShieldCheck,
  Swords,
  Trash2,
  UserCog,
  type IconType,
} from "@/components/icons";

import { Avatar } from "@/components/ui";
import { cn, formatDate, formatDateTime, formatTime } from "@/lib/utils";

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

type Mau = "gold" | "navy" | "rose" | "emerald" | "slate";

/*
 * Sắc ô theo nhóm việc: xám navy cho việc thường (bài, buổi tập, quản trị),
 * vàng cho kèo, đỏ nhạt cho xoá / khoá / báo sai, xanh lục cho việc đã
 * được xác nhận. Đỏ và xanh lục chỉ dành cho trạng thái thật.
 */
const MAU: Record<Mau, string> = {
  gold: "bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300",
  navy: "bg-ink-850 text-ink-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  emerald:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  slate: "bg-ink-850 text-ink-400",
};

/**
 * Câu mô tả viết ở ngôi thứ ba, nối ngay sau tên người làm:
 * "Minh Hùng · tạo một kèo mới".
 */
const VIEC: Record<string, { chu: string; icon: IconType; mau: Mau }> = {
  "admin.set_role": {
    chu: "đổi vai trò của một thành viên",
    icon: UserCog,
    mau: "navy",
  },
  "admin.suspend": { chu: "khoá một tài khoản", icon: Ban, mau: "rose" },
  "admin.reactivate": {
    chu: "mở khoá một tài khoản",
    icon: ShieldCheck,
    mau: "emerald",
  },

  "challenge.create": { chu: "tạo một kèo mới", icon: Swords, mau: "gold" },
  "challenge.update": { chu: "sửa một kèo", icon: Pencil, mau: "gold" },
  "challenge.join": { chu: "nhận một kèo", icon: Swords, mau: "gold" },
  "challenge.accept": {
    chu: "đồng ý một lời thách",
    icon: Swords,
    mau: "gold",
  },
  "challenge.decline": {
    chu: "từ chối một lời thách",
    icon: Swords,
    mau: "slate",
  },
  "challenge.leave": { chu: "rút khỏi một kèo", icon: Swords, mau: "slate" },
  "challenge.cancel": { chu: "huỷ một kèo", icon: Swords, mau: "slate" },
  "challenge.delete": { chu: "xoá một kèo", icon: Trash2, mau: "rose" },
  "challenge.move_team": {
    chu: "chuyển người sang đội khác",
    icon: Swords,
    mau: "gold",
  },

  "result.submit": {
    chu: "nhập kết quả một kèo",
    icon: CheckCheck,
    mau: "emerald",
  },
  "result.resubmit": {
    chu: "nhập lại kết quả một kèo",
    icon: CheckCheck,
    mau: "emerald",
  },
  "result.confirm": {
    chu: "xác nhận kết quả",
    icon: CheckCheck,
    mau: "emerald",
  },
  "result.auto_confirm": {
    chu: "kết quả tự chốt sau thời hạn",
    icon: CheckCheck,
    mau: "slate",
  },
  "result.dispute": { chu: "báo sai kết quả", icon: Flag, mau: "rose" },

  "post.create": { chu: "đăng một bài", icon: FileText, mau: "navy" },
  "post.delete": { chu: "xoá một bài", icon: Trash2, mau: "rose" },
  "post.pin": { chu: "ghim một bài", icon: FileText, mau: "navy" },
  "post.unpin": { chu: "bỏ ghim một bài", icon: FileText, mau: "slate" },
  "comment.delete": { chu: "xoá một bình luận", icon: Trash2, mau: "rose" },

  "session.create": { chu: "tạo một buổi tập", icon: CalendarDays, mau: "navy" },
  "session.update": { chu: "sửa một buổi tập", icon: Pencil, mau: "navy" },
  "session.attendance": {
    chu: "điểm danh buổi tập",
    icon: CalendarDays,
    mau: "navy",
  },
  "session.cancel": {
    chu: "huỷ một buổi tập",
    icon: CalendarDays,
    mau: "slate",
  },
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

type Ban = { id: string; fullName: string; avatarUrl: string | null };

type Dong = {
  khoa: string;
  chu: string;
  icon: IconType;
  mau: Mau;
  ten: string;
  nguoi: Ban | null;
  action: string;
  luc: Date;
  /** Số lần việc này lặp lại LIỀN NHAU. */
  lan: number;
};

const MOT_NGAY = 24 * 60 * 60 * 1000;

function nhanNgay(d: Date): string {
  const bayGio = new Date();
  const homNay = new Date(
    bayGio.getFullYear(),
    bayGio.getMonth(),
    bayGio.getDate(),
  ).getTime();
  const t = d.getTime();
  if (t >= homNay) return "Hôm nay";
  if (t >= homNay - MOT_NGAY) return "Hôm qua";
  return formatDate(d);
}

/**
 * Gom nhật ký theo ngày, và dồn những dòng GIỐNG HỆT NẰM LIỀN NHAU.
 *
 * NHẬT KÝ KHÔNG ĐƯỢC GỘP KIỂU THÔNG BÁO. Trang Thông báo gộp mọi dòng
 * cùng loại về cùng một chỗ thành một, vì ở đó câu hỏi là "có gì đáng
 * để ý". Ở đây câu hỏi là "chuyện gì đã thật sự xảy ra" — gộp hết thì
 * một người bấm đi lại năm lần trông y như bấm một lần, mà đó đúng là
 * thứ người quản trị cần thấy.
 *
 * Nên chỉ dồn những dòng LIỀN NHAU, và ghi rõ số lần. Thứ tự vẫn
 * nguyên vẹn: ai làm gì, bao nhiêu lần, rồi làm gì tiếp.
 *
 * Đo trên trang thật trước khi sửa: năm dòng "Hanna điểm danh buổi tập"
 * xếp liền nhau, chiếm gần một phần ba màn hình mà chỉ nói đúng một
 * việc.
 */
function gom(
  logs: {
    id: string;
    action: string;
    actorId: string | null;
    createdAt: Date;
  }[],
  nguoiTheoId: Map<string, Ban>,
) {
  const dong: Dong[] = [];

  for (const log of logs) {
    const { chu, icon, mau } = doc(log.action);
    const nguoi = log.actorId ? (nguoiTheoId.get(log.actorId) ?? null) : null;
    const ten = log.actorId
      ? (nguoi?.fullName ?? "Người dùng đã xoá")
      : "Hệ thống";
    const khoa = `${log.actorId ?? "he-thong"}|${log.action}`;

    const cuoi = dong[dong.length - 1];
    // Chỉ dồn khi cùng người, cùng việc, VÀ cùng ngày — không để một
    // cụm vắt qua hai mốc ngày rồi hiện sai chỗ.
    if (
      cuoi &&
      cuoi.khoa === khoa &&
      nhanNgay(cuoi.luc) === nhanNgay(log.createdAt)
    ) {
      cuoi.lan += 1;
      continue;
    }

    dong.push({
      khoa,
      chu,
      icon,
      mau,
      ten,
      nguoi,
      action: log.action,
      luc: log.createdAt,
      lan: 1,
    });
  }

  const ngay = new Map<string, Dong[]>();
  for (const d of dong) {
    const nhan = nhanNgay(d.luc);
    const co = ngay.get(nhan);
    if (co) co.push(d);
    else ngay.set(nhan, [d]);
  }
  return [...ngay.entries()];
}

export function NhatKy({
  logs,
  nguoiTheoId,
}: {
  logs: {
    id: string;
    action: string;
    actorId: string | null;
    createdAt: Date;
  }[];
  nguoiTheoId: Map<string, Ban>;
}) {
  const theoNgay = gom(logs, nguoiTheoId);

  return (
    <div className="space-y-4 px-4 pt-2 pb-4">
      {theoNgay.map(([nhan, dong], so) => (
        // id theo chỉ số: nhãn có dấu cách ("Hôm nay") mà
        // `aria-labelledby` tách id theo dấu cách.
        <section key={nhan} aria-labelledby={`ngay-${so}`}>
          <h3
            id={`ngay-${so}`}
            className="mb-2.5 text-[12.5px] font-semibold text-gold-700 dark:text-gold-300"
          >
            {nhan}
          </h3>

          {/* Dòng thời gian: vạch dọc chạy qua tâm các ô biểu tượng. */}
          <ol className="relative">
            <span
              aria-hidden
              className="absolute top-2 bottom-2 left-[15px] w-px bg-ink-800"
            />
            {dong.map((d, i) => (
              <li
                key={`${d.khoa}-${i}`}
                className="relative flex gap-3 pb-3.5 last:pb-0"
                title={d.action}
              >
                {/* Ô biểu tượng theo nhóm việc; góc dưới là ảnh người
                    làm. Người quản trị quét trang này theo NGƯỜI trước,
                    theo việc sau, nên ảnh vẫn phải có mặt. */}
                <span className="relative shrink-0">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-8 place-items-center rounded-lg ring-4 ring-ink-900",
                      MAU[d.mau],
                    )}
                  >
                    <d.icon className="size-4" />
                  </span>
                  {d.nguoi && (
                    <Avatar
                      name={d.nguoi.fullName}
                      src={d.nguoi.avatarUrl}
                      seed={d.nguoi.id}
                      size="xs"
                      className="absolute -right-1.5 -bottom-1.5 size-[18px] text-[7px] ring-2 ring-ink-900"
                    />
                  )}
                </span>

                <div className="min-w-0 flex-1 pt-px">
                  <p className="text-[13.5px] leading-snug text-ink-300">
                    <span className="font-semibold text-ink-100">{d.ten}</span>{" "}
                    {d.chu}
                    {d.lan > 1 && (
                      <span className="tabular ml-1.5 rounded-lg bg-ink-850 px-1.5 py-0.5 text-[11px] font-semibold text-ink-400">
                        ×{d.lan}
                      </span>
                    )}
                  </p>

                  {/* Giờ phút, không phải "2 ngày trước": ngày đã nằm ở
                      tiêu đề nhóm rồi, nhắc lại ở từng dòng là thừa — mà
                      giờ phút mới là thứ dựng lại được trình tự. */}
                  <time
                    dateTime={d.luc.toISOString()}
                    title={formatDateTime(d.luc)}
                    className="tabular mt-0.5 block text-[12px] text-ink-500"
                  >
                    {formatTime(d.luc)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
