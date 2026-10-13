"use client";

import { Pause, Play } from "lucide-react";
import * as React from "react";

/**
 * Đoạn phim giới thiệu, chỉ tải khi sắp cuộn tới.
 *
 * File nặng 13,5 MB. Gắn thẳng `src` vào thẻ video là mọi người mở trang
 * đều tải chừng ấy, kể cả người chỉ xem cái hero rồi bấm vào bảng tin.
 * Nên `src` được gắn muộn, khi khối còn cách khung nhìn một quãng.
 *
 * TRỢ NĂNG (WCAG 2.2.2): video tự phát dài hơn 5 giây phải có cách tạm
 * dừng. Có nút Tạm dừng / Phát ở góc dưới. Ai bật "giảm chuyển động" thì
 * video KHÔNG tự phát, chỉ hiện ảnh bìa cùng nút Phát.
 *
 * Cũng dừng khi cuộn khỏi tầm nhìn, khỏi đốt pin cho thứ không ai xem.
 * File không có luồng tiếng nên tự phát (muted) là hợp lệ.
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
  const [nguon, setNguon] = React.useState<string | null>(null);
  const [dangPhat, setDangPhat] = React.useState(false);
  // Người dùng chủ động dừng (hoặc bật giảm chuyển động): đừng tự phát lại.
  const nguoiDungDung = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !nguon) return;
    el.load();
    if (!nguoiDungDung.current) void el.play().catch(() => {});
  }, [nguon]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nguoiDungDung.current = true;
    }

    if (typeof IntersectionObserver === "undefined") {
      setNguon(src);
      return;
    }

    // Quãng đệm rộng: bắt đầu tải khi còn cách một màn hình rưỡi.
    const loader = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNguon(src);
          loader.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    loader.observe(el);

    // Chạy khi thấy, dừng khi khuất (trừ khi người dùng đã tự dừng).
    const player = new IntersectionObserver(
      ([e]) => {
        const v = ref.current;
        if (!v) return;
        if (e.isIntersecting) {
          if (!nguoiDungDung.current) void v.play().catch(() => {});
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
  }, [src]);

  const bam = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      nguoiDungDung.current = false;
      if (!nguon) setNguon(src);
      void v.play().catch(() => {});
    } else {
      nguoiDungDung.current = true;
      v.pause();
    }
  };

  return (
    <>
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
        src={nguon ?? undefined}
        onPlay={() => setDangPhat(true)}
        onPause={() => setDangPhat(false)}
        className="size-full object-cover"
      />
      <button
        type="button"
        onClick={bam}
        aria-label={dangPhat ? "Tạm dừng video" : "Phát video"}
        className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-full bg-navy-900 text-white transition-[background-color,transform] duration-[var(--m-instant)] ease-[var(--m-ease)] hover:bg-navy-800 active:scale-[0.98]"
      >
        {dangPhat ? (
          <Pause className="size-5" aria-hidden />
        ) : (
          <Play className="size-5" aria-hidden />
        )}
      </button>
    </>
  );
}
