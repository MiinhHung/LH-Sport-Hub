import "server-only";

import { and, asc, count, desc, eq, gt, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { conversations, messages, profiles } from "@/db/schema";

const publicPerson = {
  id: true,
  fullName: true,
  avatarUrl: true,
  department: true,
} as const;

/**
 * Xếp hai id theo thứ tự cố định.
 *
 * Nhờ quy ước này mà cặp (An, Bình) và (Bình, An) luôn ra cùng một hàng,
 * nên ràng buộc unique trên (user_a_id, user_b_id) là đủ để chặn việc
 * tạo trùng cuộc trò chuyện.
 */
export function pairKey(x: string, y: string) {
  return x < y ? { userAId: x, userBId: y } : { userAId: y, userBId: x };
}

/** Người còn lại trong cuộc trò chuyện, nhìn từ phía `viewerId`. */
function otherSide(
  conversation: { userAId: string; userBId: string },
  viewerId: string,
) {
  return conversation.userAId === viewerId ? "B" : "A";
}

export type ConversationRow = {
  id: string;
  partner: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    department: string | null;
  };
  lastMessagePreview: string | null;
  lastMessageAt: Date;
  lastSenderId: string | null;
  unread: boolean;
};

export async function listConversations(
  viewerId: string,
): Promise<ConversationRow[]> {
  const rows = await db.query.conversations.findMany({
    where: or(
      eq(conversations.userAId, viewerId),
      eq(conversations.userBId, viewerId),
    ),
    orderBy: [desc(conversations.lastMessageAt)],
    limit: 100,
    with: {
      userA: { columns: publicPerson },
      userB: { columns: publicPerson },
    },
  });

  return rows.map((c) => {
    const side = otherSide(c, viewerId);
    const partner = side === "B" ? c.userB : c.userA;
    const myReadAt = side === "B" ? c.readAtA : c.readAtB;

    return {
      id: c.id,
      partner,
      lastMessagePreview: c.lastMessagePreview,
      lastMessageAt: c.lastMessageAt,
      lastSenderId: c.lastSenderId,
      // Chưa đọc khi: tin cuối do người kia gửi, và mốc đã đọc của mình
      // cũ hơn tin đó (hoặc chưa từng đọc).
      unread:
        c.lastSenderId !== null &&
        c.lastSenderId !== viewerId &&
        (myReadAt === null || myReadAt < c.lastMessageAt),
    };
  });
}

/** Số cuộc trò chuyện đang có tin chưa đọc — dùng cho chấm đỏ trên thanh trên. */
export async function unreadConversationCount(
  viewerId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(conversations)
    .where(
      and(
        or(
          eq(conversations.userAId, viewerId),
          eq(conversations.userBId, viewerId),
        ),
        sql`${conversations.lastSenderId} is not null`,
        sql`${conversations.lastSenderId} <> ${viewerId}`,
        sql`
          case
            when ${conversations.userAId} = ${viewerId} then ${conversations.readAtA}
            else ${conversations.readAtB}
          end is null
          or
          case
            when ${conversations.userAId} = ${viewerId} then ${conversations.readAtA}
            else ${conversations.readAtB}
          end < ${conversations.lastMessageAt}
        `,
      ),
    );

  return row?.value ?? 0;
}

/**
 * Lấy cuộc trò chuyện kèm người còn lại.
 * Trả về null nếu người xem không thuộc cuộc trò chuyện này — đây là
 * chốt chặn quyền riêng tư, đừng bỏ.
 */
export async function getConversation(id: string, viewerId: string) {
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
    with: {
      userA: { columns: publicPerson },
      userB: { columns: publicPerson },
    },
  });

  if (!conversation) return null;
  if (
    conversation.userAId !== viewerId &&
    conversation.userBId !== viewerId
  ) {
    return null;
  }

  const side = otherSide(conversation, viewerId);
  return {
    ...conversation,
    partner: side === "B" ? conversation.userB : conversation.userA,
    mySide: side === "B" ? ("A" as const) : ("B" as const),
  };
}

export type ChatMessagePayload = {
  id: string;
  senderId: string;
  content: string;
  /** Chuỗi ISO — Date không đi qua ranh giới server/client an toàn ở đây. */
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
};

export async function listMessages(
  conversationId: string,
  limit = 200,
): Promise<ChatMessage[]> {
  const rows = await db.query.messages.findMany({
    where: and(
      eq(messages.conversationId, conversationId),
      isNull(messages.deletedAt),
    ),
    orderBy: [asc(messages.createdAt)],
    limit,
    columns: { id: true, senderId: true, content: true, createdAt: true },
  });
  return rows;
}

/** Chỉ lấy tin mới hơn mốc đã biết — dùng cho vòng lặp hỏi tin mới. */
export async function listMessagesSince(
  conversationId: string,
  since: Date,
): Promise<ChatMessage[]> {
  return db.query.messages.findMany({
    where: and(
      eq(messages.conversationId, conversationId),
      isNull(messages.deletedAt),
      gt(messages.createdAt, since),
    ),
    orderBy: [asc(messages.createdAt)],
    limit: 100,
    columns: { id: true, senderId: true, content: true, createdAt: true },
  });
}

/** Danh sách người có thể nhắn tin — trừ chính mình. */
export async function listChatPartners(viewerId: string) {
  return db.query.profiles.findMany({
    where: and(
      eq(profiles.status, "active"),
      sql`${profiles.id} <> ${viewerId}`,
    ),
    columns: publicPerson,
    orderBy: [asc(profiles.fullName)],
  });
}
