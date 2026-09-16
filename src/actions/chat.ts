"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { conversations, messages, profiles } from "@/db/schema";
import { requireActor } from "@/lib/auth";
import {
  getConversation,
  listMessagesSince,
  pairKey,
  type ChatMessagePayload,
} from "@/lib/chat";
import { LIMITS } from "@/lib/constants";
import { failure, runAction, success, type ActionState } from "./types";

/** Cắt bớt để làm dòng xem trước trong danh sách. */
function preview(text: string, max = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/* ------------------------------------------------------------------ */
/* Mo cuoc tro chuyen                                                  */
/* ------------------------------------------------------------------ */

/**
 * Tìm cuộc trò chuyện với một người, chưa có thì tạo.
 * `onConflictDoNothing` + đọc lại là để hai người bấm cùng lúc cũng
 * chỉ ra đúng một cuộc trò chuyện.
 */
export async function openConversationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let target: string | null = null;

  const result = await runAction(async () => {
    const actor = await requireActor();
    const partnerId = String(formData.get("partnerId") ?? "");

    if (!partnerId) return failure("Yêu cầu không hợp lệ.");
    if (partnerId === actor.id) {
      return failure("Không thể tự nhắn tin cho chính mình.");
    }

    const partner = await db.query.profiles.findFirst({
      where: and(eq(profiles.id, partnerId), eq(profiles.status, "active")),
      columns: { id: true },
    });
    if (!partner) return failure("Không tìm thấy thành viên này.");

    const pair = pairKey(actor.id, partnerId);

    await db
      .insert(conversations)
      .values({ ...pair, lastMessageAt: new Date(), lastSenderId: null })
      .onConflictDoNothing({
        target: [conversations.userAId, conversations.userBId],
      });

    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.userAId, pair.userAId),
        eq(conversations.userBId, pair.userBId),
      ),
      columns: { id: true },
    });

    if (!existing) return failure("Không mở được cuộc trò chuyện.");

    target = existing.id;
    return success();
  });

  if (target) redirect(`/tin-nhan/${target}`);
  return result;
}

/* ------------------------------------------------------------------ */
/* Gui tin nhan                                                        */
/* ------------------------------------------------------------------ */

export async function sendMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const conversationId = String(formData.get("conversationId") ?? "");
    const content = String(formData.get("content") ?? "").trim();

    if (!conversationId) return failure("Yêu cầu không hợp lệ.");
    if (!content) return failure("Chưa nhập nội dung.");
    if (content.length > LIMITS.commentContent) {
      return failure(`Tin nhắn tối đa ${LIMITS.commentContent} ký tự.`);
    }

    // Đọc qua getConversation để tận dụng luôn bước kiểm tra người gửi
    // có thuộc cuộc trò chuyện hay không.
    const conversation = await getConversation(conversationId, actor.id);
    if (!conversation) {
      return failure("Bạn không ở trong cuộc trò chuyện này.");
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(messages).values({
        conversationId,
        senderId: actor.id,
        content,
      });

      await tx
        .update(conversations)
        .set({
          lastMessageAt: now,
          lastMessagePreview: preview(content),
          lastSenderId: actor.id,
          // Người gửi thì hiển nhiên đã đọc tới đây.
          ...(conversation.userAId === actor.id
            ? { readAtA: now }
            : { readAtB: now }),
        })
        .where(eq(conversations.id, conversationId));
    });

    revalidatePath("/tin-nhan");
    revalidatePath(`/tin-nhan/${conversationId}`);
    return success();
  });
}

/* ------------------------------------------------------------------ */
/* Lay tin moi (cho vong lap hoi tin)                                  */
/* ------------------------------------------------------------------ */

/**
 * Trả về tin nhắn mới hơn mốc `since`.
 *
 * Dùng cách hỏi lại theo chu kỳ thay vì realtime: realtime của Supabase
 * cần mở policy RLS cho anon key đọc bảng messages, mà tin nhắn riêng
 * thì không nên mở. Với team vài chục người, hỏi lại mỗi vài giây là đủ.
 */
export async function fetchNewMessagesAction(
  conversationId: string,
  sinceIso: string,
): Promise<{ ok: boolean; messages: ChatMessagePayload[] }> {
  try {
    const actor = await requireActor();
    const conversation = await getConversation(conversationId, actor.id);
    if (!conversation) return { ok: false, messages: [] };

    const since = new Date(sinceIso);
    if (Number.isNaN(since.getTime())) return { ok: false, messages: [] };

    const rows = await listMessagesSince(conversationId, since);

    return {
      ok: true,
      messages: rows.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch {
    return { ok: false, messages: [] };
  }
}


/* ------------------------------------------------------------------ */
/* Danh dau da doc                                                     */
/* ------------------------------------------------------------------ */

export async function markConversationReadAction(
  conversationId: string,
): Promise<void> {
  try {
    const actor = await requireActor();
    const conversation = await getConversation(conversationId, actor.id);
    if (!conversation) return;

    await db
      .update(conversations)
      .set(
        conversation.userAId === actor.id
          ? { readAtA: new Date() }
          : { readAtB: new Date() },
      )
      .where(eq(conversations.id, conversationId));

    revalidatePath("/tin-nhan");
  } catch {
    // Đánh dấu đã đọc hỏng thì không nên làm hỏng cả khung chat.
  }
}

/* ------------------------------------------------------------------ */
/* Xoa tin nhan cua chinh minh                                         */
/* ------------------------------------------------------------------ */

export async function deleteMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const messageId = String(formData.get("messageId") ?? "");
    if (!messageId) return failure("Yêu cầu không hợp lệ.");

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
      columns: { id: true, senderId: true, conversationId: true },
    });

    if (!message) return failure("Không tìm thấy tin nhắn.");
    if (message.senderId !== actor.id) {
      return failure("Bạn chỉ xoá được tin nhắn của chính mình.");
    }

    await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.id, messageId));

    revalidatePath(`/tin-nhan/${message.conversationId}`);
    return success("Đã xoá tin nhắn.");
  });
}
