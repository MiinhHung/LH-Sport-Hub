/**
 * Chạy file .sql lên database trong DATABASE_URL.
 *
 *   npm run db:setup                    -> chạy TẤT CẢ file trong supabase/
 *                                          theo thứ tự tên (01-, 02-, ...)
 *   npx tsx scripts/apply-sql.ts <file> -> chạy đúng một file
 *
 * Mỗi file được gửi trong MỘT lệnh, nên Postgres bọc nó trong một
 * transaction: hoặc chạy hết, hoặc không đổi gì cả.
 *
 * Các file đều viết theo kiểu chạy lại vô hại (IF NOT EXISTS), nên
 * chạy lệnh này nhiều lần không sao.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"] });

const SQL_DIR = "supabase";

async function filesToRun(): Promise<string[]> {
  const explicit = process.argv[2];
  if (explicit) return [explicit];

  const entries = await readdir(SQL_DIR);
  return entries
    .filter((f) => f.endsWith(".sql"))
    .sort() // 01- chạy trước 02-
    .map((f) => path.join(SQL_DIR, f));
}

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error(
      "Thiếu DATABASE_URL. Kiểm tra .env.local (xem .env.example để biết cần gì).",
    );
    process.exit(1);
  }

  let files: string[];
  try {
    files = await filesToRun();
  } catch {
    console.error(`Không đọc được thư mục ${SQL_DIR}/`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log(`Không có file .sql nào trong ${SQL_DIR}/`);
    return;
  }

  console.log(`Database: ${new URL(url).hostname}\n`);

  const sql = postgres(url, {
    prepare: false,
    max: 1,
    connect_timeout: 20,
    // "already exists, skipping" là NOTICE bình thường khi chạy lại — bỏ qua.
    onnotice: () => {},
  });

  try {
    for (const file of files) {
      const sqlText = await readFile(path.resolve(process.cwd(), file), "utf8");
      process.stdout.write(`  ${file} ... `);
      await sql.unsafe(sqlText);
      console.log("xong");
    }

    // Đọc lại để xác nhận thật sự đã tạo, không chỉ báo "không lỗi".
    const tables = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('posts', 'post_media', 'comments', 'reactions')
      order by table_name
    `;

    console.log(
      `\nBảng bảng tin: ${
        tables.length > 0
          ? tables.map((t) => t.table_name).join(", ")
          : "(chưa có — kiểm tra lại file SQL)"
      }`,
    );
  } catch (error) {
    console.error("\nChạy thất bại — file đang chạy không thay đổi gì.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void main();
