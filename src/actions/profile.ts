"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireActor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deleteImage, uploadImage } from "@/lib/storage";
import { fieldErrors, formDataToObject, profileSchema } from "@/lib/validation";
import { failure, runAction, success, type ActionState } from "./types";

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const parsed = profileSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Hồ sơ chưa hợp lệ.", fieldErrors(parsed.error));
    }
    const input = parsed.data;

    const avatar = formData.get("avatar");
    let avatarUrl = actor.avatarUrl;
    let replaced: string | null = null;
    if (avatar instanceof File && avatar.size > 0) {
      replaced = actor.avatarUrl;
      avatarUrl = (await uploadImage(avatar, "avatars", "avatar")).url;
    }

    /*
      ẢNH MÃ QR NHẬN TIỀN.

      BA trạng thái, không phải hai: giữ nguyên, thay ảnh mới, hoặc gỡ
      hẳn. Thiếu đường gỡ thì ai lỡ tải nhầm ảnh — hoặc đổi ngân hàng —
      sẽ kẹt với một mã QR sai mà không cách nào bỏ, và tiền của người
      khác đi nhầm chỗ.

      Dùng preset "proof" chứ không phải "avatar": avatar nén cạnh dài
      về 512px, mà mã QR cần đủ nét để quét được. `proof` giữ 1400px.
    */
    const qr = formData.get("qr");
    const xoaQr = formData.get("xoaQr") === "1";
    let qrUrl = actor.qrUrl;
    let qrCu: string | null = null;

    if (qr instanceof File && qr.size > 0) {
      qrCu = actor.qrUrl;
      qrUrl = (await uploadImage(qr, "qr", "proof")).url;
    } else if (xoaQr) {
      qrCu = actor.qrUrl;
      qrUrl = null;
    }

    await db
      .update(profiles)
      .set({
        fullName: input.fullName,
        department: input.department,
        skillLevel: input.skillLevel as never,
        bio: input.bio,
        avatarUrl,
        qrUrl,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, actor.id));

    // Xoá ảnh cũ sau khi đã lưu, để lưu lỗi thì avatar không thành link chết.
    if (replaced) void deleteImage(replaced, "avatars");
    if (qrCu) void deleteImage(qrCu, "qr");

    await audit(db, {
      actorId: actor.id,
      action: "profile.update",
      targetType: "profile",
      targetId: actor.id,
    });

    revalidatePath("/ho-so");
    revalidatePath("/keo");
    revalidatePath("/thanh-vien");
    return success("Đã lưu hồ sơ.");
  });
}
