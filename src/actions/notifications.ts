"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireActor } from "@/lib/auth";
import { failure, runAction, success, type ActionState } from "./types";

export async function markNotificationReadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const id = String(formData.get("notificationId") ?? "");
    if (!id) return failure("Yêu cầu không hợp lệ.");

    // Điều kiện recipientId đảm bảo không ai đọc hộ thông báo người khác.
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.recipientId, actor.id),
        ),
      );

    revalidatePath("/thong-bao");
    return success();
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientId, actor.id),
          eq(notifications.isRead, false),
        ),
      );

    revalidatePath("/thong-bao");
    revalidatePath("/keo");
    return success("Đã đánh dấu tất cả là đã đọc.");
  });
}
