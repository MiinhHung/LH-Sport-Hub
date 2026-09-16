"use server";

import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { comments, postMedia, posts, profiles, reactions } from "@/db/schema";
import { AppError, isModerator, requireActor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  MAX_POST_IMAGES,
  REACTIONS,
  type PostTypeKey,
  type ReactionKey,
} from "@/lib/constants";
import { notify } from "@/lib/notifications";
import { deleteImage, uploadImage, type UploadedImage } from "@/lib/storage";
import {
  commentSchema,
  fieldErrors,
  formDataToObject,
  postSchema,
  reactionSchema,
} from "@/lib/validation";
import { failure, runAction, success, type ActionState } from "./types";

function revalidateFeed() {
  revalidatePath("/");
}

/** Cắt ngắn để nhét vào tiêu đề thông báo. */
function excerpt(text: string, max = 70) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/* ------------------------------------------------------------------ */
/* Dang bai                                                            */
/* ------------------------------------------------------------------ */

export async function createPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const raw = formDataToObject(formData);
    if (raw.challengeId === "") raw.challengeId = null;
    if (raw.sessionId === "") raw.sessionId = null;

    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) {
      return failure("Bài viết chưa hợp lệ.", fieldErrors(parsed.error));
    }
    const input = parsed.data;

    // Chỉ ban quản trị mới đăng được loại "thông báo" — nó bắn tin cho cả team.
    if (input.type === "announcement" && !isModerator(actor)) {
      return failure("Chỉ ban quản trị mới đăng thông báo được.");
    }

    const files = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length > MAX_POST_IMAGES) {
      return failure(`Tối đa ${MAX_POST_IMAGES} ảnh mỗi bài.`);
    }

    // Upload trước, ngoài transaction: gọi mạng không nên giữ khoá database.
    const uploaded: UploadedImage[] = [];
    try {
      for (const file of files) {
        uploaded.push(await uploadImage(file, "posts", "post"));
      }
    } catch (error) {
      // Dọn những ảnh đã lên trước khi lỗi, tránh rác trong storage.
      await Promise.all(uploaded.map((u) => deleteImage(u.url)));
      throw error;
    }

    const postId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(posts)
        .values({
          authorId: actor.id,
          content: input.content,
          type: (uploaded.length > 0 && input.type === "text"
            ? "image"
            : input.type) as PostTypeKey,
          challengeId: input.challengeId,
          sessionId: input.sessionId,
        })
        .returning({ id: posts.id });

      if (uploaded.length > 0) {
        await tx.insert(postMedia).values(
          uploaded.map((u, i) => ({
            postId: created.id,
            url: u.url,
            width: u.width,
            height: u.height,
            fileSize: u.fileSize,
            sortOrder: i,
          })),
        );
      }

      // Thông báo chỉ bắn cho cả team khi là "thông báo" chính thức —
      // bài chém gió thường ngày mà cũng báo thì ai cũng tắt thông báo.
      if (input.type === "announcement") {
        const members = await tx
          .select({ id: profiles.id })
          .from(profiles)
          .where(and(eq(profiles.status, "active"), ne(profiles.id, actor.id)));

        await notify(
          tx,
          members.map((m) => ({
            recipientId: m.id,
            actorId: actor.id,
            type: "post_mention" as const,
            title: `📢 ${actor.fullName} có thông báo`,
            message: excerpt(input.content, 120),
            href: "/",
          })),
        );
      }

      await audit(tx, {
        actorId: actor.id,
        action: "post.create",
        targetType: "post",
        targetId: created.id,
        metadata: { type: input.type, images: uploaded.length },
      });

      return created.id;
    });

    revalidateFeed();
    return success(postId ? "Đã đăng." : "Đã đăng.");
  });
}

/* ------------------------------------------------------------------ */
/* Xoa / an / ghim bai                                                 */
/* ------------------------------------------------------------------ */

export async function deletePostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const postId = String(formData.get("postId") ?? "");
    if (!postId) return failure("Yêu cầu không hợp lệ.");

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { id: true, authorId: true },
    });
    if (!post) return failure("Không tìm thấy bài viết.");

    if (post.authorId !== actor.id && !isModerator(actor)) {
      return failure("Bạn chỉ xoá được bài của chính mình.");
    }

    // Xoá mềm: giữ lại để còn audit, không cắt đứt bình luận đang tham chiếu.
    await db
      .update(posts)
      .set({ status: "deleted", deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(posts.id, postId));

    await audit(db, {
      actorId: actor.id,
      action: "post.delete",
      targetType: "post",
      targetId: postId,
      metadata: { byModerator: post.authorId !== actor.id },
    });

    revalidateFeed();
    return success("Đã xoá bài.");
  });
}

export async function togglePinPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    if (!isModerator(actor)) {
      return failure("Chỉ ban quản trị mới ghim bài được.");
    }

    const postId = String(formData.get("postId") ?? "");
    if (!postId) return failure("Yêu cầu không hợp lệ.");

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { id: true, isPinned: true },
    });
    if (!post) return failure("Không tìm thấy bài viết.");

    await db
      .update(posts)
      .set({ isPinned: !post.isPinned, updatedAt: new Date() })
      .where(eq(posts.id, postId));

    await audit(db, {
      actorId: actor.id,
      action: post.isPinned ? "post.unpin" : "post.pin",
      targetType: "post",
      targetId: postId,
    });

    revalidateFeed();
    return success(post.isPinned ? "Đã bỏ ghim." : "Đã ghim lên đầu.");
  });
}

/* ------------------------------------------------------------------ */
/* Binh luan                                                           */
/* ------------------------------------------------------------------ */

export async function createCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const parsed = commentSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Bình luận chưa hợp lệ.", fieldErrors(parsed.error));
    }
    const { postId, content } = parsed.data;

    await db.transaction(async (tx) => {
      const post = await tx.query.posts.findFirst({
        where: and(eq(posts.id, postId), isNull(posts.deletedAt)),
        columns: { id: true, authorId: true, content: true, status: true },
      });
      if (!post || post.status !== "published") {
        throw new AppError("Bài viết này không còn nữa.");
      }

      await tx.insert(comments).values({
        postId,
        authorId: actor.id,
        content,
      });

      await tx
        .update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, postId));

      await notify(tx, {
        recipientId: post.authorId,
        actorId: actor.id,
        type: "post_comment",
        title: `${actor.fullName} bình luận bài của bạn`,
        message: excerpt(content),
        href: "/",
      });
    });

    revalidateFeed();
    return success();
  });
}

export async function deleteCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const commentId = String(formData.get("commentId") ?? "");
    if (!commentId) return failure("Yêu cầu không hợp lệ.");

    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, authorId: true, postId: true, status: true },
    });
    if (!comment) return failure("Không tìm thấy bình luận.");
    if (comment.status === "deleted") return failure("Bình luận đã bị xoá.");

    if (comment.authorId !== actor.id && !isModerator(actor)) {
      return failure("Bạn chỉ xoá được bình luận của chính mình.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(comments)
        .set({
          status: "deleted",
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      // GREATEST giữ bộ đếm không bao giờ âm nếu có xoá trùng.
      await tx
        .update(posts)
        .set({
          commentCount: sql`greatest(${posts.commentCount} - 1, 0)`,
        })
        .where(eq(posts.id, comment.postId));
    });

    await audit(db, {
      actorId: actor.id,
      action: "comment.delete",
      targetType: "comment",
      targetId: commentId,
      metadata: { byModerator: comment.authorId !== actor.id },
    });

    revalidateFeed();
    return success("Đã xoá bình luận.");
  });
}

/* ------------------------------------------------------------------ */
/* Cam xuc                                                             */
/* ------------------------------------------------------------------ */

/**
 * Bấm loại đang chọn => gỡ. Bấm loại khác => đổi. Chưa có => thêm.
 * Toàn bộ nằm trong transaction để bộ đếm không lệch khi bấm nhanh.
 */
export async function toggleReactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const parsed = reactionSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Yêu cầu không hợp lệ.");
    }
    const { targetType, targetId, type } = parsed.data;

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(reactions)
        .where(
          and(
            eq(reactions.userId, actor.id),
            eq(reactions.targetType, targetType),
            eq(reactions.targetId, targetId),
          ),
        )
        .for("update");

      if (existing?.type === type) {
        await tx.delete(reactions).where(eq(reactions.id, existing.id));
        if (targetType === "post") {
          await tx
            .update(posts)
            .set({ reactionCount: sql`greatest(${posts.reactionCount} - 1, 0)` })
            .where(eq(posts.id, targetId));
        }
        return;
      }

      if (existing) {
        await tx
          .update(reactions)
          .set({ type: type as ReactionKey, createdAt: new Date() })
          .where(eq(reactions.id, existing.id));
        return; // đổi loại thì tổng không đổi
      }

      await tx.insert(reactions).values({
        userId: actor.id,
        targetType,
        targetId,
        type: type as ReactionKey,
      });

      if (targetType === "post") {
        await tx
          .update(posts)
          .set({ reactionCount: sql`${posts.reactionCount} + 1` })
          .where(eq(posts.id, targetId));

        const post = await tx.query.posts.findFirst({
          where: eq(posts.id, targetId),
          columns: { authorId: true, content: true },
        });

        if (post) {
          await notify(tx, {
            recipientId: post.authorId,
            actorId: actor.id,
            type: "post_reaction",
            title: `${actor.fullName} đã thả ${REACTIONS[type as ReactionKey].icon} bài của bạn`,
            message: excerpt(post.content),
            href: "/",
          });
        }
      }
    });

    // Cố ý KHÔNG revalidate ở đây: giao diện đã tự cập nhật ngay khi bấm,
    // còn revalidate sẽ dựng lại toàn bộ bảng tin cho mỗi lần thả tim.
    return success();
  });
}

