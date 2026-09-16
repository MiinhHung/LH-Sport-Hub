import { HERO_VIDEO } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Khử màu video rồi để lớp navy phủ bên trên nhuộm lại.
 *
 * Không phải để cho đẹp suông: video nền có thể mang bất kỳ tông màu nào
 * (video hiện tại đỏ tím) và màu đó sẽ chửi nhau với navy + vàng của app.
 * Bỏ màu đi thì video chỉ còn là chuyển động, còn màu do app quyết định —
 * nên thay video khác vẫn không vỡ giao diện.
 */
const TINT = "grayscale contrast-[1.08] brightness-[0.92]";

/**
 * Video chạy nền, phủ kín khung cha.
 *
 * Không phải client component: chỉ là thẻ <video> / <iframe> thuần nên
 * không tốn một byte JavaScript nào của app.
 *
 * Ảnh poster nằm dưới cùng và luôn hiện. Video đè lên nó, nên lúc video
 * chưa kịp chạy — hoặc trình duyệt chặn tự phát — người xem thấy ảnh chứ
 * không thấy ô đen.
 */
export function HeroVideo({
  className,
  label,
}: {
  className?: string;
  /** Mô tả cho người dùng trình đọc màn hình. */
  label: string;
}) {
  const { file, youtubeId, poster } = HERO_VIDEO;

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      /* Mốc để tính cqw/cqh bên dưới: nhờ nó phép "phủ kín" đo theo khung
         này chứ không theo cả màn hình, nên dùng được cho cả dải ngang thấp
         lẫn cột cao nguyên trang. */
      style={{ containerType: "size" }}
    >
      {/* Lớp nền luôn có, kể cả khi video hỏng hoặc bị chặn. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={label}
        className={cn("absolute inset-0 size-full object-cover", TINT)}
      />

      {file ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-hidden
          tabIndex={-1}
          /* Ai bật "giảm chuyển động" trong hệ điều hành thì ẩn video đi,
             ảnh poster nằm sẵn bên dưới sẽ lộ ra. Không cần JS. */
          className={cn(
            "absolute inset-0 size-full object-cover motion-reduce:hidden",
            TINT,
          )}
        >
          <source src={file} type="video/mp4" />
        </video>
      ) : youtubeId ? (
        /* Trình phát YouTube luôn giữ khung 16:9 và kẻ viền đen cho phần
           thừa. Muốn phủ kín một khung không phải 16:9 thì phải phóng iframe
           to hơn khung rồi cắt bớt — đó là ý nghĩa của hai phép max() dưới,
           chính là object-cover viết tay cho iframe. */
        <iframe
          src={
            `https://www.youtube-nocookie.com/embed/${youtubeId}` +
            `?autoplay=1&mute=1&loop=1&playlist=${youtubeId}` +
            "&controls=0&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3"
          }
          title={label}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 border-0",
            TINT,
          )}
        />
      ) : null}
    </div>
  );
}
