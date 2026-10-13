import { describe, expect, it } from "vitest";

import {
  CONTACT_AT,
  CONTACT_POINT,
  DURATION,
  GROUND_Y,
  JUMP,
  KEYS,
  LIMIT,
  RIG_CSS,
  TRACKS,
  poseAt,
  rootYAt,
  shuttleInAt,
  shuttleOutAt,
  skeletonAt,
} from "./athlete-rig";

const times = Array.from({ length: 497 }, (_, i) => (i / 496) * DURATION);

const lowestFoot = (t: number) => {
  const s = skeletonAt(t);
  return Math.max(s.legR.heel.y, s.legR.toe.y, s.legL.heel.y, s.legL.toe.y);
};

describe("athlete rig", () => {
  it("về đúng thế sẵn sàng ở khung cuối (lặp liền mạch)", () => {
    const a = poseAt(0);
    const b = poseAt(DURATION);
    for (const k of Object.keys(a) as (keyof typeof a)[]) {
      expect(b[k]).toBeCloseTo(a[k], 6);
    }
    expect(rootYAt(DURATION)).toBeCloseTo(rootYAt(0), 6);
    for (const track of TRACKS) {
      // Quả cầu, chớp sáng, vệt vung chỉ xuất hiện một lần, không lặp.
      if (["shin", "shout", "impact", "swoosh"].includes(track.name)) continue;
      // Độ mờ của gốc và bóng đổ có pha hiện dần ở đầu, không tính.
      const n = track.name === "root" || track.name === "shadow" ? 2 : 1;
      const s = track.at(0);
      const e = track.at(DURATION);
      for (let i = 0; i < n; i++) expect(Math.abs(s[i] - e[i])).toBeLessThan(0.6);
    }
  });

  it("khớp không gập ngược", () => {
    for (const t of times) {
      const p = poseAt(t);
      for (const k of [p.kneeR, p.kneeL]) {
        expect(k).toBeGreaterThanOrEqual(LIMIT.knee[0]);
        expect(k).toBeLessThanOrEqual(LIMIT.knee[1]);
      }
      for (const e of [p.elR, p.elL]) {
        expect(e).toBeGreaterThanOrEqual(LIMIT.elbow[0]);
        expect(e).toBeLessThanOrEqual(LIMIT.elbow[1]);
      }
    }
  });

  it("chân không lún sàn; chạm sàn khi không bay", () => {
    for (const t of times) {
      const low = lowestFoot(t);
      expect(low).toBeLessThanOrEqual(GROUND_Y + 0.01);
      if (t <= JUMP.takeoff || t >= JUMP.land) expect(low).toBeCloseTo(GROUND_Y, 3);
    }
    // Đang bay thì chân rời sàn thật.
    expect(lowestFoot(CONTACT_AT)).toBeLessThan(GROUND_Y - 40);
  });

  it("mặt vợt, quả cầu bay tới và đường bay đi gặp nhau đúng khung chạm", () => {
    const head = skeletonAt(CONTACT_AT).racketHead;
    expect(head.x).toBeCloseTo(CONTACT_POINT.x, 6);
    expect(head.y).toBeCloseTo(CONTACT_POINT.y, 6);
    const inc = shuttleInAt(CONTACT_AT);
    expect(inc.x).toBeCloseTo(CONTACT_POINT.x, 3);
    expect(inc.y).toBeCloseTo(CONTACT_POINT.y, 3);
    expect(inc.o).toBe(1);
    expect(shuttleInAt(CONTACT_AT + 1).o).toBe(0);
    const out = shuttleOutAt(CONTACT_AT + 0.001);
    expect(out.x).toBeCloseTo(CONTACT_POINT.x, 1);
    // Điểm chạm nằm trong khung vẽ, phía trên đầu.
    expect(CONTACT_POINT.y).toBeGreaterThan(20);
    expect(CONTACT_POINT.y).toBeLessThan(skeletonAt(CONTACT_AT).shoulder.y - 150);
  });

  it("chạm cầu đúng lúc cao nhất của cú bật", () => {
    expect((JUMP.takeoff + JUMP.land) / 2).toBe(CONTACT_AT);
    expect(KEYS.some((k) => k.at === CONTACT_AT)).toBe(true);
  });

  it("CSS sinh ra gọn", () => {
    expect(RIG_CSS.length).toBeLessThan(32_000);
    expect(RIG_CSS).toContain("@keyframes rg-root");
  });
});
