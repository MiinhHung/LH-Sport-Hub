"use client";

import { MessagesSquare, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { StartChatTile } from "@/components/chat/start-chat";
import { Avatar } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

/**
 * Cột danh sách hội thoại, nằm bên trái khung tin nhắn.
 *
 * TRANG NÀY TRƯỚC ĐÂY LÀ MỘT CỘT HẸP GIỮA TRANG RỘNG. Chụp lại ở màn
 * 1536px: tiêu đề serif cỡ 52px, hai dòng giải thích, ĐÚNG MỘT dòng hội
 * thoại, rồi khoảng 400px trống trơn tới hết màn hình. Bấm vào một cuộc
 * thì cả trang thay sạch, mất luôn danh sách — không còn biết mình đang
 * ở đâu trong số những người đã nhắn.
 *
 * Giờ là hai cột, như mọi app nhắn tin: danh sách ở lại bên trái, khung
 * trò chuyện đổi bên phải. Chỗ trống biến mất không phải vì nhét thêm
 * đồ trang trí, mà vì cái lẽ ra phải ở đó giờ đã ở đó.
 *
 * ẨN HIỆN TRÊN ĐIỆN THOẠI DỰA VÀO ĐƯỜNG DẪN, không phải vào media query
 * đơn thuần. Dưới 768px chỉ đủ chỗ cho một cột: đang ở `/tin-nhan` thì
 * hiện danh sách, mở một cuộc thì hiện khung trò chuyện. Nếu chỉ dùng
 * CSS thì hoặc danh sách luôn chiếm chỗ, hoặc khung trò chuyện không bao
 * giờ hiện ra.
 */

type HoiThoai = {
  id: string;
  partner: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    department: string | null;
  };
  lastMessagePreview: string | null;
  lastMessageAt: string;
  lastSenderId: string | null;
  unread: boolean;
};

type Nguoi = { id: string; fullName: string; avatarUrl: string | null };

export function CotHoiThoai({
  hoiThoai,
  nguoiMoi,
  viewerId,
}: {
  hoiThoai: HoiThoai[];
  nguoiMoi: Nguoi[];
  viewerId: string;
}) {
  const duongDan = usePathname();
  const dangMoMotCuoc = duongDan !== "/tin-nhan";
  const [tim, setTim] = React.useState("");

  const loc = React.useMemo(() => {
    const t = tim.trim().toLowerCase();
    if (!t) return hoiThoai;
    return hoiThoai.filter((c) => c.partner.fullName.toLowerCase().includes(t));
  }, [hoiThoai, tim]);

  return (
    <aside
      aria-label="Danh sách trò chuyện"
      /*
        `w-full` TRÊN ĐIỆN THOẠI.

        Trước đây cột này chỉ có bề ngang từ `md` trở lên. Dưới mức đó
        nó là một phần tử flex không khai báo bề ngang, nên nó co lại
        bằng đúng nội dung — đo ở màn 390 thì cả danh sách hội thoại chỉ
        rộng 188px, nằm nép bên trái, còn nửa phải là khoảng trắng của
        khung trò chuyện rỗng. Vùng chạm vào một cuộc cũng chỉ bằng nửa
        bề ngang màn hình.
      */
      className={cn(
        "w-full flex-col border-ink-800 md:flex md:w-[300px] md:shrink-0 md:border-r lg:w-[340px]",
        dangMoMotCuoc ? "hidden" : "flex",
      )}
    >
      {/* pt-4 chu khong pt-1: do ra chi cach thanh tren 4px, dau tren
          chu "nhắn" nhìn như dính vào mép thanh. */}
      <div className="px-4 pt-4 pb-3 md:pr-4 md:pl-0">
        <h1 className="font-display text-[26px] leading-tight font-bold text-ink-100">
          Tin nhắn
        </h1>

        {/*
          Ô tìm chỉ hiện khi đã có kha khá cuộc. Một đội 19 người thì
          lúc đầu chỉ có vài cuộc, mà bày ô tìm ra trước một danh sách
          hai dòng thì nó chỉ chiếm chỗ và nhắc người ta rằng ở đây
          chẳng có gì.
        */}
        {hoiThoai.length >= 6 && (
          <div className="relative mt-3">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <input
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm tên..."
              aria-label="Tìm theo tên"
              className="h-10 w-full rounded-xl border border-ink-800 bg-ink-850 pr-3 pl-9 text-[14px] text-ink-200 outline-none placeholder:text-ink-500 focus:border-ink-700"
            />
          </div>
        )}
      </div>

      {/* Nhắn nhanh cho người chưa từng nhắn */}
      {nguoiMoi.length > 0 && !tim && (
        <div className="border-b border-ink-800 pb-3 md:pr-4">
          <p className="px-4 pb-1.5 text-[10.5px] font-bold tracking-[0.14em] text-ink-500 uppercase md:px-0">
            Nhắn nhanh
          </p>
          <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 md:px-0">
            {nguoiMoi.map((p) => (
              <StartChatTile key={p.id} person={p} />
            ))}
          </div>
        </div>
      )}

      {/* Danh sách cuộc trò chuyện */}
      {loc.length === 0 ? (
        <div className="px-4 py-14 text-center md:px-0">
          <MessagesSquare className="mx-auto size-6 text-ink-600" aria-hidden />
          <p className="mt-3 text-[14px] font-semibold text-ink-300">
            {tim ? "Không tìm thấy ai" : "Chưa có cuộc nào"}
          </p>
          {!tim && (
            <p className="mt-1 text-[13px] text-ink-500">
              Chọn một người ở trên để nhắn câu đầu tiên.
            </p>
          )}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto md:pr-2">
          {loc.map((c) => {
            const dangXem = duongDan === `/tin-nhan/${c.id}`;
            return (
              <li key={c.id}>
                <Link
                  href={`/tin-nhan/${c.id}`}
                  aria-current={dangXem ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors",
                    dangXem
                      ? "bg-navy-50 dark:bg-navy-600/20"
                      : "hover:bg-ink-850",
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      name={c.partner.fullName}
                      src={c.partner.avatarUrl}
                      seed={c.partner.id}
                      size="md"
                    />
                    {c.unread && (
                      <span
                        aria-label="Có tin chưa đọc"
                        className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-gold-500 ring-2 ring-ink-900"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-[14.5px]",
                          c.unread
                            ? "font-bold text-ink-100"
                            : "font-semibold text-ink-200",
                        )}
                      >
                        {c.partner.fullName}
                      </p>
                      <time
                        className="shrink-0 text-[11px] text-ink-500"
                        dateTime={c.lastMessageAt}
                      >
                        {timeAgo(c.lastMessageAt)}
                      </time>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[13px]",
                        c.unread ? "font-medium text-ink-300" : "text-ink-500",
                      )}
                    >
                      {c.lastMessagePreview
                        ? `${c.lastSenderId === viewerId ? "Bạn: " : ""}${c.lastMessagePreview}`
                        : "Chưa có tin nhắn nào"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
