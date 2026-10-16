"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  challengeParticipants,
  challengeResults,
  challenges,
} from "@/db/schema";
import { AppError, isModerator, requireActor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  activeParticipants,
  canConfirmResult,
  canSubmitResult,
  otherTeam,
  teamMembers,
  type ChallengeLike,
  type ParticipantLike,
  type TeamSide,
} from "@/lib/challenge-logic";
import { STAKES, formatStake, type StakeKey } from "@/lib/constants";
import { settleChallenge } from "@/lib/challenge-settle";
import { notify } from "@/lib/notifications";
import {
  disputeSchema,
  fieldErrors,
  formDataToObject,
  resultSchema,
} from "@/lib/validation";
import { failure, runAction, success, type ActionState } from "./types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

  const [result] = await tx
    .select()
    .from(challengeResults)
    .where(eq(challengeResults.challengeId, challengeId));

  return {
    challenge,
    result,
    asLogic: challenge as unknown as ChallengeLike,
    asParticipants: participants as unknown as ParticipantLike[],
  };
}

function revalidateAll(challengeId: string) {
  revalidatePath("/keo");
  revalidatePath(`/keo/${challengeId}`);
  revalidatePath("/bang-phong-than");
  revalidatePath("/ho-so");
}

function scoreLine(
  scoreA: number | null,
  scoreB: number | null,
): string | null {
  if (scoreA === null || scoreB === null) return null;
  return `${scoreA} - ${scoreB}`;
}

/* ------------------------------------------------------------------ */
/* Nhap ket qua                                                        */
/* ------------------------------------------------------------------ */

export async function submitResultAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const parsed = resultSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Kết quả chưa hợp lệ.", fieldErrors(parsed.error));
    }
    const input = parsed.data;

    const outcome = await db.transaction(async (tx) => {
      const { challenge, result, asLogic, asParticipants } = await loadLocked(
        tx,
        input.challengeId,
      );

      const decision = canSubmitResult(
        asLogic,
        asParticipants,
        actor.id,
        isModerator(actor),
      );
      if (!decision.ok) return { error: decision.reason };

      // Thể thức có điểm thì bắt buộc nhập tỉ số.
      if (challenge.format !== "free") {
        if (input.scoreA === null || input.scoreB === null) {
          return {
            error: "Vui lòng nhập tỉ số của cả hai đội.",
            field: "scoreA",
          };
        }
        const winnerScore =
          input.winningTeam === "A" ? input.scoreA : input.scoreB;
        if (
          challenge.pointsTarget !== null &&
          winnerScore < challenge.pointsTarget
        ) {
          return {
            error: `Kèo đánh tới ${challenge.pointsTarget} điểm, điểm của đội thắng phải đạt ít nhất ${challenge.pointsTarget}.`,
            field: "scoreA",
          };
        }
      }

      const now = new Date();

      if (result) {
        await tx
          .update(challengeResults)
          .set({
            submittedBy: actor.id,
            winningTeam: input.winningTeam,
            scoreA: input.scoreA,
            scoreB: input.scoreB,
            notes: input.notes,
            status: "pending",
            confirmedBy: null,
            confirmedAt: null,
            autoConfirmed: false,
            disputeReason: null,
            updatedAt: now,
          })
          .where(eq(challengeResults.challengeId, input.challengeId));
      } else {
        await tx.insert(challengeResults).values({
          challengeId: input.challengeId,
          submittedBy: actor.id,
          winningTeam: input.winningTeam,
          scoreA: input.scoreA,
          scoreB: input.scoreB,
          notes: input.notes,
          status: "pending",
        });
      }

      await tx
        .update(challenges)
        .set({ status: "pending_confirm", updatedAt: now })
        .where(eq(challenges.id, input.challengeId));

      // Chỉ đội KHÁC mới xác nhận được, nên chỉ báo cho họ. Moderator
      // nhập hộ từ ngoài kèo thì cả hai đội đều xác nhận được.
      const myTeam = asParticipants.find((p) => p.userId === actor.id)?.team;
      const recipients = (
        myTeam
          ? teamMembers(asParticipants, otherTeam(myTeam))
          : activeParticipants(asParticipants)
      )
        .map((p) => p.userId);

      const score = scoreLine(input.scoreA, input.scoreB);

      await notify(
        tx,
        recipients.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type: "result_submitted" as const,
          title: `Xác nhận kết quả kèo "${challenge.title}"`,
          message: `${actor.fullName} báo đội ${input.winningTeam} thắng${
            score ? ` (${score})` : ""
          }. Bạn có đồng ý không?`,
          href: `/keo/${input.challengeId}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: result ? "result.resubmit" : "result.submit",
        targetType: "challenge",
        targetId: input.challengeId,
        metadata: {
          winningTeam: input.winningTeam,
          scoreA: input.scoreA,
          scoreB: input.scoreB,
        },
      });

      return {};
    });

    if ("error" in outcome && outcome.error) {
      return failure(
        outcome.error,
        outcome.field ? { [outcome.field]: outcome.error } : undefined,
      );
    }

    revalidateAll(input.challengeId);
    return success("Đã gửi kết quả, chờ đội kia xác nhận.");
  });
}

/* ------------------------------------------------------------------ */
/* Xac nhan ket qua -> sinh no                                         */
/* ------------------------------------------------------------------ */

export async function confirmResultAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const challengeId = String(formData.get("challengeId") ?? "");
    if (!challengeId) return failure("Yêu cầu không hợp lệ.");

    const outcome = await db.transaction(async (tx) => {
      const { result, asLogic, asParticipants } = await loadLocked(
        tx,
        challengeId,
      );
      if (!result) return { error: "Kèo chưa có kết quả để xác nhận." };

      const decision = canConfirmResult(
        asLogic,
        asParticipants,
        result.submittedBy,
        actor.id,
        isModerator(actor),
      );
      if (!decision.ok) return { error: decision.reason };

      await settleChallenge(tx, challengeId, {
        confirmedBy: actor.id,
        auto: false,
      });

      await audit(tx, {
        actorId: actor.id,
        action: "result.confirm",
        targetType: "challenge",
        targetId: challengeId,
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateAll(challengeId);
    return success("Đã xác nhận kết quả.");
  });
}

/* ------------------------------------------------------------------ */
/* Khong dong y ket qua                                                */
/* ------------------------------------------------------------------ */

export async function disputeResultAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();

    const parsed = disputeSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return failure("Vui lòng ghi rõ lý do.", fieldErrors(parsed.error));
    }
    const { challengeId, reason } = parsed.data;

    const outcome = await db.transaction(async (tx) => {
      const { challenge, result, asLogic, asParticipants } = await loadLocked(
        tx,
        challengeId,
      );
      if (!result) return { error: "Kèo chưa có kết quả." };

      const decision = canConfirmResult(
        asLogic,
        asParticipants,
        result.submittedBy,
        actor.id,
        isModerator(actor),
      );
      if (!decision.ok) return { error: decision.reason };

      const now = new Date();

      await tx
        .update(challengeResults)
        .set({ status: "disputed", disputeReason: reason, updatedAt: now })
        .where(eq(challengeResults.challengeId, challengeId));

      await tx
        .update(challenges)
        .set({ status: "disputed", updatedAt: now })
        .where(eq(challenges.id, challengeId));

      const others = activeParticipants(asParticipants)
        .map((p) => p.userId)
        .filter((id) => id !== actor.id);

      await notify(
        tx,
        others.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type: "result_disputed" as const,
          title: `${actor.fullName} không đồng ý kết quả kèo "${challenge.title}"`,
          message: reason,
          href: `/keo/${challengeId}`,
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "result.dispute",
        targetType: "challenge",
        targetId: challengeId,
        metadata: { reason },
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateAll(challengeId);
    return success("Đã ghi nhận. Hai bên nhập lại kết quả cho đúng nhé.");
  });
}
