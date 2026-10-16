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
  /**
   * Chờ tối đa bao lâu (từ lúc trang hiện) trước khi bấm giờ màn mở đầu.
   * Xem `data-intro-wait` trong INTRO_SCRIPT.
   */
  WAIT_MAX: 8000,
  /** Đã hydrate mà ảnh/font vẫn chưa xong thì cũng chỉ chờ thêm chừng này. */
  WAIT_AFTER_HYDRATE: 1500,
} as const;

/**
 * Chạy trong <head>, trước khung hình đầu tiên. Chiếu MỖI LẦN tải trang chủ
 * (mở mới, F5, gõ địa chỉ). Bấm link nội bộ quay về trang chủ thì không chạy
 * lại, vì Next chuyển trang phía máy khách, <head> không chạy lại script này.
 * Không bao giờ chiếu cho người bật giảm chuyển động, trừ khi mở bảng soi
 * pose bằng `?debug=1` (xem components/intro/intro-debug.tsx).
 *
 * `data-intro-wait`: CSS dừng mọi animation ở khung đầu (đồng hồ % đứng ở
 * 0, như màn tải trang) cho tới khi IntroOverlay gỡ cờ này, lúc JavaScript,
 * font và ảnh quả cầu hero đã sẵn sàng. Không chờ thì lần mở đầu tiên (chưa
 * có cache) JavaScript tới SAU cú đập, đường bay vào hero không kịp dựng và
 * quả cầu đáp lệch; F5 thì có cache nên lại khớp. JavaScript hỏng hẳn thì
 * hẹn giờ ở đây tự gỡ sau WAIT_MAX.
 *
 * Đây là NƠI DUY NHẤT gắn `data-intro="play"`. IntroOverlay chỉ đọc cờ này,
 * không tự gắn lại, nên chuyển trang phía máy khách không chiếu lại.
 */
export const INTRO_SCRIPT = `
try {
  var p = location.pathname;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dbg = /[?&]debug=1(&|$)/.test(location.search);
  if ((p === '/' || p === '/gioi-thieu' || p === '/gioi-thieu/') && (!calm || dbg)) {
    var h = document.documentElement;
    h.setAttribute('data-intro', 'play');
    h.setAttribute('data-intro-wait', '');
    h.removeAttribute('data-intro-done');
    h.removeAttribute('data-intro-skip');
    setTimeout(function () { h.removeAttribute('data-intro-wait'); }, ${INTRO_TIMING.WAIT_MAX});
  }
} catch (e) {}
`.trim();
