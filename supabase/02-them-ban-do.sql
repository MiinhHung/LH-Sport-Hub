-- =====================================================================
-- LH Sport Hub — thêm Google Maps cho buổi tập
-- ---------------------------------------------------------------------
-- Chạy:  npm run db:setup supabase/02-them-ban-do.sql
--
-- Chỉ thêm 2 cột vào play_sessions, không đụng dữ liệu đang có.
-- Chạy lại nhiều lần vô hại.
-- =====================================================================

-- Link Google Maps dán tay, dùng khi bản đồ tự dò ra sai chỗ.
ALTER TABLE "play_sessions"
  ADD COLUMN IF NOT EXISTS "map_url" text;

-- Cho phép tắt bản đồ với những địa chỉ chung chung.
ALTER TABLE "play_sessions"
  ADD COLUMN IF NOT EXISTS "show_map" boolean DEFAULT true NOT NULL;
