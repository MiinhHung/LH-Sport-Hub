import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Thiếu DATABASE_URL. Sao chép .env.example thành .env.local và điền connection string của Supabase.",
  );
}

/**
 * Next.js dev mode hot-reload sẽ tạo lại module nhiều lần, nên cache
 * client trên globalThis để không mở hàng loạt connection thừa.
 */
const globalForDb = globalThis as unknown as {
  __lhSportHubPg?: ReturnType<typeof postgres>;
};

/*
 * HAI THỨ Ở ĐÂY SINH RA TỪ MỘT LẦN APP TREO HẲN, KHÔNG PHẢI PHÒNG XA.
 *
 * Triệu chứng: mọi trang cần đăng nhập đều treo quá 60 giây, còn trang
 * công khai thì vẫn trả về trong 0,45 giây. Soi `pg_stat_activity` lúc
 * đang treo thấy ba truy vấn `select from challenges` ở trạng thái
 * `active`, một cái đã 8093 giây — tức hơn hai tiếng.
 *
 * Nhưng `wait_event` của cả ba là `Client / ClientRead`: database đã
 * làm xong và đang ĐỢI PHÍA NODE ĐỌC KẾT QUẢ. Không phải truy vấn chậm,
 * mà là kết nối bị bỏ rơi — yêu cầu bị huỷ giữa chừng (người dùng bấm
 * sang trang khác, hoặc trình duyệt hết giờ chờ) trong lúc truy vấn còn
 * dở, và không ai dọn.
 *
 * 1. `max` CŨ LÀ 3 Ở DEV. Ba lần bỏ dở là hết sạch kết nối, và từ đó
 *    mọi yêu cầu xếp hàng chờ vô hạn — app chết đứng chứ không chậm dần.
 *    Một yêu cầu /ho-so đã cần tới bốn truy vấn chạy song song, nên 3 là
 *    quá sát ngay cả khi không rò.
 *
 * 2. KHÔNG CÓ HẠN GIỜ NÀO. Không có hạn thì một kết nối treo là treo
 *    vĩnh viễn, phải khởi động lại máy chủ mới hết. Có hạn thì hệ thống
 *    tự lành lại sau vài giây.
 *
 * `statement_timeout` 20 giây: không truy vấn nào của app này cần lâu
 * hơn thế — đo trên dữ liệu thật thì cái nặng nhất là 617ms. Vượt 20
 * giây nghĩa là đã hỏng, cắt sớm còn hơn giữ chỗ.
 */
const client =
  globalForDb.__lhSportHubPg ??
  postgres(connectionString, {
    // Supabase transaction pooler không hỗ trợ prepared statements.
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 10 : 8,
    idle_timeout: 20,
    connect_timeout: 15,
    connection: {
      statement_timeout: 20_000,
      idle_in_transaction_session_timeout: 20_000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__lhSportHubPg = client;
}

export const db = drizzle(client, { schema, casing: "snake_case" });

export type Db = typeof db;
export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

export { schema };
