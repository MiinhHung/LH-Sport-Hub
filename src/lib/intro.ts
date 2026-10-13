/**
 * Màn mở đầu của trang giới thiệu.
 *
 * TOÀN BỘ CHUYỂN ĐỘNG LÀ CSS, không phải React state. Bản cũ giữ màn mở
 * đầu bằng state + một vòng rAF đếm phần trăm + hẹn giờ lồng nhau, nên:
 *  - máy chủ luôn dựng lớp phủ, người đã xem rồi vẫn thấy nó nháy một cái;
 *  - hero bị ẩn cho tới khi một CustomEvent tới, chậm một nhịp là trống trơn;
 *  - mọi khung hình rơi đúng lúc trình duyệt đang hydrate, nên giật.
 *
 * Giờ một đoạn script chặn (chạy trước khung hình đầu tiên) quyết định có
 * chiếu hay không bằng cách gắn `data-intro="play"` lên <html>. CSS lo phần
 * còn lại, chạy trên compositor nên vẫn mượt cả khi main thread đang bận
 * hydrate. JavaScript chỉ còn việc cho bấm "Bỏ qua" và dọn dẹp lúc xong.
 *
 * Không có JavaScript thì không có thuộc tính, lớp phủ ẩn, trang hiện ngay.
 */

/** Mili giây, tính từ lúc trang hiện. Phải khớp khối "Màn mở đầu" trong globals.css. */
export const INTRO_TIMING = {
  /** Bật nhảy đập, quả cầu rời mặt vợt. */
  SMASH_AT: 1600,
  /** Quả cầu chạm đích ở hero, quả cầu hero hiện lên thay chỗ. */
  LAND_AT: 3000,
  /** Màn mở đầu xong hẳn: gỡ khỏi DOM, trả phím. */
  END: 3600,
  /** Thời lượng mờ đi khi bấm Bỏ qua. */
  SKIP: 260,
} as const;

/**
 * Chạy trong <head>, trước khung hình đầu tiên. Chiếu MỖI LẦN tải trang chủ
 * (mở mới, F5, gõ địa chỉ). Bấm link nội bộ quay về trang chủ thì không chạy
 * lại, vì Next chuyển trang phía máy khách, <head> không chạy lại script này.
 * Không bao giờ chiếu cho người bật giảm chuyển động, trừ khi mở bảng soi
 * pose bằng `?debug=1` (xem components/intro/intro-debug.tsx).
 */
export const INTRO_SCRIPT = `
try {
  var p = location.pathname;
  if (p === '/' || p === '/gioi-thieu' || p === '/gioi-thieu/') {
    document.documentElement.setAttribute('data-intro', 'play');
    document.documentElement.removeAttribute('data-intro-done');
    document.documentElement.removeAttribute('data-intro-skip');
  }
} catch (e) {}
`.trim();
