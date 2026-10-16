/**
 * Logic thuần của "kèo" — không chạm database, không import server-only.
 * Dùng chung cho server action (để chặn) và UI (để hiển thị/ẩn nút).
 *
 * Nguyên tắc: UI dùng các hàm này chỉ để hiển thị cho đẹp.
 * Server action LUÔN gọi lại chính các hàm này trên dữ liệu vừa đọc
 * trong transaction — không tin bất cứ thứ gì client gửi lên.
 */

import { CHALLENGE_FORMATS, type ChallengeFormatKey } from "@/lib/constants";

export type TeamSide = "A" | "B";

export type ParticipantLike = {
  userId: string;
  team: TeamSide;
  status: "invited" | "accepted" | "declined" | "left";
  isCreator: boolean;
};

export type ChallengeLike = {
  id: string;
  creatorId: string;
  format: ChallengeFormatKey;
  kind: "open" | "direct";
  status:
    | "open"
    | "locked"
    | "pending_confirm"
    | "disputed"
    | "completed"
    | "declined"
    | "cancelled";
  playDeadline: Date | null;
};

/** Người thực sự đang giữ chỗ (đã nhận kèo hoặc đang được mời). */
export function holdsSlot(p: ParticipantLike): boolean {
  return p.status === "accepted" || p.status === "invited";
}

export function activeParticipants(
  participants: ParticipantLike[],
): ParticipantLike[] {
  return participants.filter(holdsSlot);
}

export function teamCapacity(format: ChallengeFormatKey): number {
  return CHALLENGE_FORMATS[format].playersPerTeam;
}

export function teamCounts(
  format: ChallengeFormatKey,
  participants: ParticipantLike[],
): Record<TeamSide, { filled: number; capacity: number; free: number }> {
  const capacity = teamCapacity(format);
  const active = activeParticipants(participants);
  const filledA = active.filter((p) => p.team === "A").length;
  const filledB = active.filter((p) => p.team === "B").length;
  return {
    A: { filled: filledA, capacity, free: capacity - filledA },
    B: { filled: filledB, capacity, free: capacity - filledB },
  };
}

export function isFull(
  format: ChallengeFormatKey,
  participants: ParticipantLike[],
): boolean {
  const counts = teamCounts(format, participants);
  return counts.A.free <= 0 && counts.B.free <= 0;
}

/** Tất cả người được mời đã bấm nhận => kèo chốt. */
export function allAccepted(participants: ParticipantLike[]): boolean {
  const active = activeParticipants(participants);
  return active.length > 0 && active.every((p) => p.status === "accepted");
}

export function participantOf(
  participants: ParticipantLike[],
  userId: string,
): ParticipantLike | undefined {
  return participants.find((p) => p.userId === userId && holdsSlot(p));
}

export function teamOf(
  participants: ParticipantLike[],
  userId: string,
): TeamSide | null {
  return participantOf(participants, userId)?.team ?? null;
}

export function teamMembers(
  participants: ParticipantLike[],
  team: TeamSide,
): ParticipantLike[] {
  return activeParticipants(participants).filter((p) => p.team === team);
}

export function otherTeam(team: TeamSide): TeamSide {
  return team === "A" ? "B" : "A";
}

export function isPastDeadline(challenge: ChallengeLike): boolean {
  return (
    challenge.playDeadline !== null &&
    challenge.playDeadline.getTime() < Date.now()
  );
}

/* ------------------------------------------------------------------ */
/* Quyen han                                                           */
/* ------------------------------------------------------------------ */

export type Decision = { ok: true } | { ok: false; reason: string };

const ok: Decision = { ok: true };
const no = (reason: string): Decision => ({ ok: false, reason });

/** Có được nhận kèo (vào một đội cụ thể) không. */
export function canJoin(
  challenge: ChallengeLike,
  participants: ParticipantLike[],
  userId: string,
  team: TeamSide,
): Decision {
  if (challenge.status !== "open") {
    return no("Kèo này không còn nhận người nữa.");
  }
  if (isPastDeadline(challenge)) {
    return no("Kèo đã quá hạn đánh.");
  }
  if (participantOf(participants, userId)) {
    return no("Bạn đã ở trong kèo này rồi.");
  }
  if (challenge.kind === "direct") {
    return no("Đây là kèo thách đích danh, không thể tự nhảy vào.");
  }
  const counts = teamCounts(challenge.format, participants);
  if (counts[team].free <= 0) {
    return no(`Đội ${team} đã đủ người.`);
  }
  return ok;
}

/** Người được thách đích danh có được nhận/từ chối không. */
export function canRespondToInvite(
  challenge: ChallengeLike,
  participants: ParticipantLike[],
  userId: string,
): Decision {
  if (challenge.status !== "open") {
    return no("Kèo này không còn ở trạng thái chờ phản hồi.");
  }
  const me = participants.find((p) => p.userId === userId);
  if (!me || me.status !== "invited") {
    return no("Bạn không được mời vào kèo này.");
  }
  return ok;
}

/** Có được rời kèo không (chỉ khi kèo chưa đánh xong). */
export function canLeave(
  challenge: ChallengeLike,
  participants: ParticipantLike[],
  userId: string,
): Decision {
  const me = participantOf(participants, userId);
  if (!me) return no("Bạn không ở trong kèo này.");
  if (me.isCreator) {
    return no("Người tạo kèo không rời được — hãy huỷ kèo nếu không đánh nữa.");
  }
  if (challenge.status !== "open" && challenge.status !== "locked") {
    return no("Kèo đã qua giai đoạn cho phép rời.");
  }
  return ok;
}

/** Có được huỷ kèo không. */
export function canCancel(
  challenge: ChallengeLike,
  userId: string,
  isModerator: boolean,
): Decision {
  if (challenge.status === "completed") {
    return no("Kèo đã hoàn tất, không huỷ được.");
  }
  if (challenge.status === "cancelled") {
    return no("Kèo đã bị huỷ rồi.");
  }
  if (
    ["pending_confirm", "disputed"].includes(challenge.status) &&
    !isModerator
  ) {
    return no("Kèo đã có kết quả, chỉ ban quản trị mới huỷ được.");
  }
  if (challenge.creatorId !== userId && !isModerator) {
    return no("Chỉ người tạo kèo hoặc ban quản trị mới huỷ được.");
  }
  return ok;
}

/** Có được nhập kết quả không — phải là người trong kèo. */
export function canSubmitResult(
  challenge: ChallengeLike,
  participants: ParticipantLike[],
  userId: string,
  isModerator: boolean,
): Decision {
  if (challenge.status !== "locked" && challenge.status !== "disputed") {
    if (challenge.status === "open") {
      return no("Kèo chưa đủ người, chưa nhập kết quả được.");
    }
    if (challenge.status === "pending_confirm") {
      return no("Kết quả đã được nhập, đang chờ đội kia xác nhận.");
    }
    return no("Kèo không ở trạng thái nhập kết quả.");
  }
  if (!participantOf(participants, userId) && !isModerator) {
    return no("Chỉ người chơi trong kèo mới nhập được kết quả.");
  }
  return ok;
}

/**
 * Có được xác nhận kết quả không — phải thuộc đội KHÁC đội của người nhập,
 * để không ai vừa nhập vừa tự duyệt.
 */
export function canConfirmResult(
  challenge: ChallengeLike,
  participants: ParticipantLike[],
  submittedBy: string,
  userId: string,
  isModerator: boolean,
): Decision {
  if (challenge.status !== "pending_confirm") {
    return no("Kèo không ở trạng thái chờ xác nhận.");
  }
  if (submittedBy === userId) {
    return no("Bạn không thể tự xác nhận kết quả do chính mình nhập.");
  }
  const myTeam = teamOf(participants, userId);
  // Moderator đứng ngoài kèo được duyệt hộ; còn đang chơi trong kèo thì
  // phải theo luật khác đội như mọi người.
  if (!myTeam) {
    return isModerator ? ok : no("Bạn không ở trong kèo này.");
  }

  const submitterTeam = teamOf(participants, submittedBy);
  if (submitterTeam && myTeam === submitterTeam) {
    return no("Người nhập kết quả và người xác nhận phải khác đội.");
  }
  return ok;
}

/* ------------------------------------------------------------------ */
/* Nhan trang thai                                                     */
/* ------------------------------------------------------------------ */

export const CHALLENGE_STATUS_META = {
  open: { label: "Đang tìm đối", tone: "amber" },
  locked: { label: "Đã chốt kèo", tone: "sky" },
  pending_confirm: { label: "Chờ xác nhận", tone: "violet" },
  disputed: { label: "Đang tranh chấp", tone: "rose" },
  completed: { label: "Đã xong", tone: "emerald" },
  declined: { label: "Bị từ chối", tone: "slate" },
  cancelled: { label: "Đã huỷ", tone: "slate" },
} as const;

