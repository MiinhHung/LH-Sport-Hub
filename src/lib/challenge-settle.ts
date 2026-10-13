import "server-only";

import { eq } from "drizzle-orm";

import { type DbTransaction } from "@/db";
import {
  challengeParticipants,
  challengeResults,
  challenges,
} from "@/db/schema";
import {
  activeParticipants,
  type ParticipantLike,
  type TeamSide,
} from "@/lib/challenge-logic";
import { formatStake, STAKES, type StakeKey } from "@/lib/constants";
import { notify } from "@/lib/notifications";
import { AppError } from "@/actions/types";

/**
 * Chốt kết quả và sinh thông báo kết quả.
 * Dùng chung cho xác nhận thủ công và tự động xác nhận bằng cron.
 * Chạy bên trong transaction dưới row-level lock FOR UPDATE.
 */
export async function settleChallenge(
  tx: DbTransaction,
  challengeId: string,
  options: { confirmedBy: string | null; auto: boolean },
): Promise<{ winningTeam: TeamSide; hasStake: boolean } | null> {
  const [challenge] = await tx
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .for("update");

  if (!challenge) {
    if (options.auto) return null;
    throw new AppError("Không tìm thấy kèo này.");
  }

  // Kiểm tra chặt trạng thái: nếu không còn là pending_confirm (đã huỷ/dispute/xong) thì bỏ qua
  if (challenge.status !== "pending_confirm") {
    if (options.auto) return null;
    throw new AppError("Kèo không ở trạng thái chờ xác nhận.");
  }

  const [result] = await tx
    .select()
    .from(challengeResults)
    .where(eq(challengeResults.challengeId, challengeId));

  if (!result || result.status !== "pending") {
    if (options.auto) return null;
    throw new AppError("Kèo chưa có kết quả hợp lệ để chốt.");
  }

  const now = new Date();
  const winningTeam = result.winningTeam as TeamSide;

  await tx
    .update(challengeResults)
    .set({
      status: "confirmed",
      confirmedBy: options.confirmedBy,
      confirmedAt: now,
      autoConfirmed: options.auto,
      updatedAt: now,
    })
    .where(eq(challengeResults.challengeId, challengeId));

  await tx
    .update(challenges)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(eq(challenges.id, challengeId));

  const stakeType = challenge.stakeType as StakeKey;
  const hasStake = STAKES[stakeType].createsDebt;

  const participants = (await tx
    .select()
    .from(challengeParticipants)
    .where(
      eq(challengeParticipants.challengeId, challengeId),
    )) as unknown as ParticipantLike[];

  const stakeLabel = formatStake(
    stakeType,
    challenge.stakeQty,
    challenge.stakeNote,
  );

  await notify(
    tx,
    activeParticipants(participants).map((p) => ({
      recipientId: p.userId,
      actorId: options.confirmedBy,
      type: options.auto
        ? ("result_auto_confirmed" as const)
        : ("result_confirmed" as const),
      title: options.auto
        ? `Kèo "${challenge.title}" tự động chốt kết quả`
        : `Kèo "${challenge.title}" đã chốt kết quả`,
      message:
        p.team === winningTeam
          ? hasStake
            ? `Bạn thắng! Đội kia nợ bạn ${stakeLabel}.`
            : "Bạn thắng!"
          : hasStake
            ? `Đội bạn thua, nợ ${stakeLabel}.`
            : "Đội bạn thua.",
      href: `/keo/${challengeId}`,
    })),
  );

  return { winningTeam, hasStake };
}
