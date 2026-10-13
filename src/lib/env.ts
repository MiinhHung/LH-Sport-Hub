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
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
  // Khi chưa cấu hình ALLOWED_EMAIL_DOMAINS: cho phép tự do ở môi trường dev,
  // nhưng tự động khoá (fail-closed) ở production để bảo vệ dữ liệu nội bộ.
  if (domains.length === 0) {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    return !isProduction;
  }
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
  get cronSecret() {
    return required("CRON_SECRET", process.env.CRON_SECRET);
  },
};
