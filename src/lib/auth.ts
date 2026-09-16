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
    // Cập nhật nhẹ, không chặn luồng nếu lỗi.
    void db
      .update(profiles)
      .set({ lastActiveAt: new Date() })
      .where(eq(profiles.id, user.id))
      .catch(() => undefined);
    return existing;
  }

  const isBootstrapAdmin = bootstrapAdminEmails().includes(email);

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      email,
      fullName: displayNameFrom(email, user.user_metadata ?? {}),
      avatarUrl:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
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
