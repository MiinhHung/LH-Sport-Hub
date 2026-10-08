"use client";

import * as React from "react";

/**
 * Thẻ video chạy nền, chỉ tải khi thật sự nhìn thấy.
 *
 * TẠI SAO PHẢI CÓ JAVASCRIPT CHO MỘT THẺ VIDEO.
 *
 * `HeroVideo` trước đây là server component thuần, không tốn một byte
 * JS nào — và đó là một điểm đáng giữ. Nhưng nó đặt `autoPlay` lên thẻ
 * video, mà `autoPlay` thì vô hiệu hoá `preload="metadata"`: trình duyệt
 * vẫn kéo cả tệp về để có cái mà phát.
 *
 * Chỗ đau nhất là bảng thương hiệu ở màn đăng nhập. Bảng đó mang lớp
 * `hidden lg:block`, tức ĐIỆN THOẠI KHÔNG HIỆN NÓ. Nhưng `display:none`
 * không ngăn trình duyệt tải tài nguyên. Đo trên bản dựng, màn 390px:
 *
 *   /videos/hero.mp4   2 769 KB
 *
 * 2,7MB tải về trên 4G để phục vụ một bảng không được vẽ ra. Người mới
 * mở đường link phải trả chừng ấy trước khi gõ được mật khẩu.
 *
 * Phần tử nằm trong `display:none` thì KHÔNG BAO GIỜ giao với khung
 * nhìn, nên `IntersectionObserver` không bao giờ kích hoạt, nên `src`
 * không bao giờ được gắn. Điện thoại tải 0 byte, máy tính vẫn có video
 * như cũ. Đổi lại là một nhúm JS — so với 2,7MB thì không phải lựa chọn
 * khó.
 *
 * Cách làm này chép từ `landing/showcase-video.tsx`, vốn đã xử đúng bài
 * tương tự cho đoạn phim 13,5MB ở trang giới thiệu. Lời giải vốn có sẵn
 * trong nhà, chỉ là chỗ này chưa dùng.
 */
export function VideoNen({
  src,
  poster,
  className,
}: {
  src: string;
  /** Chỉ để lấp lúc video chưa chạy; ảnh nền thật nằm ở lớp dưới. */
  poster?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [nguon, setNguon] = React.useState<string | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Trình duyệt quá cũ thì thôi, cứ tải như trước còn hơn không có gì.
    //
    // Gán thẳng vào DOM chứ không qua setState: đặt state ngay trong thân
    // effect sẽ kéo theo một vòng render thừa, và `react-hooks` bắt đúng
    // chỗ này. Đây là nhánh dự phòng mang tính mệnh lệnh, không có gì để
    // React phải theo dõi.
    if (typeof IntersectionObserver === "undefined") {
      el.src = src;
      return;
    }

    const theoDoi = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setNguon(src);
        theoDoi.disconnect();
      },
      // Đệm hẹp thôi: đây là video nền nằm ngay đầu trang, không phải
      // thứ nằm sâu dưới cần tải trước cả màn hình.
      { rootMargin: "50px" },
    );
    theoDoi.observe(el);

    return () => theoDoi.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      // Giữ `muted`: thiếu nó là trình duyệt chặn tự phát, bất kể tệp có
      // tiếng hay không.
      muted
      loop
      playsInline
      // `autoPlay` chỉ bật sau khi đã có `src`. Để sẵn trên thẻ rỗng thì
      // không hại gì, nhưng để đây cho rõ: video chỉ chạy khi có nguồn.
      autoPlay
      preload="none"
      poster={poster}
      aria-hidden
      tabIndex={-1}
      src={nguon ?? undefined}
      className={className}
    />
  );
}
