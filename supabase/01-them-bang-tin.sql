-- =====================================================================
-- LH Sport Hub — thêm phần BẢNG TIN (bài viết, ảnh, bình luận, cảm xúc)
-- ---------------------------------------------------------------------
-- Chạy MỘT LẦN trên database đang có dữ liệu.
-- Cách chạy: Supabase Dashboard → SQL Editor → dán toàn bộ file → Run.
--
-- An toàn: chỉ THÊM mới, không sửa/xoá bảng nào đang có.
-- Chạy lại lần nữa cũng không sao (đều có IF NOT EXISTS).
-- =====================================================================

-- --- Kiểu dữ liệu mới -------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "public"."post_type" AS ENUM
    ('text', 'image', 'announcement', 'looking_for_player');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."content_status" AS ENUM
    ('published', 'hidden', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."reaction_target" AS ENUM ('post', 'comment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."reaction_type" AS ENUM
    ('like', 'love', 'haha', 'fire', 'clap', 'sad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- Bổ sung loại thông báo mới --------------------------------------
-- IF NOT EXISTS có từ Postgres 12; Supabase đều mới hơn.

ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'post_comment';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'post_reaction';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'comment_reply';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'post_mention';

-- --- Bảng -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "posts" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "author_id"      uuid NOT NULL,
  "content"        text NOT NULL,
  "type"           "post_type" DEFAULT 'text' NOT NULL,
  "status"         "content_status" DEFAULT 'published' NOT NULL,
  "is_pinned"      boolean DEFAULT false NOT NULL,
  "challenge_id"   uuid,
  "session_id"     uuid,
  "comment_count"  integer DEFAULT 0 NOT NULL,
  "reaction_count" integer DEFAULT 0 NOT NULL,
  "created_at"     timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"     timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at"     timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "post_media" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id"    uuid NOT NULL,
  "url"        text NOT NULL,
  "alt"        text,
  "width"      integer,
  "height"     integer,
  "file_size"  integer,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comments" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id"    uuid NOT NULL,
  "author_id"  uuid NOT NULL,
  "content"    text NOT NULL,
  "status"     "content_status" DEFAULT 'published' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "reactions" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"     uuid NOT NULL,
  "target_type" "reaction_target" NOT NULL,
  "target_id"   uuid NOT NULL,
  "type"        "reaction_type" NOT NULL,
  "created_at"  timestamp with time zone DEFAULT now() NOT NULL
);

-- --- Khoá ngoại -------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_id_fk"
    FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "posts" ADD CONSTRAINT "posts_challenge_id_challenges_id_fk"
    FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "posts" ADD CONSTRAINT "posts_session_id_play_sessions_id_fk"
    FOREIGN KEY ("session_id") REFERENCES "public"."play_sessions"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_posts_id_fk"
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk"
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_profiles_id_fk"
    FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- Chỉ mục ----------------------------------------------------------

CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" ("created_at");
CREATE INDEX IF NOT EXISTS "posts_status_idx"     ON "posts" ("status");
CREATE INDEX IF NOT EXISTS "posts_author_idx"     ON "posts" ("author_id");
CREATE INDEX IF NOT EXISTS "posts_pinned_idx"     ON "posts" ("is_pinned");

CREATE INDEX IF NOT EXISTS "post_media_post_idx"  ON "post_media" ("post_id", "sort_order");

CREATE INDEX IF NOT EXISTS "comments_post_idx"    ON "comments" ("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "comments_author_idx"  ON "comments" ("author_id");

-- Mỗi người đúng một cảm xúc cho mỗi nội dung.
CREATE UNIQUE INDEX IF NOT EXISTS "reactions_unique_per_user"
  ON "reactions" ("user_id", "target_type", "target_id");
CREATE INDEX IF NOT EXISTS "reactions_target_idx"
  ON "reactions" ("target_type", "target_id");

-- --- Khoá truy cập trực tiếp -----------------------------------------
-- App chỉ đọc/ghi các bảng này qua server action (dùng connection string
-- riêng). Bật RLS mà không tạo policy nào = anon key của trình duyệt
-- không đọc được gì, kể cả khi ai đó lấy được key.

ALTER TABLE "posts"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reactions"  ENABLE ROW LEVEL SECURITY;
