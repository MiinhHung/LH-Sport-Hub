import { Camera } from "@/components/icons";
import Image from "next/image";

/**
 * Ảnh tĩnh trong `public/images`, chưa nối với database.
 * Khi làm tính năng đăng ảnh thật thì thay mảng này bằng dữ liệu từ bảng posts.
 *
 * Trước đây khối này dùng `motion/react` với `whileInView`: ảnh bắt đầu ở
 * opacity 0 rồi chờ cuộn tới mới hiện. Nhược điểm là nếu bộ theo dõi tầm
 * nhìn không kịp chạy — tải chậm, chụp ảnh màn hình, trình duyệt lạ — thì
 * cả dải nằm vô hình và trang trông như bị trống. Đổi sang animation CSS
 * chạy ngay khi dựng: không phụ thuộc JS, và gỡ luôn `motion` khỏi gói
 * JavaScript của phần app đã đăng nhập.
 */
const IMAGES = [
  {
    src: "/images/feed-1.jpg",
    alt: "Cả team chụp chung tại sân cầu lông",
    caption: "Cả team trên sân",
    span: "col-span-2 row-span-2",
  },
  {
    src: "/images/feed-2.jpg",
    alt: "Nghỉ giải lao bên lề sân",
    caption: "Giải lao",
    span: "col-span-1 row-span-1",
  },
  {
    src: "/images/feed-3.jpg",
    alt: "Anh em cầm vợt trước giờ vào trận",
    caption: "Trước giờ vào trận",
    span: "col-span-1 row-span-1",
  },
  {
    src: "/images/feed-4.jpg",
    alt: "Ảnh tập thể cuối buổi",
    caption: "Cuối buổi",
    span: "col-span-2 row-span-1",
  },
];

export function TeamFeed() {
  return (
    <section aria-labelledby="khoanh-khac" className="space-y-3">
      <div className="flex items-end justify-between gap-3 border-b border-ink-800 pb-3">
        <h2
          id="khoanh-khac"
          className="flex items-center gap-2 text-[16px] font-semibold text-ink-100"
        >
          <Camera className="size-4 text-gold-500" aria-hidden />
          Khoảnh khắc của team
        </h2>
        <span className="text-[12.5px] text-ink-500">
          Ảnh từ những buổi gần đây
        </span>
      </div>

      <div className="grid auto-rows-[112px] grid-cols-4 gap-2.5 sm:auto-rows-[150px] sm:gap-3">
        {IMAGES.map((img, i) => (
          <figure
            key={img.src}
            className={`animate-rise group relative overflow-hidden rounded-xl bg-ink-850 ring-1 ring-ink-800 ${img.span}`}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 truncate bg-navy-950/70 px-3 py-2 text-[12.5px] font-semibold text-white">
              {img.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
