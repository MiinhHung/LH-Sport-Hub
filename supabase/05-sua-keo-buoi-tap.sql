-- Sửa kèo và sửa buổi tập
--
-- Trước đây người tạo chỉ có "Huỷ" và "Xoá": gõ nhầm một chữ trong tên
-- kèo, hay sân đổi giờ, thì cách duy nhất là xoá đi tạo lại — mất sạch
-- người đã nhận kèo, đã nhận đi.
--
-- Hai loại thông báo mới để báo cho người trong cuộc biết điều khoản
-- vừa đổi. Không có chúng thì ai đó nhận kèo "2 chai nước" rồi sáng
-- hôm sau thành "5 bữa sáng" mà không hay biết.
--
-- ADD VALUE IF NOT EXISTS: chạy lại file này nhiều lần cũng không sao.

ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'challenge_updated';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'session_updated';
