"use client";

import * as React from "react";

/**
 * Đoạn phim giới thiệu, chỉ tải khi sắp cuộn tới.
 *
 * File nặng 13,5 MB. Gắn thẳng `src` vào thẻ video là mọi người mở trang
 * đều tải chừng ấy, kể cả người chỉ xem cái hero rồi bấm vào bảng tin.
 * Nên `src` được gắn muộn — khi khối còn cách khung nhìn một quãng, vừa đủ
 * để tải kịp trước lúc nhìn thấy.
 *
 * Cũng DỪNG lại khi cuộn khỏi tầm nhìn. Video tự phát mà chạy ngầm dưới
 * chân trang là đốt pin điện thoại cho một thứ không ai xem.
 *
 * File không có luồng tiếng — đã kiểm tra trong header — nên tự phát là
 * hợp lệ và không làm ai giật mình.
 */
export function ShowcaseVideo({
  src,
  poster,
  label,
}: {
  src: string;
  poster?: string;
  /** Mô tả cho người dùng trình đọc màn hình. */
  label: string;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }

    // Quãng đệm rộng: bắt đầu tải khi còn cách một màn hình rưỡi.
    const loader = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setArmed(true);
          loader.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    loader.observe(el);

    // Bộ theo dõi thứ hai, ngưỡng hẹp hơn: chạy khi thấy, dừng khi khuất.
    const player = new IntersectionObserver(
      ([e]) => {
        const v = ref.current;
        if (!v) return;
        if (e.isIntersecting) {
          // play() trả về promise và sẽ bị từ chối nếu trình duyệt chặn —
          // nuốt lỗi đi, vì không có gì để làm tiếp.
          void v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.15 },
    );
    player.observe(el);

    return () => {
      loader.disconnect();
      player.disconnect();
    };
  }, []);

  return (
    <video
      ref={ref}
      // Không có tiếng nhưng vẫn để `muted`: thiếu nó là trình duyệt chặn
      // tự phát, bất kể file có tiếng hay không.
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      aria-label={label}
      className="size-full object-cover"
    >
      {armed ? <source src={src} type="video/mp4" /> : null}
    </video>
  );
}
