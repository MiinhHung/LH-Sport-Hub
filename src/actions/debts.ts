"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { challengeParticipants, challenges, debts } from "@/db/schema";
import { AppError, isModerator, requireActor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  canConfirmDebt,
  canMarkDebtPaid,
  teamMembers,
  type DebtLike,
  type ParticipantLike,
  type TeamSide,
} from "@/lib/challenge-logic";
import { formatStake, type StakeKey } from "@/lib/constants";
import { notify } from "@/lib/notifications";
import { uploadImage } from "@/lib/storage";
import { failure, runAction, success, type ActionState } from "./types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function loadDebtLocked(tx: Tx, debtId: string) {
  const [debt] = await tx
    .select()
    .from(debts)
    .where(eq(debts.id, debtId))
    .for("update");

  if (!debt) throw new AppError("Không tìm thấy khoản nợ này.");

  const [challenge] = await tx
    .select()
    .from(challenges)
    .where(eq(challenges.id, debt.challengeId));

  const participants = (await tx
    .select()
    .from(challengeParticipants)
    .where(
      eq(challengeParticipants.challengeId, debt.challengeId),
    )) as unknown as ParticipantLike[];

  return {
    debt,
    challenge,
    participants,
    asDebt: debt as unknown as DebtLike,
  };
}

function revalidateDebts() {
  revalidatePath("/so-no");
  revalidatePath("/keo");
  revalidatePath("/bang-phong-than");
}

function stakeLabelOf(debt: {
  stakeType: string;
  stakeQty: number;
  stakeNote: string | null;
}) {
  return formatStake(debt.stakeType as StakeKey, debt.stakeQty, debt.stakeNote);
}

/* ------------------------------------------------------------------ */
/* Doi thua bao "da tra"                                               */
/* ------------------------------------------------------------------ */

export async function markDebtPaidAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const debtId = String(formData.get("debtId") ?? "");
    if (!debtId) return failure("Yêu cầu không hợp lệ.");

    // Upload ảnh TRƯỚC transaction: gọi mạng bên ngoài không nên
    // giữ khoá hàng trong database.
    const proof = formData.get("proof");
    let proofUrl: string | null = null;
    if (proof instanceof File && proof.size > 0) {
      proofUrl = (await uploadImage(proof, "debt-proofs", "proof")).url;
    }

    const outcome = await db.transaction(async (tx) => {
      const { debt, challenge, participants, asDebt } = await loadDebtLocked(
        tx,
        debtId,
      );

      const decision = canMarkDebtPaid(asDebt, participants, actor.id);
      if (!decision.ok) return { error: decision.reason };

      const now = new Date();

      await tx
        .update(debts)
        .set({
          status: "pending_confirm",
          proofUrl: proofUrl ?? debt.proofUrl,
          markedPaidBy: actor.id,
          markedPaidAt: now,
          updatedAt: now,
        })
        .where(eq(debts.id, debtId));

      const creditors = teamMembers(
        participants,
        debt.creditorTeam as TeamSide,
      ).map((p) => p.userId);

      await notify(
        tx,
        creditors.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type: "debt_marked_paid" as const,
          title: `${actor.fullName} báo đã trả ${stakeLabelOf(debt)}`,
          message: `Từ kèo "${challenge?.title ?? ""}". Bạn nhận được chưa?`,
          href: "/so-no",
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "debt.mark_paid",
        targetType: "debt",
        targetId: debtId,
        metadata: { hasProof: Boolean(proofUrl) },
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateDebts();
    return success("Đã báo trả nợ, chờ đội kia xác nhận.");
  });
}

/* ------------------------------------------------------------------ */
/* Doi thang xac nhan da nhan                                          */
/* ------------------------------------------------------------------ */

export async function confirmDebtPaidAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const debtId = String(formData.get("debtId") ?? "");
    if (!debtId) return failure("Yêu cầu không hợp lệ.");

    const outcome = await db.transaction(async (tx) => {
      const { debt, challenge, participants, asDebt } = await loadDebtLocked(
        tx,
        debtId,
      );

      const decision = canConfirmDebt(
        asDebt,
        participants,
        actor.id,
        isModerator(actor),
      );
      if (!decision.ok) return { error: decision.reason };

      const now = new Date();

      await tx
        .update(debts)
        .set({
          status: "paid",
          confirmedBy: actor.id,
          confirmedAt: now,
          updatedAt: now,
        })
        .where(eq(debts.id, debtId));

      const debtors = teamMembers(
        participants,
        debt.debtorTeam as TeamSide,
      ).map((p) => p.userId);

      await notify(
        tx,
        debtors.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type: "debt_paid_confirmed" as const,
          title: `Đã xong! ${stakeLabelOf(debt)} được xác nhận`,
          message: `Kèo "${challenge?.title ?? ""}" khép lại. Hết nợ.`,
          href: "/so-no",
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "debt.confirm_paid",
        targetType: "debt",
        targetId: debtId,
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateDebts();
    return success("Đã xác nhận. Khoản nợ khép lại.");
  });
}

/* ------------------------------------------------------------------ */
/* Xoa no (chu no tu bo, hoac ban quan tri)                            */
/* ------------------------------------------------------------------ */

export async function waiveDebtAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const actor = await requireActor();
    const debtId = String(formData.get("debtId") ?? "");
    if (!debtId) return failure("Yêu cầu không hợp lệ.");

    const outcome = await db.transaction(async (tx) => {
      const { debt, challenge, participants } = await loadDebtLocked(tx, debtId);

      if (debt.status === "paid" || debt.status === "waived") {
        return { error: "Khoản nợ này đã khép lại rồi." };
      }

      const creditors = teamMembers(
        participants,
        debt.creditorTeam as TeamSide,
      ).map((p) => p.userId);

      if (!creditors.includes(actor.id) && !isModerator(actor)) {
        return { error: "Chỉ đội thắng mới xoá nợ được." };
      }

      const now = new Date();

      await tx
        .update(debts)
        .set({
          status: "waived",
          confirmedBy: actor.id,
          confirmedAt: now,
          updatedAt: now,
        })
        .where(eq(debts.id, debtId));

      const debtors = teamMembers(
        participants,
        debt.debtorTeam as TeamSide,
      ).map((p) => p.userId);

      await notify(
        tx,
        debtors.map((recipientId) => ({
          recipientId,
          actorId: actor.id,
          type: "debt_waived" as const,
          title: `${actor.fullName} xoá nợ ${stakeLabelOf(debt)} cho bạn`,
          message: `Kèo "${challenge?.title ?? ""}".`,
          href: "/so-no",
        })),
      );

      await audit(tx, {
        actorId: actor.id,
        action: "debt.waive",
        targetType: "debt",
        targetId: debtId,
      });

      return {};
    });

    if ("error" in outcome && outcome.error) return failure(outcome.error);

    revalidateDebts();
    return success("Đã xoá nợ.");
  });
}
