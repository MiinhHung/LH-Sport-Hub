"use client";

import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

export type AnhXemDuoc = {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Khung xem ảnh phóng to, mở ngay trên trang.
 *
 * TRƯỚC ĐÂY ẤN VÀO ẢNH LÀ BẬT TAB MỚI. Thẻ `<a target="_blank">` trỏ
 * thẳng vào tệp, nên người xem bị ném ra khỏi app sang một trang trắng
 * chỉ có đúng tấm ảnh, muốn quay lại phải bấm nút lùi của trình duyệt —
 * và về tới nơi thì bảng tin đã cuộn lại từ đầu. Bài có bốn ảnh thì xem
 * hết là bốn lần đi về như vậy.
 *
 * Facebook, LinkedIn, Instagram đều mở lớp phủ ngay tại chỗ. Không phải
 * vì nó đẹp hơn, mà vì nó GIỮ NGUYÊN NGỮ CẢNH: đóng lại là thấy đúng
 * bài vừa đọc, đúng chỗ vừa cuộn tới.
 *
 * DÙNG THẺ `<dialog>` THẬT, theo đúng lệ của `hoi-lai.tsx`. Trình duyệt
 * cho sẵn ba thứ mà lớp phủ tự dựng bằng `div` phải làm lại bằng tay và
 * hay làm sai: giữ tiêu điểm bên trong, đóng bằng Esc, và nằm ở lớp
 * trên cùng nên không bị thanh điều hướng hay menu tài khoản đè lên.
 *
 * DÙNG CHUNG CHO BẢNG TIN VÀ TIN NHẮN, nên nó nằm ở gốc `components/`
 * chứ không nằm trong `feed/`. Nó không biết gì về bài viết hay tin
 * nhắn — chỉ nhận một mảng ảnh và một chỉ số. Bên gọi tự quyết mảng đó
 * gồm những gì: bảng tin đưa ảnh của một bài, tin nhắn đưa mọi ảnh
 * trong cuộc trò chuyện.
 */
export function XemAnh({
  danhSach,
  moTai,
  dong,
}: {
  danhSach: AnhXemDuoc[];
  /** Chỉ số ảnh mở ra đầu tiên; `null` là đang đóng. */
  moTai: number | null;
  dong: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);

  // Mở/đóng thẻ dialog theo `moTai`. `showModal()` là thứ đưa nó lên
  // lớp trên cùng và bật khoá tiêu điểm — gán `open` bằng tay thì không
  // được cả hai.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (moTai === null) {
      if (el.open) el.close();
    } else if (!el.open) {
      el.showModal();
    }
  }, [moTai]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        // Chặn hành vi mặc định rồi tự đóng, để trạng thái bên ngoài
        // (`moTai`) cũng được dọn — không thì lần sau bấm đúng tấm ảnh
        // cũ sẽ không mở lại được.
        e.preventDefault();
        dong();
      }}
      onClose={dong}
      aria-label="Xem ảnh"
      className={cn(
        "m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0",
        "backdrop:bg-navy-950/90 backdrop:backdrop-blur-[2px]",
      )}
    >
      {/*
        CHỈ DỰNG RUỘT KHI ĐANG MỞ — `moTai !== null`.

        Mỗi thẻ bài có một khung xem riêng, nên bảng tin bốn bài là bốn
        thẻ `dialog` nằm sẵn trong DOM. Bản đầu dựng luôn phần ruột cho
        cả bốn, kể cả khi đóng. Thẻ `dialog` đóng thì không hiện, nhưng
        ảnh bên trong VẪN TẢI — và `next/image` còn phát thêm thẻ
        `<link rel="preload" as="image">`.

        Đo trên bản dựng: 4 ảnh cỡ `sizes="100vw"` dựng sẵn, 8 thẻ
        preload, riêng `/_next/image` tốn 757KB khi mở bảng tin. Tức là
        tải sẵn bản phóng to của mọi ảnh để phòng trường hợp người ta
        bấm vào — trong khi phần lớn lướt qua không bấm gì.

        `key={moTai}` KHÔNG PHẢI ĐỂ CHO ĐẸP. Nhờ nó, mở tấm nào là dựng
        lại ruột với `useState(batDau)` đúng tấm ấy. Cách còn lại là giữ
        một ô trạng thái rồi gán nó trong `useEffect` mỗi lần `moTai`
        đổi — thêm một vòng render thừa, và `react-hooks` bắt đúng chỗ
        đó (`set-state-in-effect`).
      */}
      {moTai !== null && danhSach.length > 0 && (
        <Ruot
          key={moTai}
          danhSach={danhSach}
          batDau={Math.min(Math.max(moTai, 0), danhSach.length - 1)}
          dong={dong}
        />
      )}
    </dialog>
  );
}

function Ruot({
  danhSach,
  batDau,
  dong,
}: {
  danhSach: AnhXemDuoc[];
  batDau: number;
  dong: () => void;
}) {
  const [i, setI] = React.useState(batDau);

  const soAnh = danhSach.length;
  const anh = danhSach[i];

  const lui = React.useCallback(
    () => setI((c) => (c - 1 + soAnh) % soAnh),
    [soAnh],
  );
  const toi = React.useCallback(() => setI((c) => (c + 1) % soAnh), [soAnh]);

  /*
    Mũi tên trái/phải.

    Nghe trên `window` chứ không gắn `onKeyDown` lên thẻ dialog: sau khi
    bấm vào tấm ảnh, tiêu điểm có thể rơi ra ngoài cây con của khung, lúc
    đó phím bấm không bao giờ đi qua thẻ ấy nữa. Thành phần này chỉ tồn
    tại khi khung đang mở, nên bộ lắng nghe tự mất theo lúc đóng.
  */
  React.useEffect(() => {
    if (soAnh < 2) return;
    const xuLy = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        lui();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        toi();
      }
    };
    window.addEventListener("keydown", xuLy);
    return () => window.removeEventListener("keydown", xuLy);
  }, [soAnh, lui, toi]);

  /*
    VUỐT ĐỂ LẬT ẢNH TRÊN ĐIỆN THOẠI.

    Hai nút mũi tên vẫn có và vẫn đủ 44px, nhưng trên điện thoại thì vuốt
    mới là cử chỉ người ta làm theo phản xạ ở một khung xem ảnh.

    Ngưỡng 50px và điều kiện "ngang hơn dọc" để phân biệt với cú cuộn:
    thiếu nó thì mỗi lần kéo trang là ảnh lại nhảy một tấm.
  */
  const cham = React.useRef<{ x: number; y: number } | null>(null);
  const batDauCham = (e: React.TouchEvent) => {
    const t = e.touches[0];
    cham.current = { x: t.clientX, y: t.clientY };
  };
  const ketThucCham = (e: React.TouchEvent) => {
    const d = cham.current;
    cham.current = null;
    if (!d || soAnh < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - d.x;
    const dy = t.clientY - d.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) lui();
    else toi();
  };

  if (!anh) return null;

  return (
    <div
      className="relative flex h-full w-full flex-col"
      onTouchStart={batDauCham}
      onTouchEnd={ketThucCham}
      /* Khoảng trống của chính cột này (hai bên thanh trên, dải dưới
         khi không có chú thích) cũng tính là "ngoài ảnh". */
      onClick={(e) => {
        if (e.target === e.currentTarget) dong();
      }}
    >
      {/* Thanh trên: số thứ tự, tải về, đóng. */}
      <div className="flex shrink-0 items-center justify-between gap-2 p-3">
        <span className="rounded-full bg-navy-950/60 px-3 py-1.5 text-[13px] font-semibold tabular-nums text-white/90">
          {soAnh > 1 ? `${i + 1} / ${soAnh}` : "Ảnh"}
        </span>

        <div className="flex items-center gap-2">
          {/* Giữ lại lối mở tệp gốc — đó là thứ DUY NHẤT mất đi khi bỏ
              `target="_blank"`, và vẫn có người cần tải ảnh về. */}
          <a
            href={anh.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Mở ảnh gốc trong tab mới"
            className="grid size-11 place-items-center rounded-full bg-navy-950/60 text-white/90 transition-colors hover:bg-navy-950/80 hover:text-white"
          >
            <Download className="size-5" />
          </a>
          <button
            type="button"
            onClick={dong}
            aria-label="Đóng"
            className="grid size-11 place-items-center rounded-full bg-navy-950/60 text-white/90 transition-colors hover:bg-navy-950/80 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/*
        Vùng ảnh. `min-h-0` để nó co được trong flex, nếu không thì ảnh
        cao tràn ra ngoài màn hình.

        BẤM RA NGOÀI TẤM ẢNH THÌ ĐÓNG, và đó là lý do ở đây KHÔNG dùng
        `fill`.

        Với `fill`, thẻ `img` luôn căng bằng cả khung, còn `object-contain`
        chỉ vẽ ảnh vào giữa và chừa hai dải trống. Hai dải đó nhìn như nền
        nhưng vẫn THUỘC thẻ img — bấm vào chẳng đóng gì, mà người dùng thì
        tưởng mình đã bấm ra ngoài.

        Cho kích thước thật vào rồi kẹp bằng `max-h/max-w`: thẻ img ôm
        đúng tấm ảnh, nên khoảng xung quanh mới thật sự là khung cha và
        `e.target === e.currentTarget` mới đúng.

        Ảnh cũ không có width/height thì mượn tạm 4:3; `max-*` lo phần
        còn lại nên đoán sai cũng không méo ảnh.
      */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) dong();
        }}
        className="flex min-h-0 flex-1 items-center justify-center"
      >
        <Image
          key={anh.id}
          src={anh.url}
          alt={anh.alt ?? "Ảnh phóng to"}
          width={anh.width ?? 1600}
          height={anh.height ?? 1200}
          sizes="100vw"
          className="h-auto max-h-full w-auto max-w-full object-contain"
        />
      </div>

      {soAnh > 1 && (
        <>
          <button
            type="button"
            onClick={lui}
            aria-label="Ảnh trước"
            className="absolute top-1/2 left-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-navy-950/60 text-white/90 transition-colors hover:bg-navy-950/85 hover:text-white sm:left-4"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={toi}
            aria-label="Ảnh sau"
            className="absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-navy-950/60 text-white/90 transition-colors hover:bg-navy-950/85 hover:text-white sm:right-4"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      {anh.alt && (
        <p className="shrink-0 px-4 pt-2 pb-4 text-center text-[13px] leading-relaxed text-white/75">
          {anh.alt}
        </p>
      )}
    </div>
  );
}
