/**
 * Chạy một file .sql lên database trong DATABASE_URL.
 *
 *   npm run db:setup                    -> chạy supabase/01-them-bang-tin.sql
 *   npx tsx scripts/apply-sql.ts <file> -> chạy file bất kỳ
 *
 * Cả file được gửi trong MỘT lệnh, nên Postgres bọc nó trong một
 * transaction: hoặc chạy hết, hoặc không đổi gì cả.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const DEFAULT_FILE = "supabase/01-them-bang-tin.sql";

async function main() {
  const file = process.argv[2] ?? DEFAULT_FILE;
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error(
      "Thiếu DATABASE_URL. Kiểm tra .env.local (xem .env.example để biết cần gì).",
    );
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), file);
  let sqlText: string;
  try {
    sqlText = await readFile(fullPath, "utf8");
  } catch {
    console.error(`Không đọc được file: ${fullPath}`);
    process.exit(1);
  }

  const host = new URL(url).hostname;
  console.log(`Đang chạy ${file}`);
  console.log(`   → ${host}\n`);

  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });

  try {
    await sql.unsafe(sqlText);
    console.log("Xong.\n");

    // Đọc lại để xác nhận thật sự đã tạo, không chỉ báo "không lỗi".
    const tables = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('posts', 'post_media', 'comments', 'reactions')
      order by table_name
    `;

    if (tables.length > 0) {
      console.log("Bảng hiện có:", tables.map((t) => t.table_name).join(", "));
    }
  } catch (error) {
    console.error("\nChạy thất bại — database không thay đổi gì.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void main();
