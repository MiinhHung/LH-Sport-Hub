import "server-only";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { bootstrapAdminEmails, isEmailDomainAllowed } from "@/lib/env";
import { ROLES, type RoleKey } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

import { AppError } from "@/actions/types";

export { AppError };

function displayNameFrom(email: string, metadata: Record<string, unknown>) {
  const raw =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    "";
  const trimmed = raw.trim();
  if (trimmed) return trimmed.slice(0, 80);
  return email.split("@")[0].replace(/[._-]+/g, " ").slice(0, 80) || "Thành viên";
}

/**
 * Ảnh đại diện từ nhà cung cấp đăng nhập (Google…). `user_metadata` do
 * người dùng tự đặt được, nên bỏ qua URL trỏ vào kho ảnh của mình —
 * nếu không, đổi avatar sẽ xoá mất ảnh của người khác.
 */
function externalAvatarFrom(metadata: Record<string, unknown>): string | null {
  const raw = metadata.avatar_url;
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.pathname.includes("/storage/v1/")) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Lấy profile của người đang đăng nhập; tạo mới nếu đây là lần đầu.
 * Kết quả được cache trong phạm vi một request.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const email = user.email.toLowerCase();

  // Chặn ngay cả khi ai đó lách được bước đăng ký.
  if (!isEmailDomainAllowed(email)) {
    await supabase.auth.signOut();
    return null;
  }

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });

  if (existing) {
    // Chỉ cập nhật nếu lần hoạt động cuối cách hơn 5 phút, tránh spam UPDATE trên mỗi request/polling
    const fiveMinutes = 5 * 60 * 1000;
    const shouldUpdate =
      !existing.lastActiveAt ||
      Date.now() - existing.lastActiveAt.getTime() > fiveMinutes;

    if (shouldUpdate) {
      void db
        .update(profiles)
        .set({ lastActiveAt: new Date() })
        .where(eq(profiles.id, user.id))
        .catch((err) => {
          console.error("[auth] cập nhật lastActiveAt thất bại:", err);
        });
    }
    return existing;
  }

  // Chỉ cấp admin khi email đã xác minh — nếu không, ai đăng ký trước
  // bằng đúng địa chỉ đó sẽ thành admin.
  const isBootstrapAdmin =
    Boolean(user.email_confirmed_at) && bootstrapAdminEmails().includes(email);

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      email,
      fullName: displayNameFrom(email, user.user_metadata ?? {}),
      avatarUrl: externalAvatarFrom(user.user_metadata ?? {}),
      role: isBootstrapAdmin ? "admin" : "member",
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { lastActiveAt: sql`now()` },
    })
    .returning();

  return created ?? null;
});

/** Dùng trong page/layout: chưa đăng nhập thì đá về trang đăng nhập. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/dang-nhap");
  if (profile.status === "suspended") redirect("/bi-khoa");
  return profile;
}

/**
 * Dùng trong server action: ném lỗi thay vì redirect,
 * để action trả về thông điệp cho form.
 */
export async function requireActor(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AppError("Bạn cần đăng nhập để thực hiện thao tác này.");
  if (profile.status === "suspended") {
    throw new AppError("Tài khoản của bạn đang bị tạm khoá.");
  }
  return profile;
}

export function hasRole(profile: Profile, minimum: RoleKey): boolean {
  return ROLES[profile.role].rank >= ROLES[minimum].rank;
}

export function isModerator(profile: Profile): boolean {
  return hasRole(profile, "moderator");
}

export function isAdmin(profile: Profile): boolean {
  return profile.role === "admin";
}

export async function requireRole(minimum: RoleKey): Promise<Profile> {
  const profile = await requireActor();
  if (!hasRole(profile, minimum)) {
    throw new AppError("Bạn không có quyền thực hiện thao tác này.");
  }
  return profile;
}
