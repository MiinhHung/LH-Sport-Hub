"use client";

import { MessagesSquare, Search } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { StartChatTile } from "@/components/chat/start-chat";
import { ChamHoatDong } from "@/components/ui/cham-hoat-dong";
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
    /** Chuỗi ISO, không phải Date — xem ghi chú ở layout. */
    lastActiveAt: string;
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
        "w-full min-w-0 flex-col border-ink-800 md:flex md:w-[300px] md:shrink-0 md:border-r lg:w-[320px]",
        dangMoMotCuoc ? "hidden" : "flex",
      )}
    >
      <div className="px-4 pt-5 pb-3 md:pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-[24px] leading-tight font-bold text-ink-100 md:text-[20px]">
            Tin nhắn
          </h1>
          {hoiThoai.length > 0 && (
            <span className="text-[12.5px] font-medium text-ink-500">
              <span className="tabular">{hoiThoai.length}</span> cuộc
            </span>
          )}
        </div>

        {/*
          Ô tìm chỉ hiện khi đã có kha khá cuộc. Một đội 19 người thì
          lúc đầu chỉ có vài cuộc, mà bày ô tìm ra trước một danh sách
          hai dòng thì nó chỉ chiếm chỗ và nhắc người ta rằng ở đây
          chẳng có gì.
        */}
        {hoiThoai.length >= 6 && (
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <input
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm tên..."
              aria-label="Tìm theo tên"
              className="h-10 w-full rounded-lg border border-transparent bg-ink-850 pr-3 pl-9 text-[14px] text-ink-200 outline-none transition-[border-color,box-shadow] placeholder:text-ink-500 hover:border-ink-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/25"
            />
          </div>
        )}
      </div>

      {/* Nhắn nhanh cho người chưa từng nhắn */}
      {nguoiMoi.length > 0 && !tim && (
        <div className="border-b border-ink-800 pb-2.5">
          <p className="px-4 pb-1 text-[12.5px] font-semibold text-ink-500">
            Nhắn nhanh
          </p>
          <div className="no-scrollbar flex gap-0.5 overflow-x-auto px-2.5">
            {nguoiMoi.map((p) => (
              <StartChatTile key={p.id} person={p} />
            ))}
          </div>
        </div>
      )}

      {/* Danh sách cuộc trò chuyện */}
      {loc.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span
            aria-hidden
            className="grid size-11 place-items-center rounded-lg bg-ink-850 text-ink-500"
          >
            {tim ? (
              <Search className="size-5" />
            ) : (
              <MessagesSquare className="size-5" />
            )}
          </span>
          <p className="mt-3 text-[14px] font-semibold text-ink-200">
            {tim ? "Không tìm thấy ai" : "Chưa có cuộc nào"}
          </p>
          {!tim && (
            <p className="mt-1 max-w-[30ch] text-[13px] text-ink-500">
              {nguoiMoi.length > 0
                ? "Chọn một người ở trên để nhắn câu đầu tiên."
                : "Mở hồ sơ một thành viên rồi bấm Nhắn tin."}
            </p>
          )}
        </div>
      ) : (
        /*
          ĐƯỜNG KẺ NGĂN, CHỈ TRÊN ĐIỆN THOẠI.

          Ở máy tính cột này là thanh bên, đã có viền phải và nền riêng
          nên tự nó ra dáng một danh sách. Trên điện thoại nó chiếm cả
          trang: mấy hàng trôi trên nền trắng, không thẻ, không vạch
          ngăn — nhìn không ra là bấm được, cũng không ra là một danh
          sách mà chỉ như mấy dòng chữ rơi vãi.

          Kẻ từ hàng thứ hai trở đi (`[&>li+li]`) để hàng đầu không có
          một vạch lửng lơ ngay dưới tiêu đề.
        */
        <ul className="min-h-0 flex-1 overflow-y-auto [&>li+li]:border-t [&>li+li]:border-ink-800">
          {loc.map((c) => {
            const dangXem = duongDan === `/tin-nhan/${c.id}`;
            return (
              <li key={c.id}>
                <Link
                  href={`/tin-nhan/${c.id}`}
                  aria-current={dangXem ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 px-4 py-3 transition-colors",
                    dangXem
                      ? "bg-navy-50 shadow-[inset_3px_0_0_var(--color-gold-500)] dark:bg-navy-600/20"
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
                    <ChamHoatDong
                      lastActiveAt={c.partner.lastActiveAt}
                      co="sm"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-[14px]",
                          c.unread
                            ? "font-semibold text-ink-100"
                            : "font-medium text-ink-200",
                        )}
                      >
                        {c.partner.fullName}
                      </p>
                      <time
                        className={cn(
                          "shrink-0 text-[12px]",
                          c.unread
                            ? "font-semibold text-gold-700 dark:text-gold-300"
                            : "text-ink-500",
                        )}
                        dateTime={c.lastMessageAt}
                      >
                        {timeAgo(c.lastMessageAt)}
                      </time>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p
                        className={cn(
                          "min-w-0 flex-1 truncate text-[13px]",
                          c.unread
                            ? "font-medium text-ink-300"
                            : "text-ink-500",
                        )}
                      >
                        {c.lastMessagePreview
                          ? `${c.lastSenderId === viewerId ? "Bạn: " : ""}${c.lastMessagePreview}`
                          : "Chưa có tin nhắn nào"}
                      </p>
                      {c.unread && (
                        <span
                          role="img"
                          aria-label="Có tin chưa đọc"
                          className="size-2.5 shrink-0 rounded-full bg-gold-500"
                        />
                      )}
                    </div>
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
