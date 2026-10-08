-- Bài đăng dạng link
--
-- Bảng tin có bốn loại bài: chém gió, ảnh, thông báo, tìm người. Không
-- loại nào dành cho một đường dẫn. Ai muốn chia sẻ video kỹ thuật hay
-- tin giải đấu thì dán URL trần vào bài chém gió, hiện ra một dòng chữ
-- xanh dài ngoằng không ai buồn bấm.
--
-- Đây cũng là câu trả lời thật cho chuyện tin tức ở trang cẩm nang. Đã
-- thử kéo tin từ thethao247.vn và không làm được tử tế: trang không có
-- RSS (mọi đường feed trả 404), lại nấp sau Cloudflare nên yêu cầu từ
-- máy chủ nhận 403 kèm màn hình "Just a moment...". Quét 6 báo thể thao
-- có RSS hợp lệ thì trong 1260 tin chỉ 4 tin nhắc tới cầu lông, mà 2
-- trong số đó là dương tính giả.
--
-- Nên thay vì đi cào tin của người khác, để chính anh em chia sẻ. Tin
-- do người trong team chọn thì đúng thứ team quan tâm hơn bất kỳ bộ lọc
-- tự động nào.
--
-- ẢNH XEM TRƯỚC LƯU VÀO KHO CỦA MÌNH, không trỏ thẳng ra ngoài. Trỏ
-- thẳng thì phải nới `remotePatterns` của next/image thành `**`, tức là
-- bất kỳ ai dán link cũng khiến máy chủ mình đi tải ảnh từ host tuỳ ý —
-- biến trình tối ưu ảnh thành một proxy mở. Tải về rồi kiểm magic bytes
-- và nén lại như mọi ảnh khác thì `remotePatterns` vẫn khoá chặt ở đúng
-- host Supabase.
--
-- ADD VALUE IF NOT EXISTS / IF NOT EXISTS: chạy lại file này nhiều lần
-- cũng không sao.

ALTER TYPE "public"."post_type" ADD VALUE IF NOT EXISTS 'link';

-- Năm cột, không phải một cột jsonb: chúng được đọc để hiển thị chứ
-- không phải để tra cứu linh hoạt, và kiểu rõ ràng thì Drizzle sinh
-- type đúng mà không phải tự khai lại.
ALTER TABLE "public"."posts"
  ADD COLUMN IF NOT EXISTS "link_url"   text,
  ADD COLUMN IF NOT EXISTS "link_title" text,
  ADD COLUMN IF NOT EXISTS "link_desc"  text,
  ADD COLUMN IF NOT EXISTS "link_image" text,
  ADD COLUMN IF NOT EXISTS "link_site"  text;
