"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { playSessionAttendees, playSessions, profiles } from "@/db/schema";
import { AppError, isModerator, requireActor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { SPORTS, type SportKey } from "@/lib/constants";
import { notify } from "@/lib/notifications";
import {
  fieldErrors,
  formDataToObject,
  playSessionEditSchema,
  playSessionSchema,
} from "@/lib/validation";
import { formatDateTime } from "@/lib/utils";
import { failure, runAction, success, type ActionState } from "./types";

function revalidateSessions(id?: string) {
  revalidatePath("/buoi-tap");
  revalidatePath("/keo");
  if (id) revalidatePath(`/buoi-tap/${id}`);
}

/* ------------------------------------------------------------------ */
/* Tao buoi tap                                                        */
/* ------------------------------------------------------------------ */

export async function createSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let createdId: string | null = null;

  const result = await runAction(async () => {
    const actor = await requireActor();

    const parsed = playSessionSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Buổi tập chưa hợp lệ.", fieldErrors(parsed.error));
    }
    const input = parsed.data;

    const sessionId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(playSessions)
        .values({
          creatorId: actor.id,
          sport: input.sport as never,
          title: input.title,
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          mapUrl: input.mapUrl,
          showMap: input.showMap,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          maxPlayers: input.maxPlayers,
          costTotal: input.costTotal,
          notes: input.notes,
          status: "open",
        })
        .returning({ id: playSessions.id });

      // Người tạo mặc định là có đi.
      await tx.insert(playSessionAttendees).values({
        sessionId: created.id,
        userId: actor.id,
        status: "going",
      });

      // Báo cho cả team — đây là sự kiện chung, ai cũng muốn biết.
      const members = await tx
        .select({ id: profiles.id })
        .from(profiles)
        .where(
          and(eq(profiles.status, "active"), ne(profiles.id, actor.id)),
        );

      const sportLabel = SPORTS[input.sport as SportKey].label;

      await notify(
        tx,
        members.map((m) => ({
          recipientId: m.id,
          actorId: actor.id,
          type: "session_created" as const,
          title: `${actor.fullName} mở buổi ${sportLabel.toLowerCase()}: ${input.title}`,
          message: `${formatDateTime(input.startsAt)} • ${input.venueName}`,
          href: `/buoi-tap/${created.id}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "session.create",
        targetType: "play_session",
        targetId: created.id,
        metadata: { sport: input.sport },
      });

      return created.id;
    });

    createdId = sessionId;
    revalidateSessions(sessionId);
    return success("Đã tạo buổi tập.");
  });

  if (createdId) redirect(`/buoi-tap/${createdId}`);
  return result;
}

/* ------------------------------------------------------------------ */
/* Sua buoi tap                                                        */
/* ------------------------------------------------------------------ */

/** Cho phép lệch 5 phút giữa đồng hồ máy và đồng hồ máy chủ. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Sửa buổi tập đã tạo.
 *
 * TRƯỚC ĐÂY CHỈ CÓ HUỶ VÀ XOÁ. Sân báo đổi giờ, hay gõ nhầm tên sân,
 * thì cách duy nhất là xoá đi tạo lại — mà xoá thì mất sạch danh sách
 * người đã nhận đi, và ai cũng nhận một thông báo "buổi tập đã bị xoá"
 * rồi phải vào bấm đi lại từ đầu.
 *
 * Người đã nhận đi được báo khi giờ hoặc sân đổi, nhưng KHÔNG báo khi
 * chỉ sửa ghi chú hay tiền sân: một cái chuông cho mỗi lần sửa chính
 * tả thì chẳng mấy mà không ai thèm đọc thông báo nữa.
 */
export async function updateSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let updatedId: string | null = null;

  const result = await runAction(async () => {
    const actor = await requireActor();

    const parsed = playSessionEditSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Buổi tập chưa hợp lệ.", fieldErrors(parsed.error));
    }
    const input = parsed.data;

    const session = await db.query.playSessions.findFirst({
      where: eq(playSessions.id, input.sessionId),
    });
    if (!session) return failure("Không tìm thấy buổi tập.");

    // Kiểm quyền ở server, không chỉ ẩn nút ở trang.
    if (session.creatorId !== actor.id && !isModerator(actor)) {
      return failure("Chỉ người tạo buổi tập mới sửa được.");
    }

    if (session.status === "cancelled") {
      return failure(
        "Buổi tập đã huỷ thì không sửa được nữa. Muốn đánh lại thì tạo buổi mới.",
      );
    }

    // Chỉ chặn khi THẬT SỰ dời giờ. Buổi hôm qua vẫn phải sửa được —
    // thường là để điền đúng tiền sân sau khi đánh xong.
    const doiGioBatDau =
      input.startsAt.getTime() !== session.startsAt.getTime();

    if (doiGioBatDau && input.startsAt.getTime() < Date.now() - CLOCK_SKEW_MS) {
      return failure("Không thể dời buổi tập về quá khứ.", {
        startsAt: "Không thể dời buổi tập về quá khứ.",
      });
    }

    const going = await db
      .select({ userId: playSessionAttendees.userId })
      .from(playSessionAttendees)
      .where(
        and(
          eq(playSessionAttendees.sessionId, input.sessionId),
          eq(playSessionAttendees.status, "going"),
        ),
      );

    // Hạ giới hạn xuống dưới số người đã nhận đi thì ai là người bị
    // đẩy ra? Không có câu trả lời tử tế nào, nên chặn luôn.
    if (input.maxPlayers !== null && input.maxPlayers < going.length) {
      const loi = `Đã có ${going.length} người nhận đi, không hạ giới hạn xuống ${input.maxPlayers} được.`;
      return failure(loi, { maxPlayers: loi });
    }

    const doiCho = session.venueName !== input.venueName;
    const doiGio =
      doiGioBatDau || input.endsAt.getTime() !== session.endsAt.getTime();

    await db.transaction(async (tx) => {
      await tx
        .update(playSessions)
        .set({
          sport: input.sport as never,
          title: input.title,
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          mapUrl: input.mapUrl,
          showMap: input.showMap,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          maxPlayers: input.maxPlayers,
          costTotal: input.costTotal,
          notes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(playSessions.id, input.sessionId));

      if (doiGio || doiCho) {
        const doi = [
          doiGio ? formatDateTime(input.startsAt) : null,
          doiCho ? input.venueName : null,
        ]
          .filter(Boolean)
          .join(" • ");

        await notify(
          tx,
          going
            .filter((a) => a.userId !== actor.id)
            .map((a) => ({
              recipientId: a.userId,
              actorId: actor.id,
              type: "session_updated" as const,
              title: `Buổi "${input.title}" vừa đổi ${
                doiGio && doiCho ? "giờ và sân" : doiGio ? "giờ" : "sân"
              }`,
              message: doi,
              href: `/buoi-tap/${input.sessionId}`,
            })),
        );
      }

      await audit(tx, {
        actorId: actor.id,
        action: "session.update",
        targetType: "play_session",
        targetId: input.sessionId,
        metadata: {
          doiGio,
          doiCho,
          byModerator: session.creatorId !== actor.id,
        },
      });
    });

    updatedId = input.sessionId;
    revalidateSessions(input.sessionId);
    return success("Đã lưu buổi tập.");
  });

  if (updatedId) redirect(`/buoi-tap/${updatedId}`);
  return result;
}

/* ------------------------------------------------------------------ */
/* Di / khong di                                                       */
/* ------------------------------------------------------------------ */

export async function setAttendanceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const sessionId = String(formData.get("sessionId") ?? "");
    const answer = String(formData.get("answer") ?? "");

    if (!sessionId || (answer !== "going" && answer !== "not_going")) {
      return failure("Yêu cầu không hợp lệ.");
    }

    const outcome = await db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(playSessions)
        .where(eq(playSessions.id, sessionId))
        .for("update");

      if (!session) throw new AppError("Không tìm thấy buổi tập.");
      if (session.status !== "open") {
        return { error: "Buổi tập này đã đóng." };
      }
      if (session.endsAt.getTime() < Date.now()) {
        return { error: "Buổi tập đã kết thúc." };
      }

      if (answer === "going" && session.maxPlayers !== null) {
        const [{ value: going }] = await tx
          .select({ value: count() })
          .from(playSessionAttendees)
          .where(
            and(
              eq(playSessionAttendees.sessionId, sessionId),
              eq(playSessionAttendees.status, "going"),
              ne(playSessionAttendees.userId, actor.id),
            ),
          );

        if (going >= session.maxPlayers) {
          return { error: "Buổi tập đã đủ người." };
        }
      }

      const now = new Date();

      await tx
        .insert(playSessionAttendees)
        .values({ sessionId, userId: actor.id, status: answer })
        .onConflictDoUpdate({
          target: [
            playSessionAttendees.sessionId,
            playSessionAttendees.userId,
          ],
          set: { status: answer, updatedAt: now },
        });

      if (answer === "going") {
        await notify(tx, {
          recipientId: session.creatorId,
          actorId: actor.id,
          type: "session_joined",
          title: `${actor.fullName} sẽ đi "${session.title}"`,
          href: `/buoi-tap/${sessionId}`,
        });
      }

      await audit(tx, {
        actorId: actor.id,
        action: "session.attendance",
        targetType: "play_session",
        targetId: sessionId,
        metadata: { answer },
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateSessions(sessionId);
    return success(answer === "going" ? "Đã ghi nhận: bạn đi." : "Đã ghi nhận: bạn không đi.");
  });
}

/* ------------------------------------------------------------------ */
/* Xoa han buoi tap                                                    */
/* ------------------------------------------------------------------ */

/**
 * Xoá hẳn buổi tập. Danh sách người đi bị xoá theo (cascade), còn kèo
 * đã gắn vào buổi này thì KHÔNG mất — khoá ngoại để `set null`, nên kèo
 * chỉ chuyển thành "đánh lúc nào cũng được".
 */
export async function deleteSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let deleted = false;

  const result = await runAction(async () => {
    const actor = await requireActor();
    const sessionId = String(formData.get("sessionId") ?? "");
    if (!sessionId) return failure("Yêu cầu không hợp lệ.");

    const session = await db.query.playSessions.findFirst({
      where: eq(playSessions.id, sessionId),
      columns: { id: true, title: true, creatorId: true, status: true },
    });

    if (!session) return failure("Không tìm thấy buổi tập.");

    if (session.creatorId !== actor.id && !isModerator(actor)) {
      return failure("Chỉ người tạo buổi tập mới xoá được.");
    }

    const attendees = await db
      .select({ userId: playSessionAttendees.userId })
      .from(playSessionAttendees)
      .where(
        and(
          eq(playSessionAttendees.sessionId, sessionId),
          eq(playSessionAttendees.status, "going"),
        ),
      );

    await db.transaction(async (tx) => {
      // Báo cho người đã nhận đi trước khi bản ghi biến mất.
      await notify(
        tx,
        attendees
          .filter((a) => a.userId !== actor.id)
          .map((a) => ({
            recipientId: a.userId,
            actorId: actor.id,
            type: "session_cancelled" as const,
            title: `Buổi "${session.title}" đã bị xoá`,
            message: "Người tạo đã xoá buổi tập này.",
            href: "/buoi-tap",
          })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "session.delete",
        targetType: "play_session",
        targetId: sessionId,
        metadata: {
          title: session.title,
          attendees: attendees.length,
          byModerator: session.creatorId !== actor.id,
        },
      });

      await tx.delete(playSessions).where(eq(playSessions.id, sessionId));
    });

    deleted = true;
    revalidateSessions(sessionId);
    return success("Đã xoá buổi tập.");
  });

  if (deleted) redirect("/buoi-tap");
  return result;
}

/* ------------------------------------------------------------------ */
/* Huy buoi tap                                                        */
/* ------------------------------------------------------------------ */

export async function cancelSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const sessionId = String(formData.get("sessionId") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();

    if (!sessionId) return failure("Yêu cầu không hợp lệ.");
    if (reason.length > 300) return failure("Lý do tối đa 300 ký tự.");

    const outcome = await db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(playSessions)
        .where(eq(playSessions.id, sessionId))
        .for("update");

      if (!session) throw new AppError("Không tìm thấy buổi tập.");
      if (session.status === "cancelled") {
        return { error: "Buổi tập đã bị huỷ rồi." };
      }
      if (session.creatorId !== actor.id && !isModerator(actor)) {
        return { error: "Chỉ người tạo hoặc ban quản trị mới huỷ được." };
      }

      const now = new Date();

      await tx
        .update(playSessions)
        .set({
          status: "cancelled",
          cancellationReason: reason || null,
          cancelledAt: now,
          updatedAt: now,
        })
        .where(eq(playSessions.id, sessionId));

      const attendees = await tx
        .select({ userId: playSessionAttendees.userId })
        .from(playSessionAttendees)
        .where(
          and(
            eq(playSessionAttendees.sessionId, sessionId),
            eq(playSessionAttendees.status, "going"),
          ),
        );

      await notify(
        tx,
        attendees.map((a) => ({
          recipientId: a.userId,
          actorId: actor.id,
          type: "session_cancelled" as const,
          title: `Buổi "${session.title}" đã bị huỷ`,
          message: reason || null,
          href: `/buoi-tap/${sessionId}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "session.cancel",
        targetType: "play_session",
        targetId: sessionId,
        metadata: { reason },
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateSessions(sessionId);
    return success("Đã huỷ buổi tập.");
  });
}
