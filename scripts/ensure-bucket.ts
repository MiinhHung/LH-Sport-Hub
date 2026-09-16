/**
 * Tạo kho ảnh trên Supabase Storage nếu chưa có.
 *
 *   npm run storage:setup
 *
 * Chạy lại nhiều lần vô hại: đã có rồi thì chỉ báo và thoát.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { UPLOAD } from "../src/lib/constants";

config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("Không đọc được danh sách kho ảnh:", listError.message);
    process.exit(1);
  }

  const existing = buckets?.find((b) => b.name === UPLOAD.bucket);

  if (existing) {
    console.log(`Kho ảnh "${UPLOAD.bucket}" đã có (public: ${existing.public}).`);
    if (!existing.public) {
      console.warn(
        "  Cảnh báo: kho đang ở chế độ riêng tư nên ảnh sẽ không hiển thị được.\n" +
          "  Vào Supabase → Storage → chỉnh bucket thành Public.",
      );
    }
    return;
  }

  const { error } = await supabase.storage.createBucket(UPLOAD.bucket, {
    public: true,
    // Rộng hơn giới hạn phía server một chút để lỗi được báo bằng
    // tiếng Việt trong app, thay vì bị Storage chặn thẳng.
    fileSizeLimit: UPLOAD.maxBytes + 1024 * 1024,
    allowedMimeTypes: [...UPLOAD.allowedMimeTypes],
  });

  if (error) {
    console.error(`Tạo kho ảnh thất bại: ${error.message}`);
    process.exit(1);
  }

  console.log(`Đã tạo kho ảnh "${UPLOAD.bucket}" (công khai).`);
}

void main();
