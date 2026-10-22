/**
 * Đọc & kiểm tra biến môi trường một lần, ở một chỗ.
 * Không bao giờ export secret ra client — chỉ các biến NEXT_PUBLIC_* mới an toàn.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Thiếu biến môi trường ${name}. Xem .env.example để biết cách cấu hình.`,
    );
  }
  return value.trim();
}

/** Dùng được ở cả client lẫn server. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",
  /*
    Địa chỉ thật của trang, dùng cho `metadataBase` — tức gốc để dựng
    đường dẫn tuyệt đối cho `og:image`.

    BA BẬC, VÌ BẬC ĐẦU HAY BỊ QUÊN. Đã đo trên bản đã deploy: thẻ
    `og:image` trả về `http://localhost:3000/logo.png`, nên mọi nơi dán
    link (Zalo, Messenger, Facebook) đều đi tìm ảnh ở máy người dùng và
    không thấy gì.

      1. NEXT_PUBLIC_SITE_URL — đặt tay, thắng tất cả. Dùng khi có tên
         miền riêng.
      2. VERCEL_PROJECT_PRODUCTION_URL — Vercel tự đặt, là tên miền
         production ổn định. Nhờ bậc này mà không đặt gì vẫn đúng.
      3. localhost — chỉ còn đúng cho lúc chạy ở máy.

    Bậc 2 KHÔNG phải `VERCEL_URL`: biến đó đổi theo từng lần deploy, nên
    ảnh xem trước của một link cũ sẽ trỏ vào bản deploy đã chết.

    Biến bậc 2 không mang tiền tố NEXT_PUBLIC nên chỉ đọc được ở server.
    Không sao: chỗ duy nhất dùng `siteUrl` là `metadataBase` trong
    `app/layout.tsx`, vốn chạy ở server.
  */
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};

export function requirePublicEnv() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    supabaseAnonKey: required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY)",
      publicEnv.supabaseAnonKey,
    ),
    siteUrl: publicEnv.siteUrl,
  };
}

/**
 * Danh sách domain email được phép đăng ký, phân tách bằng dấu phẩy.
 * Để trống = cho phép mọi domain (chỉ nên dùng khi chạy thử).
 */
export function allowedEmailDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function isEmailDomainAllowed(email: string): boolean {
  const domains = allowedEmailDomains();
  // Để trống ALLOWED_EMAIL_DOMAINS là mở cho mọi email (xem .env.example).
  if (domains.length === 0) return true;
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return domains.includes(domain);
}

/** Email được tự động cấp quyền admin ở lần đăng nhập đầu tiên. */
export function bootstrapAdminEmails(): string[] {
  return (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Chỉ đọc trên server. */
export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  // CRON_SECRET không đọc qua đây: /api/cron đọc thẳng process.env để tự
  // trả 500 có lời giải thích khi thiếu, thay vì ném lỗi.
};
