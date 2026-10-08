"use client";

import Image from "next/image";
import * as React from "react";

import { XemAnh, type AnhXemDuoc } from "@/components/xem-anh";
import { cn } from "@/lib/utils";

/**
 * Tỉ lệ khung cho MỘT ảnh, kẹp trong khoảng đọc được.
 *
 * Bản trước để `object-contain` trên nền xám với `max-h-[520px]`. Hai
 * hậu quả thấy ngay khi chụp màn hình bảng tin thật:
 *
 *  - Ảnh DỌC bị đóng khung: ảnh vừa theo chiều cao, còn hai bên là hai
 *    dải xám rộng. Nhìn như ảnh hỏng chứ không như ảnh được trình bày.
 *  - Một bài một ảnh chiếm hơn cả màn hình, nên cuộn bảng tin thành
 *    cuộn qua từng tấm ảnh một.
 *
 * Giờ dùng `object-cover` trong một khung có tỉ lệ TÍNH TỪ ảnh thật
 * (database có lưu width/height), rồi kẹp lại:
 *
 *   dọc nhất   4:5    (0.8)  — hơn nữa thì cắt bớt trên dưới
 *   ngang nhất 16:9   (1.78) — hơn nữa thì cắt bớt hai bên
 *
 * KÈM THÊM MỘT TRẦN CHIỀU CAO TUYỆT ĐỐI. Chỉ kẹp tỉ lệ là chưa đủ: cột
 * bảng tin rộng 735px, nên một ảnh 4:5 vẫn cao 919px — hơn cả màn hình
 * laptop. Đã đo sau lần sửa đầu và vẫn phải cuộn gần hai màn cho một
 * tấm ảnh. Trần 560px giữ cho mỗi bài gọn trong tầm mắt, và vì dùng
 * `object-cover` nên phần dư bị cắt chứ không đẻ ra dải xám.
 *
 * Ảnh nằm trong khoảng đó thì giữ nguyên tỉ lệ, không cắt một pixel nào.
 * Chỉ ảnh quá dọc hoặc quá ngang mới bị kẹp — và bấm vào thì khung xem
 * ảnh mở ra tấm đầy đủ, không cắt gì.
 *
 * Không có width/height (ảnh cũ đăng trước khi lưu kích thước) thì mặc
 * định 4:5, vì ảnh chụp bằng điện thoại phần lớn là ảnh dọc.
 */
function tiLeAnh(w?: number | null, h?: number | null) {
  if (!w || !h) return 0.8;
  return Math.min(Math.max(w / h, 0.8), 16 / 9);
}

/**
 * Lưới ảnh của một bài viết.
 *
 * LÀ CLIENT COMPONENT, KHÁC VỚI PHẦN CÒN LẠI CỦA THẺ BÀI. Lý do duy
 * nhất: cần bắt cú bấm để mở khung xem ảnh. Phần tốn kém là tấm ảnh,
 * mà ảnh thì `next/image` lo, không phụ thuộc chỗ này chạy ở đâu.
 *
 * Mỗi thẻ bài giữ trạng thái riêng của nó, không có kho chung cho cả
 * bảng tin: hai bài mở cùng lúc là chuyện không thể xảy ra, và một kho
 * chung sẽ kéo theo context bao quanh cả danh sách.
 */
export function LuoiAnh({ media }: { media: AnhXemDuoc[] }) {
  const [moTai, setMoTai] = React.useState<number | null>(null);

  if (media.length === 0) return null;

  const single = media.length === 1;
  const con = media.length - 4;

  return (
    <>
      <div
        className={cn(
          "mt-3 grid gap-1 overflow-hidden rounded-xl",
          media.length === 1 && "grid-cols-1",
          media.length >= 2 && "grid-cols-2",
        )}
      >
        {media.slice(0, 4).map((m, i) => (
          /*
            NÚT CHỨ KHÔNG PHẢI THẺ `<a>`.

            Trước đây đây là `<a href={m.url} target="_blank">`, tức ấn
            vào là bị ném sang một tab trắng chỉ có tấm ảnh. Giờ nó mở
            lớp phủ ngay tại chỗ, nên đúng ngữ nghĩa là một nút.

            Lối mở tệp gốc không mất: nó chuyển vào trong khung xem,
            thành nút tải về.
          */
          <button
            key={m.id}
            type="button"
            onClick={() => setMoTai(i)}
            aria-label={
              i === 3 && con > 0
                ? `Xem ảnh, còn ${con} tấm nữa`
                : `Xem ảnh ${i + 1} trong ${media.length}`
            }
            className={cn(
              "group relative block cursor-zoom-in overflow-hidden bg-ink-850",
              // `w-full` BẮT BUỘC đi kèm `max-h`. Thiếu nó thì bề ngang là
              // "tự co", nên khi trần chiều cao cắt bớt, tỉ lệ kéo luôn bề
              // ngang xuống theo — đo được 448px trên một cột rộng 734px, tức
              // hai dải trống hai bên.
              single && "w-full max-h-[560px]",
              !single && "aspect-square",
              // Ba ảnh: tấm đầu cao gấp đôi, nằm trọn cột trái.
              media.length === 3 && i === 0 && "row-span-2 aspect-auto",
            )}
            style={
              single
                ? { aspectRatio: String(tiLeAnh(m.width, m.height)) }
                : undefined
            }
          >
            <Image
              src={m.url}
              alt={m.alt ?? "Ảnh trong bài viết"}
              fill
              sizes={single ? "(max-width: 768px) 100vw, 640px" : "320px"}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />

            {/* Ảnh thứ tư của bài có hơn bốn ảnh: phủ mờ và báo còn mấy tấm */}
            {i === 3 && con > 0 && (
              <span className="absolute inset-0 grid place-items-center bg-navy-950/55 text-[22px] font-bold text-white">
                +{con}
              </span>
            )}
          </button>
        ))}
      </div>

      <XemAnh
        danhSach={media}
        moTai={moTai}
        dong={() => setMoTai(null)}
      />
    </>
  );
}
