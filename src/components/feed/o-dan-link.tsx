"use client";

import { Link2, Loader2, X } from "lucide-react";
import * as React from "react";

import { xemTruocLinkAction, type KetQuaXemTruoc } from "@/actions/posts";
import { Alert } from "@/components/ui";
import { cn } from "@/lib/utils";

type DaDoc = Extract<KetQuaXemTruoc, { ok: true }>;

/**
 * Ô dán đường dẫn cho bài dạng link, kèm thẻ xem trước.
 *
 * TỰ ĐỌC KHI DÁN, không bắt bấm thêm một nút "Xem trước". Dán xong còn
 * phải tìm nút bấm là thừa một bước ở đúng thao tác chính; mà đằng nào
 * cũng phải gọi server, nên gọi luôn lúc biết chắc người ta vừa đưa vào
 * một đường dẫn.
 *
 * THẺ XEM TRƯỚC Ở ĐÂY CHỈ ĐỂ NHÌN. Lúc bấm Đăng, server ĐỌC LẠI trang
 * đó từ đầu và chỉ tin mỗi `linkUrl` — xem ghi chú trong
 * `actions/posts.ts`. Nếu nhận thẳng tiêu đề và ảnh từ form thì ai cũng
 * gửi được một bài mang tiêu đề giả trỏ về một trang khác hẳn.
 *
 * Ảnh trong thẻ xem trước lấy THẲNG từ nguồn, bằng thẻ `img` thường:
 *
 *  · `next/image` không dùng được, vì `remotePatterns` cố ý chỉ mở cho
 *    đúng host Supabase. Nới nó ra `**` để xem trước một tấm ảnh là
 *    biến trình tối ưu ảnh thành proxy mở.
 *  · Trình duyệt của người đăng tự tải ảnh ấy, y như khi họ bấm vào
 *    link. Kèm `referrerPolicy="no-referrer"` để không rò chuyện họ
 *    đang đứng ở trang nào.
 *  · Ảnh THẬT của bài thì server tải về, kiểm chữ ký nhị phân và nén
 *    lại, rồi lưu vào kho của mình.
 */
export function ODanLink({
  url,
  datUrl,
  dangBan,
}: {
  /* Địa chỉ do ô soạn bài giữ, vì nó cần biết đã có link hay chưa để
     bật/tắt nút Đăng. Phần đọc được thì giữ ở trong này — ô soạn bài
     không dùng tới, và nó cũng không được phép gửi lên server. */
  url: string;
  datUrl: (v: string) => void;
  dangBan?: boolean;
}) {
  const [dangDoc, setDangDoc] = React.useState(false);
  const [doc, setDoc] = React.useState<DaDoc | null>(null);
  const [loi, setLoi] = React.useState<string | null>(null);

  // Mỗi lần đọc mang một số thứ tự; kết quả về muộn hơn lần mới nhất thì
  // bỏ qua. Không có nó thì dán nhanh hai link liên tiếp, kết quả của
  // link CŨ về sau và đè lên link mới.
  const lan = React.useRef(0);

  const docLink = React.useCallback(async (v: string) => {
    const s = v.trim();
    if (!s) return;
    const cua = ++lan.current;
    setDangDoc(true);
    setLoi(null);
    const kq = await xemTruocLinkAction(s);
    if (cua !== lan.current) return;
    setDangDoc(false);
    if (kq.ok) {
      setDoc(kq);
      datUrl(kq.url);
    } else {
      setDoc(null);
      setLoi(kq.loi);
    }
  }, [datUrl]);

  const xoa = () => {
    lan.current++;
    datUrl("");
    setDoc(null);
    setLoi(null);
    setDangDoc(false);
  };

  return (
    <div className="space-y-2.5">
      {/* Giá trị THẬT gửi lên server. Luôn là địa chỉ, không bao giờ là
          tiêu đề hay ảnh. */}
      <input type="hidden" name="linkUrl" value={url} />

      <div className="relative">
        <Link2
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500"
          aria-hidden
        />
        <input
          type="url"
          inputMode="url"
          value={url}
          disabled={dangBan}
          onChange={(e) => datUrl(e.target.value)}
          onPaste={(e) => {
            const v = e.clipboardData.getData("text");
            if (v) {
              e.preventDefault();
              datUrl(v);
              void docLink(v);
            }
          }}
          onBlur={() => {
            if (url.trim() && url !== doc?.url) void docLink(url);
          }}
          onKeyDown={(e) => {
            // Enter trong ô này là "đọc link", KHÔNG phải gửi cả bài —
            // gửi lúc chưa xem được trang thì đăng ra một thẻ trống.
            if (e.key === "Enter") {
              e.preventDefault();
              void docLink(url);
            }
          }}
          placeholder="Dán đường dẫn vào đây…"
          aria-label="Đường dẫn"
          className={cn(
            "w-full rounded-xl border border-ink-700 bg-ink-850 py-2.5 pr-10 pl-9 text-[14px] text-ink-200 outline-none transition-all",
            "placeholder:text-ink-500 hover:border-ink-600",
            "focus:border-gold-400 focus:bg-ink-900 focus:ring-4 focus:ring-gold-400/15",
          )}
        />
        {dangDoc && (
          <Loader2
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-ink-500"
            aria-hidden
          />
        )}
        {!dangDoc && url && (
          <button
            type="button"
            onClick={xoa}
            aria-label="Bỏ đường dẫn"
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {loi && <Alert tone="rose">{loi}</Alert>}

      {doc && (
        <div className="flex gap-3 overflow-hidden rounded-xl border border-ink-800 bg-ink-850">
          {doc.anhNguon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.anhNguon}
              alt=""
              referrerPolicy="no-referrer"
              className="size-24 shrink-0 object-cover"
            />
          )}
          <div className="min-w-0 flex-1 py-2.5 pr-3">
            <p className="text-[10.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">
              {doc.ten}
            </p>
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug font-bold text-ink-100">
              {doc.tieuDe}
            </p>
            {doc.moTa && (
              <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">
                {doc.moTa}
              </p>
            )}
          </div>
        </div>
      )}

      {!doc && !loi && !dangDoc && (
        <p className="text-[12.5px] text-ink-500">
          Dán link bài viết, video hay tin giải đấu — thẻ xem trước hiện ra
          ngay.
        </p>
      )}
    </div>
  );
}
