"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  challengeParticipants,
  challengeResults,
  challenges,
  playSessions,
  profiles,
} from "@/db/schema";
import { AppError, isModerator, requireActor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  activeParticipants,
  allAccepted,
  canCancel,
  canJoin,
  canLeave,
  canRespondToInvite,
  isFull,
  type ChallengeLike,
  type ParticipantLike,
  type TeamSide,
} from "@/lib/challenge-logic";
import { CHALLENGE_FORMATS, LIMITS, formatStake } from "@/lib/constants";
import { notify } from "@/lib/notifications";
import {
  cancelChallengeSchema,
  challengeEditSchema,
  challengeSchema,
  fieldErrors,
  formDataToObject,
  isUuid,
  joinChallengeSchema,
} from "@/lib/validation";
import { formatDateTime } from "@/lib/utils";
import { failure, runAction, success, type ActionState } from "./types";

/* ------------------------------------------------------------------ */
/* Tien ich dung chung                                                 */
/* ------------------------------------------------------------------ */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Khoá hàng `challenges` rồi đọc lại danh sách người tham gia.
 * Mọi thay đổi chỗ ngồi đều phải đi qua đây, nếu không hai người
 * bấm "Nhận kèo" cùng lúc sẽ cùng chiếm được chỗ cuối.
 */
async function loadLocked(tx: Tx, challengeId: string) {
  const [challenge] = await tx
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .for("update");

  if (!challenge) throw new AppError("Không tìm thấy kèo này.");

  const participants = await tx
    .select()
    .from(challengeParticipants)
    .where(eq(challengeParticipants.challengeId, challengeId));

  return {
    challenge,
    participants,
    asLogic: challenge as unknown as ChallengeLike,
    asParticipants: participants as unknown as ParticipantLike[],
  };
}

/** Sau mỗi thay đổi nhân sự: đủ người + tất cả đã nhận => chốt kèo. */
async function syncLockState(
  tx: Tx,
  challenge: ChallengeLike,
  participants: ParticipantLike[],
): Promise<"locked" | "open" | "unchanged"> {
  const shouldLock = isFull(challenge.format, participants) && allAccepted(participants);

  if (shouldLock && challenge.status === "open") {
    await tx
      .update(challenges)
      .set({ status: "locked", lockedAt: new Date(), updatedAt: new Date() })
      .where(eq(challenges.id, challenge.id));
    return "locked";
  }

  if (!shouldLock && challenge.status === "locked") {
    await tx
      .update(challenges)
      .set({ status: "open", lockedAt: null, updatedAt: new Date() })
      .where(eq(challenges.id, challenge.id));
    return "open";
  }

  return "unchanged";
}

function revalidateChallenge(id?: string) {
  revalidatePath("/keo");
  revalidatePath("/bang-phong-than");
  if (id) revalidatePath(`/keo/${id}`);
}

/* ------------------------------------------------------------------ */
/* Tao keo                                                             */
/* ------------------------------------------------------------------ */

export async function createChallengeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let createdId: string | null = null;

  const result = await runAction(async () => {
    const actor = await requireActor();

    const raw = formDataToObject(formData);
    // Multi-select gửi 1 giá trị thì formDataToObject trả về chuỗi.
    if (typeof raw.opponentIds === "string") {
      raw.opponentIds = raw.opponentIds === "" ? [] : [raw.opponentIds];
    }
    if (raw.opponentIds === undefined) raw.opponentIds = [];
    if (raw.partnerId === "") raw.partnerId = null;
    if (raw.sessionId === "") raw.sessionId = null;

    const parsed = challengeSchema.safeParse(raw);
    if (!parsed.success) {
      return failure("Kèo chưa hợp lệ.", fieldErrors(parsed.error));
    }
    const input = parsed.data;

    // Chặn "nợ chồng nợ": giới hạn số kèo đang mở của mỗi người.
    const [{ value: openCount }] = await db
      .select({ value: count() })
      .from(challenges)
      .where(
        and(
          eq(challenges.creatorId, actor.id),
          inArray(challenges.status, ["open", "locked"]),
        ),
      );

    if (openCount >= LIMITS.maxOpenChallengesPerUser) {
      return failure(
        `Bạn đang có ${openCount} kèo chưa xong. Giải quyết bớt rồi hãy tạo kèo mới (tối đa ${LIMITS.maxOpenChallengesPerUser}).`,
      );
    }

    if (input.opponentIds.includes(actor.id) || input.partnerId === actor.id) {
      return failure("Không thể tự thách chính mình.");
    }

    const inviteeIds = [
      ...input.opponentIds,
      ...(input.partnerId ? [input.partnerId] : []),
    ];

    if (inviteeIds.length > 0) {
      const found = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(
          and(
            inArray(profiles.id, inviteeIds),
            eq(profiles.status, "active"),
          ),
        );
      if (found.length !== inviteeIds.length) {
        return failure("Có người bạn chọn không còn hoạt động.");
      }
    }

    if (input.sessionId) {
      const session = await db.query.playSessions.findFirst({
        where: eq(playSessions.id, input.sessionId),
        columns: { id: true, status: true },
      });
      if (!session || session.status !== "open") {
        return failure("Buổi tập được chọn không còn mở.");
      }
    }

    const challengeId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(challenges)
        .values({
          creatorId: actor.id,
          sport: input.sport as never,
          format: input.format as never,
          kind: input.kind,
          title: input.title,
          description: input.description,
          pointsTarget: input.pointsTarget,
          stakeType: input.stakeType as never,
          stakeQty: input.stakeQty,
          stakeNote: input.stakeNote,
          sessionId: input.sessionId,
          playDeadline: input.playDeadline,
          status: "open",
        })
        .returning({ id: challenges.id });

      const rows = [
        {
          challengeId: created.id,
          userId: actor.id,
          team: "A" as const,
          isCreator: true,
          status: "accepted" as const,
        },
        ...(input.partnerId
          ? [
              {
                challengeId: created.id,
                userId: input.partnerId,
                team: "A" as const,
                isCreator: false,
                status: "invited" as const,
              },
            ]
          : []),
        ...input.opponentIds.map((userId) => ({
          challengeId: created.id,
          userId,
          team: "B" as const,
          isCreator: false,
          status: "invited" as const,
        })),
      ];

      await tx.insert(challengeParticipants).values(rows);

      await notify(
        tx,
        inviteeIds.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type: "challenge_invited" as const,
          title: `${actor.fullName} thách bạn: ${input.title}`,
          message: `Ăn ${formatStake(
            input.stakeType as never,
            input.stakeQty,
            input.stakeNote,
          )}. Bấm để nhận hoặc từ chối.`,
          href: `/keo/${created.id}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "challenge.create",
        targetType: "challenge",
        targetId: created.id,
        metadata: {
          format: input.format,
          kind: input.kind,
          stake: input.stakeType,
        },
      });

      return created.id;
    });

    createdId = challengeId;
    revalidateChallenge(challengeId);
    return success("Đã tạo kèo.");
  });

  if (createdId) redirect(`/keo/${createdId}`);
  return result;
}

/* ------------------------------------------------------------------ */
/* Sua keo                                                             */
/* ------------------------------------------------------------------ */

/**
 * Sửa kèo đã tạo.
 *
 * BA CÁI CHẶN, MỖI CÁI VÌ MỘT LÝ DO KHÁC NHAU:
 *
 *  1. Đã có kết quả  -> cấm. Sửa tiền cược sau khi đã biết ai thắng thì
 *     người thua trả một khoản mà họ chưa từng đồng ý. Đây là chỗ dễ
 *     cãi nhau nhất trong cả app, nên đóng hẳn.
 *  2. Đã huỷ         -> cấm. Kèo huỷ là một bản ghi để xem lại, không
 *     phải nháp.
 *  3. Đội hình       -> không nằm trong biểu mẫu sửa (xem
 *     `challengeEditSchema`). Thêm bớt người là lời mời, không phải
 *     một ô nhập liệu.
 *
 * Còn lại thì sửa thoải mái, nhưng người đang ở trong kèo được báo khi
 * ĐIỀU KHOẢN đổi — tiền cược, số điểm, hạn đánh. Họ nhận kèo dựa trên
 * mấy thứ đó.
 */
export async function updateChallengeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let updatedId: string | null = null;

  const result = await runAction(async () => {
    const actor = await requireActor();

    const raw = formDataToObject(formData);
    if (raw.sessionId === "") raw.sessionId = null;

    const parsed = challengeEditSchema.safeParse(raw);
    if (!parsed.success) {
      return failure("Kèo chưa hợp lệ.", fieldErrors(parsed.error));
    }
    const input = parsed.data;

    const outcome = await db.transaction(async (tx) => {
      const { challenge } = await loadLocked(tx, input.challengeId);

      if (challenge.creatorId !== actor.id && !isModerator(actor)) {
        return { error: "Chỉ người tạo kèo mới sửa được." };
      }

      const [existingResult] = await tx
        .select({ id: challengeResults.id })
        .from(challengeResults)
        .where(eq(challengeResults.challengeId, input.challengeId));

      if (existingResult) {
        return {
          error:
            "Kèo đã nhập kết quả thì không sửa được nữa: đổi tiền cược sau khi biết ai thắng là không sòng phẳng.",
        };
      }

      if (
        challenge.status === "cancelled" ||
        challenge.status === "declined" ||
        challenge.status === "completed"
      ) {
        return { error: "Kèo đã đóng thì không sửa được nữa." };
      }

      const format = challenge.format as keyof typeof CHALLENGE_FORMATS;
      if (format !== "free" && input.pointsTarget === null) {
        return {
          error: "Vui lòng nhập số điểm của kèo.",
          fieldErrors: { pointsTarget: "Vui lòng nhập số điểm của kèo." },
        };
      }
      const pointsTarget = format === "free" ? null : input.pointsTarget;

      if (input.sessionId && input.sessionId !== challenge.sessionId) {
        const session = await tx.query.playSessions.findFirst({
          where: eq(playSessions.id, input.sessionId),
          columns: { id: true, status: true },
        });
        if (!session || session.status !== "open") {
          return { error: "Buổi tập được chọn không còn mở." };
        }
      }

      const cuocCu = formatStake(
        challenge.stakeType as never,
        challenge.stakeQty,
        challenge.stakeNote,
      );
      const cuocMoi = formatStake(
        input.stakeType as never,
        input.stakeQty,
        input.stakeNote,
      );

      const doiCuoc = cuocCu !== cuocMoi;
      const doiDiem = challenge.pointsTarget !== pointsTarget;
      const doiHan =
        (challenge.playDeadline?.getTime() ?? null) !==
        (input.playDeadline?.getTime() ?? null);

      if (challenge.status === "locked" && doiCuoc && !isModerator(actor)) {
        return {
          error: "Kèo đã đủ người và chốt sổ, không thể thay đổi cược.",
        };
      }

      await tx
        .update(challenges)
        .set({
          title: input.title,
          description: input.description,
          pointsTarget,
          stakeType: input.stakeType as never,
          stakeQty: input.stakeQty,
          stakeNote: input.stakeNote,
          sessionId: input.sessionId,
          playDeadline: input.playDeadline,
          updatedAt: new Date(),
        })
        .where(eq(challenges.id, input.challengeId));

      if (doiCuoc || doiDiem || doiHan) {
        const participants = await tx
          .select({
            userId: challengeParticipants.userId,
            status: challengeParticipants.status,
          })
          .from(challengeParticipants)
          .where(eq(challengeParticipants.challengeId, input.challengeId));

        const doi = [
          doiCuoc ? `cược: ${cuocMoi}` : null,
          doiDiem && pointsTarget ? `đánh tới ${pointsTarget} điểm` : null,
          doiHan
            ? input.playDeadline
              ? `hạn đánh: ${formatDateTime(input.playDeadline)}`
              : "bỏ hạn đánh"
            : null,
        ]
          .filter(Boolean)
          .join(" • ");

        await notify(
          tx,
          participants
            .filter(
              (p) =>
                p.userId !== actor.id &&
                (p.status === "accepted" || p.status === "invited"),
            )
            .map((p) => ({
              recipientId: p.userId,
              actorId: actor.id,
              type: "challenge_updated" as const,
              title: `${actor.fullName} vừa đổi điều khoản kèo "${input.title}"`,
              message: doi,
              href: `/keo/${input.challengeId}`,
            })),
        );
      }

      await audit(tx, {
        actorId: actor.id,
        action: "challenge.update",
        targetType: "challenge",
        targetId: input.challengeId,
        metadata: {
          doiCuoc,
          doiDiem,
          doiHan,
          byModerator: challenge.creatorId !== actor.id,
        },
      });

      return {};
    });

    if (outcome && "error" in outcome && outcome.error) {
      return failure(outcome.error, outcome.fieldErrors);
    }

    updatedId = input.challengeId;
    revalidateChallenge(input.challengeId);
    return success("Đã lưu kèo.");
  });

  if (updatedId) redirect(`/keo/${updatedId}`);
  return result;
}

/* ------------------------------------------------------------------ */
/* Nhan keo mo                                                         */
/* ------------------------------------------------------------------ */

export async function joinChallengeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const parsed = joinChallengeSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Yêu cầu không hợp lệ.", fieldErrors(parsed.error));
    }
    const { challengeId, team } = parsed.data;

    const outcome = await db.transaction(async (tx) => {
      const { challenge, asLogic, asParticipants } = await loadLocked(
        tx,
        challengeId,
      );

      const decision = canJoin(asLogic, asParticipants, actor.id, team);
      if (!decision.ok) return { error: decision.reason };

      await tx
        .insert(challengeParticipants)
        .values({
          challengeId,
          userId: actor.id,
          team,
          isCreator: false,
          status: "accepted",
        })
        .onConflictDoUpdate({
          target: [
            challengeParticipants.challengeId,
            challengeParticipants.userId,
          ],
          set: {
            team,
            status: "accepted",
            leftAt: null,
            joinedAt: new Date(),
          },
        });

      const existingIdx = asParticipants.findIndex(
        (p) => p.userId === actor.id,
      );
      const participantEntry: ParticipantLike = {
        userId: actor.id,
        team,
        status: "accepted",
        isCreator: false,
      };
      const nextParticipants: ParticipantLike[] =
        existingIdx >= 0
          ? asParticipants.map((p, i) =>
              i === existingIdx ? participantEntry : p,
            )
          : [...asParticipants, participantEntry];

      const lockState = await syncLockState(tx, asLogic, nextParticipants);

      const others = activeParticipants(nextParticipants)
        .map((p) => p.userId)
        .filter((id) => id !== actor.id);

      await notify(
        tx,
        others.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type:
            lockState === "locked"
              ? ("challenge_locked" as const)
              : ("challenge_accepted" as const),
          title:
            lockState === "locked"
              ? `Kèo "${challenge.title}" đã đủ người!`
              : `${actor.fullName} đã nhận kèo "${challenge.title}"`,
          message:
            lockState === "locked"
              ? "Đánh xong nhớ vào nhập kết quả nhé."
              : null,
          href: `/keo/${challengeId}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "challenge.join",
        targetType: "challenge",
        targetId: challengeId,
        metadata: { team },
      });

      return { lockState };
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateChallenge(challengeId);
    return success(
      outcome.lockState === "locked"
        ? "Đã nhận kèo. Kèo đủ người rồi!"
        : "Đã nhận kèo.",
    );
  });
}

/* ------------------------------------------------------------------ */
/* Phan hoi loi thach dich danh                                        */
/* ------------------------------------------------------------------ */

export async function respondInviteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const challengeId = String(formData.get("challengeId") ?? "");
    const answer = String(formData.get("answer") ?? "");
    if (!isUuid(challengeId) || (answer !== "accept" && answer !== "decline")) {
      return failure("Yêu cầu không hợp lệ.");
    }

    const outcome = await db.transaction(async (tx) => {
      const { challenge, asLogic, asParticipants } = await loadLocked(
        tx,
        challengeId,
      );

      const decision = canRespondToInvite(asLogic, asParticipants, actor.id);
      if (!decision.ok) return { error: decision.reason };

      if (answer === "decline") {
        await tx
          .update(challengeParticipants)
          .set({ status: "declined", leftAt: new Date() })
          .where(
            and(
              eq(challengeParticipants.challengeId, challengeId),
              eq(challengeParticipants.userId, actor.id),
            ),
          );

        // Thách đích danh mà bị từ chối thì kèo kết thúc.
        // Kèo mở chỉ đơn giản là trống lại một chỗ.
        if (challenge.kind === "direct") {
          await tx
            .update(challenges)
            .set({ status: "declined", updatedAt: new Date() })
            .where(eq(challenges.id, challengeId));
        }

        await notify(tx, {
          recipientId: challenge.creatorId,
          actorId: actor.id,
          type: "challenge_declined",
          title: `${actor.fullName} từ chối kèo "${challenge.title}"`,
          href: `/keo/${challengeId}`,
        });

        await audit(tx, {
          actorId: actor.id,
          action: "challenge.decline",
          targetType: "challenge",
          targetId: challengeId,
        });

        return { answer: "decline" as const };
      }

      await tx
        .update(challengeParticipants)
        .set({ status: "accepted", joinedAt: new Date() })
        .where(
          and(
            eq(challengeParticipants.challengeId, challengeId),
            eq(challengeParticipants.userId, actor.id),
          ),
        );

      const nextParticipants = asParticipants.map((p) =>
        p.userId === actor.id ? { ...p, status: "accepted" as const } : p,
      );

      const lockState = await syncLockState(tx, asLogic, nextParticipants);

      const others = activeParticipants(nextParticipants)
        .map((p) => p.userId)
        .filter((id) => id !== actor.id);

      await notify(
        tx,
        others.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type:
            lockState === "locked"
              ? ("challenge_locked" as const)
              : ("challenge_accepted" as const),
          title:
            lockState === "locked"
              ? `Kèo "${challenge.title}" đã đủ người!`
              : `${actor.fullName} đã nhận kèo "${challenge.title}"`,
          href: `/keo/${challengeId}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "challenge.accept",
        targetType: "challenge",
        targetId: challengeId,
      });

      return { answer: "accept" as const, lockState };
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateChallenge(challengeId);
    if (outcome.answer === "decline") return success("Đã từ chối kèo.");
    return success(
      outcome.lockState === "locked"
        ? "Đã nhận kèo. Kèo đủ người rồi!"
        : "Đã nhận kèo.",
    );
  });
}

/* ------------------------------------------------------------------ */
/* Roi keo                                                             */
/* ------------------------------------------------------------------ */

export async function leaveChallengeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const challengeId = String(formData.get("challengeId") ?? "");
    if (!isUuid(challengeId)) return failure("Yêu cầu không hợp lệ.");

    const outcome = await db.transaction(async (tx) => {
      const { challenge, asLogic, asParticipants } = await loadLocked(
        tx,
        challengeId,
      );

      const decision = canLeave(asLogic, asParticipants, actor.id);
      if (!decision.ok) return { error: decision.reason };

      await tx
        .update(challengeParticipants)
        .set({ status: "left", leftAt: new Date() })
        .where(
          and(
            eq(challengeParticipants.challengeId, challengeId),
            eq(challengeParticipants.userId, actor.id),
          ),
        );

      const nextParticipants = asParticipants.map((p) =>
        p.userId === actor.id ? { ...p, status: "left" as const } : p,
      );

      await syncLockState(tx, asLogic, nextParticipants);

      const others = activeParticipants(nextParticipants).map((p) => p.userId);

      await notify(
        tx,
        others.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type: "challenge_left" as const,
          title: `${actor.fullName} đã rời kèo "${challenge.title}"`,
          message: "Kèo đang trống chỗ trở lại.",
          href: `/keo/${challengeId}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "challenge.leave",
        targetType: "challenge",
        targetId: challengeId,
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateChallenge(challengeId);
    return success("Đã rời kèo.");
  });
}

/* ------------------------------------------------------------------ */
/* Huy keo                                                             */
/* ------------------------------------------------------------------ */

export async function cancelChallengeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const parsed = cancelChallengeSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Yêu cầu không hợp lệ.", fieldErrors(parsed.error));
    }
    const { challengeId, reason } = parsed.data;

    const outcome = await db.transaction(async (tx) => {
      const { challenge, asLogic, asParticipants } = await loadLocked(
        tx,
        challengeId,
      );

      const decision = canCancel(asLogic, actor.id, isModerator(actor));
      if (!decision.ok) return { error: decision.reason };

      await tx
        .update(challenges)
        .set({
          status: "cancelled",
          cancellationReason: reason,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(challenges.id, challengeId));

      const others = activeParticipants(asParticipants)
        .map((p) => p.userId)
        .filter((id) => id !== actor.id);

      await notify(
        tx,
        others.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type: "challenge_cancelled" as const,
          title: `Kèo "${challenge.title}" đã bị huỷ`,
          message: reason ?? null,
          href: `/keo/${challengeId}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "challenge.cancel",
        targetType: "challenge",
        targetId: challengeId,
        metadata: { reason, byModerator: challenge.creatorId !== actor.id },
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateChallenge(challengeId);
    return success("Đã huỷ kèo.");
  });
}

/* ------------------------------------------------------------------ */
/* Xoa han keo                                                         */
/* ------------------------------------------------------------------ */

/**
 * Xoá hẳn khỏi database — khác với "huỷ" (huỷ vẫn giữ lại để xem).
 *
 * Chặn khi kèo đã chốt kết quả: khoản nợ gắn với kèo sẽ bị xoá theo
 * (khoá ngoại cascade), tức là xoá mất công nợ của người khác. Trường
 * hợp đó chỉ cho huỷ, không cho xoá.
 */
export async function deleteChallengeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let deleted = false;

  const result = await runAction(async () => {
    const actor = await requireActor();
    const challengeId = String(formData.get("challengeId") ?? "");
    if (!isUuid(challengeId)) return failure("Yêu cầu không hợp lệ.");

    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
      columns: { id: true, title: true, creatorId: true, status: true },
      with: { result: true },
    });

    if (!challenge) return failure("Không tìm thấy kèo này.");

    if (challenge.creatorId !== actor.id && !isModerator(actor)) {
      return failure("Chỉ người tạo kèo mới xoá được.");
    }

    if (challenge.result) {
      return failure(
        "Kèo đã có kết quả (chờ duyệt hoặc đã chốt) nên không thể xoá.",
      );
    }

    const outcome = await db.transaction(async (tx) => {
      /*
        KIỂM LẠI SAU KHI KHOÁ. Phần kiểm ở trên đọc không khoá: giữa lúc đó
        và lúc xoá, người chơi có thể vừa gửi kết quả — và lệnh xoá sẽ kéo
        theo (cascade) luôn kết quả ấy. Gửi kết quả cũng khoá hàng kèo này
        trước, nên khoá ở đây buộc hai việc phải xếp hàng.
      */
      const { challenge: locked } = await loadLocked(tx, challengeId);
      if (locked.creatorId !== actor.id && !isModerator(actor)) {
        return { error: "Chỉ người tạo kèo mới xoá được." };
      }
      const [existingResult] = await tx
        .select({ id: challengeResults.id })
        .from(challengeResults)
        .where(eq(challengeResults.challengeId, challengeId));
      if (existingResult) {
        return {
          error: "Kèo đã có kết quả (chờ duyệt hoặc đã chốt) nên không thể xoá.",
        };
      }

      // Ghi log TRƯỚC khi xoá, vì audit_logs không giữ bản sao nội dung.
      await audit(tx, {
        actorId: actor.id,
        action: "challenge.delete",
        targetType: "challenge",
        targetId: challengeId,
        metadata: {
          title: challenge.title,
          status: locked.status,
          byModerator: challenge.creatorId !== actor.id,
        },
      });

      await tx.delete(challenges).where(eq(challenges.id, challengeId));
      return { error: null };
    });
    if (outcome.error) return failure(outcome.error);

    deleted = true;
    revalidateChallenge(challengeId);
    return success("Đã xoá kèo.");
  });

  if (deleted) redirect("/keo");
  return result;
}

/* ------------------------------------------------------------------ */
/* Doi doi (nguoi tao sap xep lai doi hinh 2v2)                        */
/* ------------------------------------------------------------------ */

export async function movePlayerTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const challengeId = String(formData.get("challengeId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    const team = String(formData.get("team") ?? "") as TeamSide;

    if (
      !isUuid(challengeId) ||
      !isUuid(userId) ||
      (team !== "A" && team !== "B")
    ) {
      return failure("Yêu cầu không hợp lệ.");
    }

    const outcome = await db.transaction(async (tx) => {
      const { challenge, asParticipants } = await loadLocked(tx, challengeId);

      if (challenge.creatorId !== actor.id && !isModerator(actor)) {
        return { error: "Chỉ người tạo kèo mới xếp lại đội." };
      }
      if (challenge.status !== "open" && challenge.status !== "locked") {
        return { error: "Kèo đã qua giai đoạn xếp đội." };
      }

      const target = asParticipants.find(
        (p) => p.userId === userId && (p.status === "accepted" || p.status === "invited"),
      );
      if (!target) return { error: "Người này không ở trong kèo." };
      if (target.team === team) return { error: "Người này đã ở đội đó rồi." };

      const capacity = CHALLENGE_FORMATS[challenge.format].playersPerTeam;
      const filled = asParticipants.filter(
        (p) =>
          p.team === team && (p.status === "accepted" || p.status === "invited"),
      ).length;
      if (filled >= capacity) return { error: `Đội ${team} đã đủ người.` };

      await tx
        .update(challengeParticipants)
        .set({ team })
        .where(
          and(
            eq(challengeParticipants.challengeId, challengeId),
            eq(challengeParticipants.userId, userId),
          ),
        );

      await audit(tx, {
        actorId: actor.id,
        action: "challenge.move_team",
        targetType: "challenge",
        targetId: challengeId,
        metadata: { userId, from: target.team, to: team },
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateChallenge(challengeId);
    return success("Đã xếp lại đội.");
  });
}
