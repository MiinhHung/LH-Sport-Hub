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
import { docXemTruoc, taiAnhXemTruoc } from "@/lib/link-preview";
import { notify } from "@/lib/notifications";
import { deleteImage, uploadImage, type UploadedImage } from "@/lib/storage";
import {
  commentSchema,
  fieldErrors,
  formDataToObject,
  isUuid,
  postSchema,
  reactionSchema,
  xemTruocLinkSchema,
} from "@/lib/validation";
import { failure, runAction, success, type ActionState } from "./types";

function revalidateFeed() {
  revalidatePath("/bang-tin");
}

/** Cắt ngắn để nhét vào tiêu đề thông báo. */
function excerpt(text: string, max = 70) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/* ------------------------------------------------------------------ */
/* Xem truoc link                                                      */
/* ------------------------------------------------------------------ */

export type KetQuaXemTruoc =
  | { ok: true; url: string; tieuDe: string; moTa: string | null; anhNguon: string | null; ten: string }
  | { ok: false; loi: string };

/**
 * Đọc thông tin một đường dẫn để dựng thẻ xem trước lúc soạn bài.
 *
 * ĐÒI ĐĂNG NHẬP, dù chỉ là đọc. Thiếu `requireActor` thì đây thành một
 * điểm cho người lạ sai máy chủ mình đi tải bất kỳ địa chỉ nào — chính
 * là thứ mà phần chặn SSRF trong `link-preview.ts` đang cố ngăn. Chặn
 * địa chỉ nội bộ là lớp hai; lớp một là chỉ người trong team gọi được.
 */
export async function xemTruocLinkAction(
  url: string,
): Promise<KetQuaXemTruoc> {
  try {
    await requireActor();

    const parsed = xemTruocLinkSchema.safeParse({ url });
    if (!parsed.success) {
      return { ok: false, loi: "Đường dẫn không đúng định dạng." };
    }

    const d = await docXemTruoc(parsed.data.url);
    return { ok: true, ...d };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, loi: error.message };
    console.error("[link] xem trước thất bại:", error);
    return { ok: false, loi: "Không đọc được trang này." };
  }
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
    if (raw.linkUrl === "") raw.linkUrl = null;

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

    /*
      BÀI DẠNG LINK: ĐỌC LẠI Ở SERVER, KHÔNG TIN THỨ TRÌNH DUYỆT GỬI LÊN.

      Ô soạn bài có gọi `xemTruocLinkAction` để hiện thẻ xem trước, nhưng
      kết quả đó CHỈ để người đăng nhìn. Nếu nhận thẳng tiêu đề và ảnh từ
      form thì ai cũng gửi được một bài mang tiêu đề "Thông báo của ban
      quản trị" kèm ảnh bất kỳ, trỏ về một trang khác hẳn.

      Chỉ `linkUrl` là dữ liệu từ người dùng. Mọi thứ còn lại server tự
      đi đọc lại.
    */
    let link: {
      url: string;
      tieuDe: string;
      moTa: string | null;
      anh: string | null;
      ten: string;
    } | null = null;

    /*
      Từ đây trở xuống mà hỏng (đọc link lỗi, transaction lỗi) thì ảnh đã
      upload ở trên thành rác không ai trỏ tới — dọn hết trước khi ném lỗi.
    */
    const donAnh = async () => {
      const urls = uploaded.map((u) => u.url);
      if (link?.anh) urls.push(link.anh);
      await Promise.all(
        urls.map((url) =>
          deleteImage(url).catch((e) =>
            console.error("[post] không dọn được ảnh:", e),
          ),
        ),
      );
    };

    let postId: string;
    try {
      if (input.type === "link" && input.linkUrl) {
        const d = await docXemTruoc(input.linkUrl);
        let anh: string | null = null;

        if (d.anhNguon) {
          // Ảnh xem trước là thứ "có thì tốt": trang kia chậm hay chặn thì
          // bài vẫn đăng được, chỉ là thẻ không có ảnh.
          const tep = await taiAnhXemTruoc(d.anhNguon);
          if (tep) {
            try {
              anh = (await uploadImage(tep, "links", "post")).url;
            } catch (error) {
              console.error("[link] không lưu được ảnh xem trước:", error);
            }
          }
        }

        link = { url: d.url, tieuDe: d.tieuDe, moTa: d.moTa, anh, ten: d.ten };
      }

      postId = await db.transaction(async (tx) => {
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
            linkUrl: link?.url ?? null,
            linkTitle: link?.tieuDe ?? null,
            linkDesc: link?.moTa ?? null,
            linkImage: link?.anh ?? null,
            linkSite: link?.ten ?? null,
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
              title: `${actor.fullName} có thông báo mới`,
              message: excerpt(input.content, 120),
              href: "/bang-tin",
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
    } catch (error) {
      await donAnh();
      throw error;
    }

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
    if (!isUuid(postId)) return failure("Yêu cầu không hợp lệ.");

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
    if (!isUuid(postId)) return failure("Yêu cầu không hợp lệ.");

    // Lật cờ ngay trong một câu UPDATE: đọc rồi mới ghi thì hai người bấm
    // cùng lúc sẽ cùng đọc "chưa ghim" và cùng ghi "ghim" — bấm hai lần
    // mà bài vẫn ghim.
    const [post] = await db
      .update(posts)
      .set({ isPinned: sql`not ${posts.isPinned}`, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning({ isPinned: posts.isPinned });
    if (!post) return failure("Không tìm thấy bài viết.");

    await audit(db, {
      actorId: actor.id,
      action: post.isPinned ? "post.pin" : "post.unpin",
      targetType: "post",
      targetId: postId,
    });

    revalidateFeed();
    return success(post.isPinned ? "Đã ghim lên đầu." : "Đã bỏ ghim.");
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
    const { postId, content, parentId } = parsed.data;

    await db.transaction(async (tx) => {
      const post = await tx.query.posts.findFirst({
        where: and(eq(posts.id, postId), isNull(posts.deletedAt)),
        columns: { id: true, authorId: true, content: true, status: true },
      });
      if (!post || post.status !== "published") {
        throw new AppError("Bài viết này không còn nữa.");
      }

      /*
        Trả lời: bình luận cha phải còn, và cùng bài. CHỈ MỘT TẦNG — trả
        lời vào một câu trả lời thì gắn vào bình luận gốc của nó, nên giao
        diện không bao giờ phải thụt vào mãi.
      */
      let cha: { id: string; authorId: string } | null = null;
      if (parentId) {
        const p = await tx.query.comments.findFirst({
          where: and(
            eq(comments.id, parentId),
            eq(comments.postId, postId),
            eq(comments.status, "published"),
            isNull(comments.deletedAt),
          ),
          columns: { id: true, authorId: true, parentId: true },
        });
        if (!p) throw new AppError("Bình luận bạn trả lời không còn nữa.");
        cha = { id: p.parentId ?? p.id, authorId: p.authorId };
      }

      await tx.insert(comments).values({
        postId,
        authorId: actor.id,
        parentId: cha?.id ?? null,
        content,
      });

      await tx
        .update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, postId));

      // Người được trả lời nhận "trả lời bình luận"; chủ bài vẫn nhận
      // "bình luận bài" như cũ — trừ khi hai người là một.
      if (cha && cha.authorId !== actor.id) {
        await notify(tx, {
          recipientId: cha.authorId,
          actorId: actor.id,
          type: "comment_reply",
          title: `${actor.fullName} trả lời bình luận của bạn`,
          message: excerpt(content),
          href: "/bang-tin",
        });
      }
      if (!cha || cha.authorId !== post.authorId) {
        await notify(tx, {
          recipientId: post.authorId,
          actorId: actor.id,
          type: "post_comment",
          title: `${actor.fullName} bình luận bài của bạn`,
          message: excerpt(content),
          href: "/bang-tin",
        });
      }
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
    if (!isUuid(commentId)) return failure("Yêu cầu không hợp lệ.");

    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, authorId: true, postId: true, status: true },
    });
    if (!comment) return failure("Không tìm thấy bình luận.");
    if (comment.status === "deleted") return failure("Bình luận đã bị xoá.");

    if (comment.authorId !== actor.id && !isModerator(actor)) {
      return failure("Bạn chỉ xoá được bình luận của chính mình.");
    }

    const daXoa = await db.transaction(async (tx) => {
      /*
        Điều kiện `status <> 'deleted'` nằm NGAY TRONG câu UPDATE: hai lần
        xoá chạy song song thì chỉ một lần nhận về dòng, lần kia trả rỗng
        và không trừ bộ đếm thêm lần nữa. Kiểm ở trên chỉ để báo lỗi sớm.
      */
      const [deleted] = await tx
        .update(comments)
        .set({
          status: "deleted",
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(comments.id, commentId), ne(comments.status, "deleted")))
        .returning({ id: comments.id });
      if (!deleted) return false;

      // GREATEST giữ bộ đếm không bao giờ âm.
      await tx
        .update(posts)
        .set({
          commentCount: sql`greatest(${posts.commentCount} - 1, 0)`,
        })
        .where(eq(posts.id, comment.postId));
      return true;
    });
    if (!daXoa) return failure("Bình luận đã bị xoá.");

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
      /*
        Kiểm đích còn sống trước khi đụng tới bộ đếm hay bắn thông báo.
        Thiếu bước này thì một bài đã xoá (hoặc bị ẩn) vẫn bị thả tim,
        bộ đếm vẫn nhảy và tác giả vẫn nhận thông báo về một bài không còn.
      */
      let post: { authorId: string; content: string } | undefined;
      if (targetType === "post") {
        post = await tx.query.posts.findFirst({
          where: and(
            eq(posts.id, targetId),
            eq(posts.status, "published"),
            isNull(posts.deletedAt),
          ),
          columns: { authorId: true, content: true },
        });
        if (!post) throw new AppError("Bài viết này không còn nữa.");
      } else {
        const comment = await tx.query.comments.findFirst({
          where: and(
            eq(comments.id, targetId),
            ne(comments.status, "deleted"),
          ),
          columns: { id: true },
        });
        if (!comment) throw new AppError("Bình luận này không còn nữa.");
      }

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

      /*
        Lần thả ĐẦU TIÊN thì chưa có dòng nào để FOR UPDATE khoá, nên hai
        cú bấm song song đều đi tới đây. ON CONFLICT DO NOTHING để cú thứ
        hai lặng lẽ bỏ qua thay vì nổ lỗi trùng khoá — và chỉ cú nào thực
        sự chèn được dòng mới được cộng bộ đếm, bắn thông báo.
      */
      const [inserted] = await tx
        .insert(reactions)
        .values({
          userId: actor.id,
          targetType,
          targetId,
          type: type as ReactionKey,
        })
        .onConflictDoNothing({
          target: [reactions.userId, reactions.targetType, reactions.targetId],
        })
        .returning({ id: reactions.id });
      if (!inserted) return;

      if (targetType === "post") {
        await tx
          .update(posts)
          .set({ reactionCount: sql`${posts.reactionCount} + 1` })
          .where(eq(posts.id, targetId));

        if (post) {
          await notify(tx, {
            recipientId: post.authorId,
            actorId: actor.id,
            type: "post_reaction",
            title: `${actor.fullName} đã thả “${REACTIONS[type as ReactionKey].label}” vào bài của bạn`,
            message: excerpt(post.content),
            href: "/bang-tin",
          });
        }
      }
    });

    // Cố ý KHÔNG revalidate ở đây: giao diện đã tự cập nhật ngay khi bấm,
    // còn revalidate sẽ dựng lại toàn bộ bảng tin cho mỗi lần thả tim.
    return success();
  });
}

