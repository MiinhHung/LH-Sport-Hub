"use server";

import { and, eq, inArray } from "drizzle-orm";
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

    /*
      NHẬN NHIỀU ID, KHÔNG PHẢI MỘT.

      Trang thông báo gộp những dòng cùng loại về cùng một chỗ thành
      MỘT hàng — ba người cùng nhận một buổi tập thì chỉ hiện một dòng.
      Bấm "đã đọc" ở hàng đó phải đánh dấu cả ba bản ghi nằm dưới nó,
      nếu không thì hai cái còn lại vẫn chưa đọc và hàng đó hiện lại
      ngay lần tải sau — người dùng bấm mà thấy không ăn thua.

      `getAll` vì biểu mẫu gửi lên nhiều ô cùng tên.
    */
    const ids = formData
      .getAll("notificationId")
      .map((v) => String(v))
      .filter(Boolean);
    if (ids.length === 0) return failure("Yêu cầu không hợp lệ.");

    // Điều kiện recipientId đảm bảo không ai đọc hộ thông báo người khác.
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          inArray(notifications.id, ids),
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
