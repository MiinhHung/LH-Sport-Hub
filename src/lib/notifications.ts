import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { db, type Db } from "@/db";
import { notifications } from "@/db/schema";

/** Đủ dùng cho cả `db` lẫn transaction của Drizzle. */
type Inserter = Pick<Db, "insert">;

type NotificationType =
  (typeof notifications.type)["enumValues"][number];

export type NewNotification = {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  message?: string | null;
  href?: string | null;
};

/**
 * Ghi thông báo. Tự bỏ qua thông báo tự gửi cho chính mình
 * (không ai cần báo về hành động của chính họ).
 */
export async function notify(
  executor: Inserter,
  items: NewNotification | NewNotification[],
): Promise<void> {
  const list = (Array.isArray(items) ? items : [items]).filter(
    (n) => n.recipientId && n.recipientId !== n.actorId,
  );
  if (list.length === 0) return;

  await executor.insert(notifications).values(
    list.map((n) => ({
      recipientId: n.recipientId,
      actorId: n.actorId ?? null,
      type: n.type,
      title: n.title,
      message: n.message ?? null,
      href: n.href ?? null,
    })),
  );
}

export async function unreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.isRead, false),
      ),
    );
  return row?.value ?? 0;
}

export async function listNotifications(userId: string, limit = 50) {
  return db.query.notifications.findMany({
    where: eq(notifications.recipientId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit,
    with: {
      actor: {
        columns: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });
}
