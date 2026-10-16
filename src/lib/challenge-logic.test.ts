import { describe, expect, it } from "vitest";
import {
  allAccepted,
  canCancel,
  canConfirmResult,
  canJoin,
  canLeave,
  canSubmitResult,
  isFull,
  teamCounts,
  type ChallengeLike,
  type ParticipantLike,
} from "./challenge-logic";

describe("challenge-logic unit tests", () => {
  const baseChallenge: ChallengeLike = {
    id: "ch-1",
    creatorId: "user-a1",
    format: "1v1",
    kind: "open",
    status: "open",
    playDeadline: new Date(Date.now() + 86400000),
  };

  const participants1v1: ParticipantLike[] = [
    { userId: "user-a1", team: "A", status: "accepted", isCreator: true },
  ];

  it("calculates team counts and free slots correctly", () => {
    const counts = teamCounts("1v1", participants1v1);
    expect(counts.A.filled).toBe(1);
    expect(counts.A.free).toBe(0);
    expect(counts.B.filled).toBe(0);
    expect(counts.B.free).toBe(1);
    expect(isFull("1v1", participants1v1)).toBe(false);
  });

  it("canJoin allows joining empty team B in open 1v1", () => {
    const res = canJoin(baseChallenge, participants1v1, "user-b1", "B");
    expect(res.ok).toBe(true);
  });

  it("canJoin rejects joining full team A", () => {
    const res = canJoin(baseChallenge, participants1v1, "user-a2", "A");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toContain("Đội A đã đủ người");
    }
  });

  it("canJoin rejects if user is already in the challenge", () => {
    const res = canJoin(baseChallenge, participants1v1, "user-a1", "B");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toContain("Bạn đã ở trong kèo này rồi");
    }
  });

  it("canJoin rejects if challenge is past deadline", () => {
    const expiredChallenge: ChallengeLike = {
      ...baseChallenge,
      playDeadline: new Date(Date.now() - 10000),
    };
    const res = canJoin(expiredChallenge, participants1v1, "user-b1", "B");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toContain("quá hạn");
    }
  });

  it("checks allAccepted when full", () => {
    const fullAccepted: ParticipantLike[] = [
      { userId: "user-a1", team: "A", status: "accepted", isCreator: true },
      { userId: "user-b1", team: "B", status: "accepted", isCreator: false },
    ];
    expect(isFull("1v1", fullAccepted)).toBe(true);
    expect(allAccepted(fullAccepted)).toBe(true);
  });

  it("canLeave allows participant to leave but prevents creator", () => {
    const fullAccepted: ParticipantLike[] = [
      { userId: "user-a1", team: "A", status: "accepted", isCreator: true },
      { userId: "user-b1", team: "B", status: "accepted", isCreator: false },
    ];
    // Creator cannot leave
    const creatorLeave = canLeave(baseChallenge, fullAccepted, "user-a1");
    expect(creatorLeave.ok).toBe(false);

    // Opponent can leave while open
    const opponentLeave = canLeave(baseChallenge, fullAccepted, "user-b1");
    expect(opponentLeave.ok).toBe(true);
  });

  it("H6: canCancel blocks creator from cancelling if pending_confirm or disputed", () => {
    const pendingChallenge: ChallengeLike = {
      ...baseChallenge,
      status: "pending_confirm",
    };
    // Creator tries to cancel: blocked
    const creatorCancel = canCancel(pendingChallenge, "user-a1", false);
    expect(creatorCancel.ok).toBe(false);
    if (!creatorCancel.ok) {
      expect(creatorCancel.reason).toContain("Kèo đã có kết quả, chỉ ban quản trị mới huỷ được");
    }

    // Moderator can cancel
    const modCancel = canCancel(pendingChallenge, "user-mod", true);
    expect(modCancel.ok).toBe(true);
  });

  it("canSubmitResult allows participants when locked or disputed", () => {
    const lockedChallenge: ChallengeLike = {
      ...baseChallenge,
      status: "locked",
    };
    const fullAccepted: ParticipantLike[] = [
      { userId: "user-a1", team: "A", status: "accepted", isCreator: true },
      { userId: "user-b1", team: "B", status: "accepted", isCreator: false },
    ];
    const canA = canSubmitResult(lockedChallenge, fullAccepted, "user-a1", false);
    expect(canA.ok).toBe(true);

    const canOutsider = canSubmitResult(lockedChallenge, fullAccepted, "user-stranger", false);
    expect(canOutsider.ok).toBe(false);
  });

  it("M11: canConfirmResult blocks submitter from self-confirming even if moderator", () => {
    const pendingChallenge: ChallengeLike = {
      ...baseChallenge,
      status: "pending_confirm",
    };
    const fullAccepted: ParticipantLike[] = [
      { userId: "user-a1", team: "A", status: "accepted", isCreator: true },
      { userId: "user-b1", team: "B", status: "accepted", isCreator: false },
    ];

    // Submitter user-a1 tries to confirm own result: blocked
    const selfConfirm = canConfirmResult(
      pendingChallenge,
      fullAccepted,
      "user-a1",
      "user-a1",
      false,
    );
    expect(selfConfirm.ok).toBe(false);
    if (!selfConfirm.ok) {
      expect(selfConfirm.reason).toContain("không thể tự xác nhận kết quả do chính mình nhập");
    }

    // Even moderator cannot self-confirm if they are the submitter!
    const modSelfConfirm = canConfirmResult(
      pendingChallenge,
      fullAccepted,
      "user-mod",
      "user-mod",
      true,
    );
    expect(modSelfConfirm.ok).toBe(false);
    if (!modSelfConfirm.ok) {
      expect(modSelfConfirm.reason).toContain("không thể tự xác nhận kết quả do chính mình nhập");
    }

    // Opponent can confirm
    const oppConfirm = canConfirmResult(
      pendingChallenge,
      fullAccepted,
      "user-a1",
      "user-b1",
      false,
    );
    expect(oppConfirm.ok).toBe(true);
  });

  it("canConfirmResult: moderator playing in the challenge cannot confirm for own team", () => {
    const pendingChallenge: ChallengeLike = {
      ...baseChallenge,
      status: "pending_confirm",
    };
    const players: ParticipantLike[] = [
      { userId: "user-a1", team: "A", status: "accepted", isCreator: true },
      { userId: "user-mod", team: "A", status: "accepted", isCreator: false },
      { userId: "user-b1", team: "B", status: "accepted", isCreator: false },
    ];

    const sameTeamMod = canConfirmResult(pendingChallenge, players, "user-a1", "user-mod", true);
    expect(sameTeamMod.ok).toBe(false);

    const outsideMod = canConfirmResult(pendingChallenge, players, "user-a1", "user-mod2", true);
    expect(outsideMod.ok).toBe(true);
  });
});
