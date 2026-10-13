"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { ROLES, type RoleKey } from "@/lib/constants";
import { failure, runAction, success, type ActionState } from "./types";

export async function setUserRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireRole("admin");

    const userId = String(formData.get("userId") ?? "");
    const role = String(formData.get("role") ?? "") as RoleKey;

    if (!userId || !Object.hasOwn(ROLES, role)) return failure("Yêu cầu không hợp lệ.");
    if (userId === actor.id) {
      return failure("Không thể tự đổi vai trò của chính mình.");
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { id: true, fullName: true, role: true },
    });
    if (!target) return failure("Không tìm thấy thành viên.");

    await db
      .update(profiles)
      .set({ role, updatedAt: new Date() })
      .where(eq(profiles.id, userId));

    await audit(db, {
      actorId: actor.id,
      action: "admin.set_role",
      targetType: "profile",
      targetId: userId,
      metadata: { from: target.role, to: role },
    });

    revalidatePath("/quan-tri");
    revalidatePath("/thanh-vien");
    return success(`Đã đặt ${target.fullName} thành ${ROLES[role].label}.`);
  });
}

export async function setUserStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireRole("moderator");

    const userId = String(formData.get("userId") ?? "");
    const status = String(formData.get("status") ?? "");

    if (!userId || (status !== "active" && status !== "suspended")) {
      return failure("Yêu cầu không hợp lệ.");
    }
    if (userId === actor.id) {
      return failure("Không thể tự khoá tài khoản của chính mình.");
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { id: true, fullName: true, role: true, status: true },
    });
    if (!target) return failure("Không tìm thấy thành viên.");

    // Moderator không được đụng vào admin hoặc moderator khác. Chỉ admin mới quản trị được cấp quản trị.
    if (
      (target.role === "admin" || target.role === "moderator") &&
      actor.role !== "admin"
    ) {
      return failure("Bạn không có quyền với tài khoản này.");
    }

    await db
      .update(profiles)
      .set({ status, updatedAt: new Date() })
      .where(eq(profiles.id, userId));

    await audit(db, {
      actorId: actor.id,
      action: status === "suspended" ? "admin.suspend" : "admin.reactivate",
      targetType: "profile",
      targetId: userId,
      metadata: { from: target.status, to: status },
    });

    revalidatePath("/quan-tri");
    revalidatePath("/thanh-vien");
    return success(
      status === "suspended"
        ? `Đã tạm khoá ${target.fullName}.`
        : `Đã mở khoá ${target.fullName}.`,
    );
  });
}
