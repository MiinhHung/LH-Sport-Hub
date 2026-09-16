-- =====================================================================
-- LH Sport Hub — nhắn tin riêng giữa hai người
-- ---------------------------------------------------------------------
-- Chạy:  npm run db:setup
-- Chỉ thêm mới, chạy lại nhiều lần vô hại.
-- =====================================================================

CREATE TABLE IF NOT EXISTS "conversations" (
  "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_a_id"            uuid NOT NULL,
  "user_b_id"            uuid NOT NULL,
  "last_message_at"      timestamp with time zone DEFAULT now() NOT NULL,
  "last_message_preview" text,
  "last_sender_id"       uuid,
  "read_at_a"            timestamp with time zone,
  "read_at_b"            timestamp with time zone,
  "created_at"           timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "sender_id"       uuid NOT NULL,
  "content"         text NOT NULL,
  "created_at"      timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at"      timestamp with time zone
);

-- --- Khoá ngoại -------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_a_id_profiles_id_fk"
    FOREIGN KEY ("user_a_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_b_id_profiles_id_fk"
    FOREIGN KEY ("user_b_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk"
    FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- Chỉ mục ----------------------------------------------------------

-- Mỗi cặp người chỉ có đúng một cuộc trò chuyện.
-- Code luôn xếp user_a_id < user_b_id trước khi ghi, nên không có chuyện
-- cùng một cặp tạo ra hai hàng theo hai chiều ngược nhau.
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_pair_unique"
  ON "conversations" ("user_a_id", "user_b_id");

CREATE INDEX IF NOT EXISTS "conversations_user_a_idx"
  ON "conversations" ("user_a_id", "last_message_at");
CREATE INDEX IF NOT EXISTS "conversations_user_b_idx"
  ON "conversations" ("user_b_id", "last_message_at");

CREATE INDEX IF NOT EXISTS "messages_conversation_idx"
  ON "messages" ("conversation_id", "created_at");

-- --- Khoá truy cập trực tiếp -----------------------------------------
-- Tin nhắn riêng tư: bật RLS và KHÔNG tạo policy nào, nên anon key của
-- trình duyệt không đọc được gì. Mọi truy cập đi qua server action.

ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages"      ENABLE ROW LEVEL SECURITY;
