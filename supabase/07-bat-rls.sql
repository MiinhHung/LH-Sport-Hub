-- Bật Row Level Security cho 9 bảng còn thiếu
--
-- ==================================================================
-- LỖ HỔNG NÀY ĐANG MỞ TRÊN WEB THẬT. Sửa gấp.
-- ==================================================================
--
-- Khoá `anon` của Supabase nằm CÔNG KHAI trong mã client — đó là thiết
-- kế, nó không phải bí mật. Thứ chặn người lạ phải là Row Level
-- Security. Mà 9 bảng dưới đây đang TẮT RLS và không có policy nào, nên
-- bất kỳ ai mở web, lấy khoá đó ra là nói chuyện thẳng với database qua
-- REST API, không cần đăng nhập, không đi qua một dòng mã nào của app.
--
-- Đã thử thật trước khi viết file này:
--
--   GET  /rest/v1/profiles       → đọc được, KÈM EMAIL THẬT của thành viên
--   GET  /rest/v1/audit_logs     → đọc được toàn bộ nhật ký quản trị
--   GET  /rest/v1/notifications  → đọc được thông báo riêng của từng người
--   PATCH /rest/v1/profiles      → HTTP 204, tức SỬA được
--   DELETE /rest/v1/notifications → HTTP 204, tức XOÁ được
--
-- (Hai phép ghi thử bằng id không tồn tại nên không đụng dữ liệu thật.)
--
-- ------------------------------------------------------------------
-- VÌ SAO BẬT RLS MÀ KHÔNG VIẾT POLICY NÀO
-- ------------------------------------------------------------------
-- RLS bật + 0 policy = từ chối tất cả. Nghe như sẽ làm hỏng app, nhưng
-- không:
--
--   · App đọc/ghi qua `DATABASE_URL`, tức vai `postgres` — chủ của các
--     bảng này. Chủ bảng không bị RLS chặn, nên mọi server action và
--     mọi truy vấn Drizzle chạy y như cũ.
--   · Người lạ đi qua PostgREST với vai `anon` thì bị chặn sạch.
--
-- Không phải suy đoán: 6 bảng posts, post_media, comments, reactions,
-- conversations, messages ĐÃ ở đúng trạng thái này từ trước — RLS bật,
-- 0 policy — và bảng tin, bình luận, nhắn tin vẫn chạy bình thường suốt
-- thời gian qua. File này chỉ đưa 9 bảng còn lại về cùng trạng thái ấy.
--
-- Nếu sau này cần cho client gọi thẳng Supabase (realtime chẳng hạn),
-- lúc đó mới viết policy cho đúng bảng đó, chứ không tắt RLS lại.
--
-- Chạy lại nhiều lần không sao.

ALTER TABLE "public"."profiles"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."play_sessions"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."play_session_attendees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."challenges"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."challenge_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."challenge_results"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."debts"                  ENABLE ROW LEVEL SECURITY;
