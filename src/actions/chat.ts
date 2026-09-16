"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { conversations, messages, profiles } from "@/db/schema";
import { requireActor } from "@/lib/auth";
import {
  getConversation,
  isParticipant,
  listMessagesSince,
  pairKey,
  toPayload,
  type ChatMessagePayload,
} from "@/lib/chat";
import { LIMITS } from "@/lib/constants";
import { uploadImage } from "@/lib/storage";
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

    const imageFile = formData.get("image");
    const hasImage = imageFile instanceof File && imageFile.size > 0;

    if (!conversationId) return failure("Yêu cầu không hợp lệ.");
    // Tin nhắn chỉ có ảnh cũng hợp lệ.
    if (!content && !hasImage) return failure("Chưa nhập nội dung.");
    if (content.length > LIMITS.commentContent) {
      return failure(`Tin nhắn tối đa ${LIMITS.commentContent} ký tự.`);
    }

    // Đọc qua getConversation để tận dụng luôn bước kiểm tra người gửi
    // có thuộc cuộc trò chuyện hay không.
    const conversation = await getConversation(conversationId, actor.id);
    if (!conversation) {
      return failure("Bạn không ở trong cuộc trò chuyện này.");
    }

    // Upload trước, ngoài transaction: gọi mạng không nên giữ khoá database.
    const image =
      hasImage && imageFile instanceof File
        ? await uploadImage(imageFile, "chat", "post")
        : null;

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(messages).values({
        conversationId,
        senderId: actor.id,
        content,
        imageUrl: image?.url ?? null,
        imageWidth: image?.width ?? null,
        imageHeight: image?.height ?? null,
      });

      await tx
        .update(conversations)
        .set({
          lastMessageAt: now,
          lastMessagePreview: content ? preview(content) : "📷 Hình ảnh",
          lastSenderId: actor.id,
          // Người gửi thì hiển nhiên đã đọc tới đây.
          ...(conversation.userAId === actor.id
            ? { readAtA: now }
            : { readAtB: now }),
        })
        .where(eq(conversations.id, conversationId));
    });

    // Không revalidate: khung chat tự quản lý danh sách tin ở phía máy
    // người dùng và tự hỏi tin mới. Revalidate ở đây sẽ dựng lại route
    // đang mở sau mỗi tin nhắn — vừa chậm, vừa gây vòng lặp gắn lại.
    // Trang danh sách /tin-nhan là route động nên vào lại là đã mới.
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
    if (!(await isParticipant(conversationId, actor.id))) {
      return { ok: false, messages: [] };
    }

    const since = new Date(sinceIso);
    if (Number.isNaN(since.getTime())) return { ok: false, messages: [] };

    const rows = await listMessagesSince(conversationId, since);
    return { ok: true, messages: rows.map(toPayload) };
  } catch {
    return { ok: false, messages: [] };
  }
}


/* ------------------------------------------------------------------ */
/* Danh dau da doc                                                     */
/* ------------------------------------------------------------------ */

/**
 * CỐ Ý KHÔNG gọi revalidatePath ở đây.
 *
 * Hàm này chạy từ trong trang /tin-nhan/[id]. Gọi revalidatePath("/tin-nhan")
 * sẽ làm Next dựng lại cây route đang mở, component chat gắn lại, effect
 * chạy lại, lại gọi hàm này — thành vòng lặp tự nuôi, bắn request liên tục
 * và làm hỏng phản hồi của các server action khác.
 *
 * Đổi lại, chấm báo tin chưa đọc trên thanh trên sẽ cập nhật ở lần chuyển
 * trang kế tiếp chứ không tức thì. Đánh đổi này rẻ hơn nhiều so với vòng lặp.
 */
export async function markConversationReadAction(
  conversationId: string,
): Promise<{ ok: boolean }> {
  try {
    const actor = await requireActor();

    // Chỉ cần biết mình là bên A hay B — không cần kéo theo hồ sơ hai người.
    const row = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      columns: { id: true, userAId: true, userBId: true },
    });

    if (!row) return { ok: false };
    if (row.userAId !== actor.id && row.userBId !== actor.id) {
      return { ok: false };
    }

    await db
      .update(conversations)
      .set(
        row.userAId === actor.id
          ? { readAtA: new Date() }
          : { readAtB: new Date() },
      )
      .where(eq(conversations.id, conversationId));

    return { ok: true };
  } catch {
    // Đánh dấu đã đọc hỏng thì không nên làm hỏng cả khung chat.
    return { ok: false };
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
