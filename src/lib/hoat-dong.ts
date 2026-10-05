/**
 * "Đang hoạt động" — chấm xanh.
 *
 * ĐÂY KHÔNG PHẢI PRESENCE THẬT, VÀ CHỮ NGHĨA PHẢI NÓI ĐÚNG ĐIỀU ĐÓ.
 *
 * Cơ sở duy nhất là `profiles.last_active_at`, vốn được cập nhật mỗi lần
 * người dùng mở một trang trong app (xem `getCurrentProfile`). Đi lại
 * trong app thì nó luôn tươi, vì điều hướng của App Router vẫn gọi về
 * máy chủ. Nhưng NGỒI ĐỌC MỘT TRANG LÂU THÌ NÓ KHÔNG NHẢY — người đó sẽ
 * bị coi là đã rời đi dù vẫn đang nhìn màn hình.
 *
 * Cách chữa quen thuộc là cho trình duyệt ping về mỗi phút. Không làm,
 * vì trong codebase này mỗi lượt gọi đều phải qua proxy và xác minh
 * phiên với Supabase — chỗ tốn nhất đã đo được. 30 người ping mỗi phút
 * là hơn 40 nghìn lượt mỗi ngày chỉ để làm một cái chấm chính xác hơn
 * vài phút. Muốn chính xác thật thì phải sang Supabase Realtime
 * presence, và đó là hạ tầng khác.
 *
 * Vì vậy chữ dùng khắp nơi là "Đang hoạt động", không phải "Online".
 * Nói đúng thứ mình biết thì cái chấm sai cũng không thành lời nói dối.
 */

/**
 * Trong bao lâu thì còn tính là đang hoạt động.
 *
 * 5 phút là đánh đổi: ngắn hơn thì người đọc một bài trong cẩm nang sẽ
 * tắt chấm giữa chừng; dài hơn thì người đã đóng máy đi họp vẫn sáng
 * đèn, mà một cái chấm xanh sai thì tệ hơn là không có chấm nào.
 */
export const CUA_SO_HOAT_DONG_MS = 5 * 60 * 1000;

export function dangHoatDong(lastActiveAt: Date | string | null): boolean {
  if (!lastActiveAt) return false;
  const t = new Date(lastActiveAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < CUA_SO_HOAT_DONG_MS;
}

/**
 * Câu chữ cho chỗ có đủ chỗ — trang cá nhân, đầu khung chat.
 *
 * Cố ý KHÔNG trả về "Hoạt động 2 phút trước" khi còn trong cửa sổ: lúc
 * đó chấm đã xanh rồi, thêm một con số chỉ làm người ta soi xem 2 phút
 * là còn hay hết.
 */
export function nhanHoatDong(lastActiveAt: Date | string | null): string {
  if (!lastActiveAt) return "Chưa hoạt động lần nào";
  if (dangHoatDong(lastActiveAt)) return "Đang hoạt động";

  const t = new Date(lastActiveAt).getTime();
  if (Number.isNaN(t)) return "Chưa hoạt động lần nào";

  const phut = Math.floor((Date.now() - t) / 60000);
  if (phut < 60) return `Hoạt động ${phut} phút trước`;

  const gio = Math.floor(phut / 60);
  if (gio < 24) return `Hoạt động ${gio} giờ trước`;

  const ngay = Math.floor(gio / 24);
  if (ngay < 30) return `Hoạt động ${ngay} ngày trước`;

  const thang = Math.floor(ngay / 30);
  return `Hoạt động ${thang} tháng trước`;
}
