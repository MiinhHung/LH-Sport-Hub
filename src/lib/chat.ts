import "server-only";

import { and, asc, count, desc, eq, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { conversations, messages, profiles } from "@/db/schema";

const publicPerson = {
  id: true,
  fullName: true,
  avatarUrl: true,
  department: true,
  /** Để vẽ chấm "đang hoạt động" — xem `lib/hoat-dong.ts`. */
  lastActiveAt: true,
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
    lastActiveAt: Date;
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
        /*
          NGOẶC QUANH CẢ VẾ OR LÀ BẮT BUỘC. `and()` của drizzle KHÔNG tự bọc
          ngoặc cho từng mảnh sql``: thiếu ngoặc thì SQL đọc thành
          "(lọc người xem AND … AND mốc đọc is null) OR mốc đọc < tin cuối",
          vế sau thoát hết điều kiện lọc — chấm đỏ đếm cả cuộc mình nhắn cuối,
          thậm chí cuộc của người khác. Đã gặp thật: badge báo 1, vào xem
          không có tin nào mới.
        */
        sql`(
          case
            when ${conversations.userAId} = ${viewerId} then ${conversations.readAtA}
            else ${conversations.readAtB}
          end is null
          or
          case
            when ${conversations.userAId} = ${viewerId} then ${conversations.readAtA}
            else ${conversations.readAtB}
          end < ${conversations.lastMessageAt}
        )`,
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
  if (conversation.userAId !== viewerId && conversation.userBId !== viewerId) {
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
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  /** Chuỗi ISO — Date không đi qua ranh giới server/client an toàn ở đây. */
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  createdAt: Date;
};

/** Đổi bản ghi database sang dạng gửi xuống máy người dùng. */
export function toPayload(m: ChatMessage): ChatMessagePayload {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

/**
 * Kiểm tra một người có thuộc cuộc trò chuyện không.
 *
 * Nhẹ hơn getConversation rất nhiều (không join hai bảng profiles), nên
 * dùng cho vòng lặp hỏi tin — thứ chạy vài giây một lần suốt thời gian
 * mở khung chat.
 */
export async function isParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const row = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      or(eq(conversations.userAId, userId), eq(conversations.userBId, userId)),
    ),
    columns: { id: true },
  });
  return Boolean(row);
}

export async function listMessages(
  conversationId: string,
  limit = 200,
): Promise<ChatMessage[]> {
  const rows = await db.query.messages.findMany({
    where: and(
      eq(messages.conversationId, conversationId),
      isNull(messages.deletedAt),
    ),
    orderBy: [desc(messages.createdAt)],
    limit,
    columns: {
      id: true,
      senderId: true,
      content: true,
      imageUrl: true,
      imageWidth: true,
      imageHeight: true,
      createdAt: true,
    },
  });
  return rows.reverse();
}

/**
 * Chỉ lấy tin mới hơn mốc đã biết — dùng cho vòng lặp hỏi tin mới.
 *
 * Postgres lưu `created_at` tới micro giây, còn mốc `since` từ máy người
 * dùng là chuỗi ISO chỉ tới mili giây (cắt bớt phần lẻ). So thẳng thì tin
 * cuối cùng LUÔN "mới hơn" chính mốc của nó => lần hỏi nào cũng trả lại tin
 * đó. Cắt `created_at` về mili giây trước khi so để hai bên cùng độ chính xác.
 */
export async function listMessagesSince(
  conversationId: string,
  since: Date,
): Promise<ChatMessage[]> {
  return db.query.messages.findMany({
    where: and(
      eq(messages.conversationId, conversationId),
      isNull(messages.deletedAt),
      sql`date_trunc('milliseconds', ${messages.createdAt}) > ${since.toISOString()}::timestamptz`,
    ),
    orderBy: [asc(messages.createdAt)],
    limit: 100,
    columns: {
      id: true,
      senderId: true,
      content: true,
      imageUrl: true,
      imageWidth: true,
      imageHeight: true,
      createdAt: true,
    },
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
