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
