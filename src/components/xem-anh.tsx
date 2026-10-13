"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  X,
} from "@/components/icons";
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
        "backdrop:bg-navy-950/90",
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

  const khungRef = React.useRef<HTMLDivElement>(null);
  const anhRef = React.useRef<HTMLImageElement>(null);

  /*
    THU PHÓNG.

    Ba con số gộp trong MỘT ô trạng thái chứ không tách làm ba, vì chúng
    luôn phải đổi cùng nhau: phóng to quanh một điểm thì tỉ lệ đổi kéo
    theo độ lệch đổi. Tách ra thì mỗi lần cuộn chuột là hai lần đặt
    trạng thái, và lần sau đọc phải giá trị cũ của lần trước.
  */
  const [zoom, setZoom] = React.useState({ s: 1, x: 0, y: 0 });
  const dangPhong = zoom.s > 1;

  const TOI_DA = 4;

  /**
   * Giữ ảnh không trôi ra khỏi khung.
   *
   * Dùng `offsetWidth` chứ không phải `getBoundingClientRect`: sau khi
   * đã gắn `transform` thì rect trả về kích thước ĐÃ phóng, lấy nó đi
   * tính tiếp là cộng dồn sai số mỗi lần cuộn.
   */
  const kep = React.useCallback((z: { s: number; x: number; y: number }) => {
    const el = anhRef.current;
    const kh = khungRef.current;
    if (!el || !kh) return z;
    const duX = Math.max(0, (el.offsetWidth * z.s - kh.clientWidth) / 2);
    const duY = Math.max(0, (el.offsetHeight * z.s - kh.clientHeight) / 2);
    return {
      s: z.s,
      x: Math.min(duX, Math.max(-duX, z.x)),
      y: Math.min(duY, Math.max(-duY, z.y)),
    };
  }, []);

  /**
   * Đổi tỉ lệ mà GIỮ NGUYÊN điểm đang trỏ.
   *
   * Không có phần này thì cuộn chuột luôn phóng vào giữa ảnh, nên muốn
   * xem kỹ một góc là phải phóng rồi kéo ngược lại — thừa một thao tác
   * ở đúng việc người ta làm nhiều nhất.
   *
   * `px`, `py` tính từ TÂM khung, vì `transform-origin` là tâm.
   */
  const datTiLe = React.useCallback(
    (tinh: (s: number) => number, px = 0, py = 0) => {
      setZoom((z) => {
        const s = Math.min(TOI_DA, Math.max(1, tinh(z.s)));
        if (s === z.s) return z;
        // Về đúng 1 thì đưa ảnh lại giữa luôn, khỏi để lệch một chút
        // trông như ảnh bị đặt sai chỗ.
        if (s === 1) return { s: 1, x: 0, y: 0 };
        const k = s / z.s;
        return kep({ s, x: px - k * (px - z.x), y: py - k * (py - z.y) });
      });
    },
    [kep],
  );

  const ganLai = React.useCallback(() => setZoom({ s: 1, x: 0, y: 0 }), []);

  // Đổi ảnh thì bỏ thu phóng. Gọi thẳng trong hàm lật chứ không qua
  // `useEffect` theo dõi `i`: làm vậy là đặt trạng thái trong effect,
  // thêm một vòng render và `react-hooks` cũng kêu.
  const lui = React.useCallback(() => {
    ganLai();
    setI((c) => (c - 1 + soAnh) % soAnh);
  }, [soAnh, ganLai]);
  const toi = React.useCallback(() => {
    ganLai();
    setI((c) => (c + 1) % soAnh);
  }, [soAnh, ganLai]);

  /** Toạ độ con trỏ tính từ tâm khung. */
  const tuTam = (clientX: number, clientY: number) => {
    const kh = khungRef.current;
    if (!kh) return { x: 0, y: 0 };
    const r = kh.getBoundingClientRect();
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  };

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

  /* ================================================================
     CỬ CHỈ

     Chia theo loại thiết bị chứ không gộp vào Pointer Events: chụm hai
     ngón cần biết khoảng cách giữa hai điểm chạm, mà Pointer Events chỉ
     đưa từng con trỏ một nên phải tự gom lại thành cặp. Dùng thẳng sự
     kiện chạm thì `e.touches` đã sẵn cả hai.

     Điện thoại: vuốt ngang lật ảnh (chỉ khi chưa phóng), chụm hai ngón
     để phóng, một ngón kéo khi đang phóng, chạm đúp bật/tắt phóng.
     Máy tính: cuộn chuột phóng tại con trỏ, kéo chuột di chuyển, bấm
     đúp bật/tắt, kèm hai nút +/− cho ai không nghĩ tới chuyện cuộn.
     ================================================================ */

  const cham = React.useRef<{
    x: number;
    y: number;
    kc: number; // khoảng cách hai ngón lúc bắt đầu
    sDau: number; // tỉ lệ lúc bắt đầu chụm
    hai: boolean;
    daDiChuyen: boolean;
    lanTruoc: number; // mốc thời gian chạm trước, để bắt chạm đúp
  }>({ x: 0, y: 0, kc: 0, sDau: 1, hai: false, daDiChuyen: false, lanTruoc: 0 });

  const khoangCach = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const batDauCham = (e: React.TouchEvent) => {
    const c = cham.current;
    c.daDiChuyen = false;
    if (e.touches.length === 2) {
      c.hai = true;
      c.kc = khoangCach(e.touches);
      c.sDau = zoom.s;
    } else if (e.touches.length === 1) {
      c.hai = false;
      c.x = e.touches[0].clientX;
      c.y = e.touches[0].clientY;
    }
  };

  const dangCham = (e: React.TouchEvent) => {
    const c = cham.current;
    if (e.touches.length === 2 && c.hai) {
      c.daDiChuyen = true;
      const kc = khoangCach(e.touches);
      if (c.kc > 0) {
        const giua = tuTam(
          (e.touches[0].clientX + e.touches[1].clientX) / 2,
          (e.touches[0].clientY + e.touches[1].clientY) / 2,
        );
        datTiLe(() => (c.sDau * kc) / c.kc, giua.x, giua.y);
      }
      return;
    }
    if (e.touches.length === 1 && !c.hai && dangPhong) {
      // Một ngón khi đang phóng = kéo ảnh, không phải vuốt lật.
      const t = e.touches[0];
      const dx = t.clientX - c.x;
      const dy = t.clientY - c.y;
      c.x = t.clientX;
      c.y = t.clientY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) c.daDiChuyen = true;
      setZoom((z) => kep({ ...z, x: z.x + dx, y: z.y + dy }));
    }
  };

  const ketThucCham = (e: React.TouchEvent) => {
    const c = cham.current;
    if (c.hai) {
      // Nhả bớt còn một ngón thì coi như xong cú chụm, không để nó
      // biến tiếp thành một cú vuốt lật ảnh ngoài ý muốn.
      if (e.touches.length === 0) c.hai = false;
      return;
    }

    const t = e.changedTouches[0];
    const dx = t.clientX - c.x;
    const dy = t.clientY - c.y;

    // Chạm đúp: hai lần chạm gọn trong 300ms và gần như không xê dịch.
    const bayGio = Date.now();
    const gonGhe = Math.abs(dx) < 10 && Math.abs(dy) < 10 && !c.daDiChuyen;
    if (gonGhe && bayGio - c.lanTruoc < 300) {
      c.lanTruoc = 0;
      const p = tuTam(t.clientX, t.clientY);
      if (dangPhong) ganLai();
      else datTiLe(() => 2.5, p.x, p.y);
      return;
    }
    if (gonGhe) c.lanTruoc = bayGio;

    // Vuốt lật ảnh CHỈ khi chưa phóng — đang phóng thì cú kéo ngang là
    // để xem phần ảnh bị khuất, lật đi là cướp mất thao tác đó.
    if (dangPhong || soAnh < 2) return;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) lui();
    else toi();
  };

  /*
    Cuộn chuột để phóng.

    Nghe trên `window` với `passive: false` vì React gắn `onWheel` ở
    chế độ passive, mà passive thì không gọi được `preventDefault` —
    thiếu nó là cuộn chuột vừa phóng ảnh vừa cuộn trang nền phía sau.
  */
  React.useEffect(() => {
    const kh = khungRef.current;
    if (!kh) return;
    const xuLy = (e: WheelEvent) => {
      e.preventDefault();
      const p = tuTam(e.clientX, e.clientY);
      // Nhân/chia theo bước chứ không cộng trừ: phóng mà cộng đều thì
      // lúc ảnh còn nhỏ nhảy quá nhanh, lúc đã to lại nhích từng tí.
      const buoc = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      datTiLe((s) => s * buoc, p.x, p.y);
    };
    kh.addEventListener("wheel", xuLy, { passive: false });
    return () => kh.removeEventListener("wheel", xuLy);
  }, [datTiLe]);

  // Kéo bằng chuột khi đang phóng.
  const keoChuot = React.useRef<{ x: number; y: number } | null>(null);
  const batDauKeo = (e: React.MouseEvent) => {
    if (!dangPhong) return;
    e.preventDefault();
    keoChuot.current = { x: e.clientX, y: e.clientY };
  };
  React.useEffect(() => {
    const diChuyen = (e: MouseEvent) => {
      const d = keoChuot.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      keoChuot.current = { x: e.clientX, y: e.clientY };
      setZoom((z) => kep({ ...z, x: z.x + dx, y: z.y + dy }));
    };
    const tha = () => {
      keoChuot.current = null;
    };
    window.addEventListener("mousemove", diChuyen);
    window.addEventListener("mouseup", tha);
    return () => {
      window.removeEventListener("mousemove", diChuyen);
      window.removeEventListener("mouseup", tha);
    };
  }, [kep]);

  if (!anh) return null;

  return (
    <div
      className="relative flex h-full w-full flex-col"
      onTouchStart={batDauCham}
      onTouchMove={dangCham}
      onTouchEnd={ketThucCham}
      /* Khoảng trống của chính cột này (hai bên thanh trên, dải dưới
         khi không có chú thích) cũng tính là "ngoài ảnh". */
      onClick={(e) => {
        if (e.target === e.currentTarget) dong();
      }}
    >
      {/* Thanh trên: số thứ tự, tải về, đóng. */}
      <div className="flex shrink-0 items-center justify-between gap-2 p-3">
        <span className="rounded-lg bg-navy-950/60 px-3 py-1.5 text-[13px] font-semibold tabular-nums text-white/90">
          {soAnh > 1 ? `${i + 1} / ${soAnh}` : "Ảnh"}
          {dangPhong && ` · ${Math.round(zoom.s * 100)}%`}
        </span>

        <div className="flex items-center gap-2">
          {/*
            HAI NÚT +/− CHỈ HIỆN TRÊN THIẾT BỊ CÓ CHUỘT.

            Trên điện thoại, chụm hai ngón là cử chỉ ai cũng biết nên
            thêm nút chỉ tổ che mất ảnh. Trên máy tính thì ngược lại:
            cuộn chuột để phóng là thói quen có thật nhưng không phải ai
            cũng nghĩ tới, mà không có gì trên màn hình gợi ý rằng phóng
            được.
          */}
          <button
            type="button"
            onClick={() => datTiLe((s) => s / 1.5)}
            disabled={!dangPhong}
            aria-label="Thu nhỏ"
            className="hidden size-11 place-items-center rounded-full bg-navy-950/60 text-white/90 transition-colors hover:bg-navy-950/80 hover:text-white disabled:opacity-35 disabled:hover:bg-navy-950/60 pointer-fine:grid"
          >
            <Minus className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => datTiLe((s) => s * 1.5)}
            disabled={zoom.s >= TOI_DA}
            aria-label="Phóng to"
            className="hidden size-11 place-items-center rounded-full bg-navy-950/60 text-white/90 transition-colors hover:bg-navy-950/80 hover:text-white disabled:opacity-35 disabled:hover:bg-navy-950/60 pointer-fine:grid"
          >
            <Plus className="size-5" />
          </button>

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
        ref={khungRef}
        onClick={(e) => {
          // Đang phóng thì cú nhả chuột sau khi kéo cũng tính là một cú
          // bấm — đóng ở đây là đóng ngay giữa lúc người ta đang xem.
          if (e.target === e.currentTarget && !dangPhong) dong();
        }}
        onDoubleClick={(e) => {
          const p = tuTam(e.clientX, e.clientY);
          if (dangPhong) ganLai();
          else datTiLe(() => 2.5, p.x, p.y);
        }}
        onMouseDown={batDauKeo}
        /* `touch-action: none` để trình duyệt đừng tự xử lý cử chỉ: thiếu
           nó thì chụm hai ngón bị hiểu thành phóng to CẢ TRANG, còn kéo
           một ngón thì thành cuộn. */
        className={cn(
          "flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden",
          dangPhong ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        )}
      >
        <Image
          ref={anhRef}
          key={anh.id}
          src={anh.url}
          alt={anh.alt ?? "Ảnh phóng to"}
          width={anh.width ?? 1600}
          height={anh.height ?? 1200}
          sizes="100vw"
          draggable={false}
          /* Không có `transition` lúc đang chụm/kéo: mỗi khung hình là
             một giá trị mới, thêm hiệu ứng vào là ảnh chạy đuổi theo
             ngón tay chậm một nhịp, cảm giác như bị trượt. */
          style={{
            transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`,
          }}
          className="h-auto max-h-full w-auto max-w-full object-contain select-none"
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
