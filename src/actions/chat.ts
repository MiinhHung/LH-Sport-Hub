"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
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
import { deleteImage, uploadImage } from "@/lib/storage";
import { isUuid } from "@/lib/validation";
import { failure, runAction, success, type ActionState } from "./types";

/** Thư mục chứa ảnh chat trong kho — dùng chung cho upload và xoá. */
const CHAT_IMAGE_FOLDER = "chat";

/** Cắt bớt để làm dòng xem trước trong danh sách. */
function preview(text: string, max = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** Dòng xem trước cho một tin: chữ nếu có, không thì ghi chú là ảnh. */
function previewOf(m: { content: string; imageUrl: string | null }) {
  if (m.content) return preview(m.content);
  return m.imageUrl ? "Đã gửi một ảnh" : null;
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

    if (!isUuid(partnerId)) return failure("Yêu cầu không hợp lệ.");
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

    // Kiểm tra dạng uuid trước khi hỏi database — chuỗi lạ sẽ làm Postgres
    // ném lỗi cú pháp thay vì một câu báo tử tế.
    if (!isUuid(conversationId)) return failure("Yêu cầu không hợp lệ.");
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

    // Người nhận đã bị khoá tài khoản thì không nhắn tiếp được nữa.
    const recipientId =
      conversation.userAId === actor.id
        ? conversation.userBId
        : conversation.userAId;
    const recipient = await db.query.profiles.findFirst({
      where: eq(profiles.id, recipientId),
      columns: { status: true },
    });
    if (!recipient || recipient.status !== "active") {
      return failure(
        "Tài khoản này đang bị tạm khoá nên không nhận được tin nhắn.",
      );
    }

    // Upload trước, ngoài transaction: gọi mạng không nên giữ khoá database.
    const image =
      hasImage && imageFile instanceof File
        ? await uploadImage(imageFile, CHAT_IMAGE_FOLDER, "post")
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
          lastMessagePreview: content ? preview(content) : "Đã gửi một ảnh",
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
    if (!isUuid(conversationId)) return { ok: false, messages: [] };
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
    if (!isUuid(conversationId)) return { ok: false };
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
    if (!isUuid(messageId)) return failure("Yêu cầu không hợp lệ.");

    const message = await db.query.messages.findFirst({
      where: and(eq(messages.id, messageId), isNull(messages.deletedAt)),
      columns: {
        id: true,
        senderId: true,
        conversationId: true,
        imageUrl: true,
      },
    });

    if (!message) return failure("Không tìm thấy tin nhắn.");
    if (message.senderId !== actor.id) {
      return failure("Bạn chỉ xoá được tin nhắn của chính mình.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(messages)
        .set({ deletedAt: new Date() })
        .where(eq(messages.id, messageId));

      // Tính lại dòng xem trước từ tin còn lại mới nhất — không thì nội
      // dung vừa xoá vẫn nằm trong danh sách cuộc trò chuyện của cả hai.
      // Mốc thời gian cũng lùi về tin đó, để phép tính "chưa đọc" (so mốc
      // đã đọc với lastMessageAt) không báo nhầm tin cũ là chưa đọc.
      const latest = await tx.query.messages.findFirst({
        where: and(
          eq(messages.conversationId, message.conversationId),
          isNull(messages.deletedAt),
        ),
        orderBy: [desc(messages.createdAt)],
        columns: {
          senderId: true,
          content: true,
          imageUrl: true,
          createdAt: true,
        },
      });

      await tx
        .update(conversations)
        .set(
          latest
            ? {
                lastMessagePreview: previewOf(latest),
                lastSenderId: latest.senderId,
                lastMessageAt: latest.createdAt,
              }
            : { lastMessagePreview: null, lastSenderId: null },
        )
        .where(eq(conversations.id, message.conversationId));
    });

    // Xoá ảnh sau khi database đã xong: ảnh mồ côi thì vô hại, còn tin
    // trỏ vào ảnh đã mất thì hiện ô vỡ. Lỗi xoá ảnh chỉ ghi log.
    if (message.imageUrl) {
      await deleteImage(message.imageUrl, CHAT_IMAGE_FOLDER);
    }

    revalidatePath(`/tin-nhan/${message.conversationId}`);
    return success("Đã xoá tin nhắn.");
  });
}
