-- Trả lời bình luận
--
-- Bình luận trên bảng tin chỉ có một tầng: ai muốn đáp lại một bình luận
-- cụ thể thì phải viết thêm một bình luận mới ở cuối bài, rồi gõ tên người
-- kia cho rõ. Bài sôi nổi một chút là không ai lần ra câu nào đang đáp câu
-- nào.
--
-- `parent_id` trỏ tới bình luận được trả lời. CHỈ MỘT TẦNG, như Facebook:
-- trả lời vào một câu trả lời thì vẫn gắn vào bình luận gốc (máy chủ tự
-- quy về), nên không bao giờ có chuỗi thụt vào mãi không dứt.
--
-- ON DELETE CASCADE chỉ có tác dụng khi xoá hẳn dòng; xoá trên giao diện
-- là xoá mềm (status = 'deleted'), câu trả lời vẫn còn.
--
-- IF NOT EXISTS: chạy lại file này nhiều lần cũng không sao.

ALTER TABLE "public"."comments"
  ADD COLUMN IF NOT EXISTS "parent_id" uuid
  REFERENCES "public"."comments"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "comments_parent_idx"
  ON "public"."comments" ("parent_id");
