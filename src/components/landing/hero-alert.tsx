"use client";

import { Bell, MessagesSquare, Swords } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const CREAM = "#f2ede3";
const GOLD = "#dcae42";
const NAVY = "#00112e";

/** Lấy lại số liệu mỗi phút, và chỉ khi tab đang được nhìn. */
const POLL_MS = 60_000;

type Summary = {
  signedIn: boolean;
  notifications?: number;
  messages?: number;
  challenges?: number;
};

type Row = {
  href: string;
  label: string;
  n: number;
  Icon: typeof Bell;
};

/**
 * Ô "có gì mới" ở góc phải trên của trang chủ.
 *
 * LẤY SỐ SAU KHI TRANG ĐÃ HIỆN, không dựng sẵn từ máy chủ. Số dựng sẵn sẽ
 * đứng yên suốt thời gian người ta còn mở trang — mà trang chủ đúng là chỗ
 * hay bị để mở cả buổi — nên có tin nhắn mới cũng không thấy gì. Cách này
 * còn giữ cho hero hiện ra ngay, không phải đợi ba truy vấn cho một cái ô
 * ở góc.
 *
 * KHÔNG HIỆN GÌ KHI KHÔNG CÓ GÌ. Chưa đăng nhập, hoặc đã đăng nhập mà
 * sạch sẽ cả ba mục, thì góc phải để trống. Một cái chuông lúc nào cũng
 * nằm đó và lúc nào cũng bằng không thì chỉ làm rối một khung hình vốn
 * đang cố giữ cho thoáng.
 *
 * Số đếm do máy chủ tính từ phiên đăng nhập, ở đây chỉ vẽ lại. Trình
 * duyệt không gửi lên danh tính nào cả.
 */
export function HeroAlert() {
  const [data, setData] = React.useState<Summary | null>(null);
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controllers = new Set<AbortController>();

    const load = async () => {
      // Tab bị ẩn thì đừng hỏi — người ta không nhìn, mà nhịp hẹn giờ ở
      // tab ẩn cũng bị trình duyệt bóp lại thành không đều.
      if (document.hidden) return;

      const ac = new AbortController();
      controllers.add(ac);
      try {
        const res = await fetch("/api/toi/tom-tat", {
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as Summary;
        if (alive) setData(json);
      } catch {
        // Mạng chập chờn thì cứ giữ số cũ. Đây là thứ phụ trợ, hỏng cũng
        // không được làm ồn.
      } finally {
        controllers.delete(ac);
      }
    };

    const tick = () => {
      void load();
      timer = setTimeout(tick, POLL_MS);
    };
    tick();

    // Quay lại tab thì hỏi ngay, đừng bắt đợi hết một phút.
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      controllers.forEach((c) => c.abort());
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Bấm ra ngoài hoặc bấm Esc thì đóng.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!data?.signedIn) return null;

  const rows: Row[] = [
    {
      href: "/tin-nhan",
      label: "cuộc trò chuyện chưa đọc",
      n: data.messages ?? 0,
      Icon: MessagesSquare,
    },
    {
      href: "/keo",
      label: "kèo đang tìm người",
      n: data.challenges ?? 0,
      Icon: Swords,
    },
    {
      href: "/thong-bao",
      label: "thông báo mới",
      n: data.notifications ?? 0,
      Icon: Bell,
    },
  ].filter((r) => r.n > 0);

  if (rows.length === 0) return null;

  const total = rows.reduce((s, r) => s + r.n, 0);

  return (
    <div ref={boxRef} className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Có ${total} việc mới`}
        className="flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors"
        style={{
          borderColor: `${CREAM}2e`,
          background: `${CREAM}0f`,
          color: CREAM,
        }}
      >
        <span className="relative grid place-items-center">
          <Bell className="size-[17px]" strokeWidth={2} />
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 size-2 rounded-full"
            style={{ background: GOLD, boxShadow: `0 0 0 2px ${NAVY}` }}
          />
        </span>
        <span
          className="grid min-w-5 place-items-center rounded-full px-1.5 py-px text-[11px] font-bold"
          style={{ background: GOLD, color: NAVY }}
        >
          {total > 99 ? "99+" : total}
        </span>
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 w-64 overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            borderColor: `${CREAM}24`,
            background: "#041a3d",
            color: CREAM,
          }}
        >
          {rows.map(({ href, label, n, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3.5 py-3 text-[13px] transition-colors hover:bg-white/8"
            >
              <Icon
                className="size-4 shrink-0"
                strokeWidth={2}
                style={{ color: GOLD }}
              />
              <span className="flex-1">
                <span className="font-bold">{n}</span> {label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
