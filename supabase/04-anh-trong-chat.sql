-- =====================================================================
-- LH Sport Hub — cho phép gửi ảnh trong tin nhắn
-- ---------------------------------------------------------------------
-- Chạy:  npm run db:setup     (chạy lại nhiều lần vô hại)
-- =====================================================================

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "image_url"    text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "image_width"  integer;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "image_height" integer;

-- Tin nhắn chỉ có ảnh thì phần chữ để rỗng, nên bỏ ràng buộc bắt buộc.
ALTER TABLE "messages" ALTER COLUMN "content" SET DEFAULT '';
