/**
 * Bộ xương (rig) và dòng thời gian của nhân vật màn mở đầu.
 *
 * Module thuần TypeScript, không React. Chạy MỘT LẦN lúc nạp module:
 *   pose theo khớp → nội suy có easing riêng từng đoạn → động học thuận
 *   (FK) để chân bám sàn và lấy đúng điểm chạm cầu → lò xo cho tóc, vợt,
 *   vạt áo → lấy mẫu → rút gọn → chuỗi CSS @keyframes.
 *
 * Vì sao ra CSS chứ không chạy rAF: màn mở đầu phải chuyển động từ khung
 * hình đầu tiên, trước khi React hydrate (xem lib/intro.ts). CSS sinh sẵn
 * thì trình duyệt tự chạy; JavaScript chỉ cần cho chế độ debug.
 *
 * Quy ước góc (độ, theo chiều kim đồng hồ như `rotate()` của SVG):
 *   - Tay, chân vẽ HƯỚNG XUỐNG (+y) tính từ khớp. Góc 0 = buông thẳng,
 *     dương = vung ra SAU (sang trái, người chơi nhìn sang phải),
 *     âm = vung ra TRƯỚC. ±180 = giơ thẳng lên.
 *   - Thân, đầu vẽ HƯỚNG LÊN (−y). Dương = cúi tới trước, âm = ngả ra sau.
 *   - Mọi góc trong Pose là góc TƯƠNG ĐỐI với khớp cha.
 */

import { INTRO_TIMING } from "@/lib/intro";

/* =================================================================== */
/* THAM SỐ TINH CHỈNH                                                    */
/* =================================================================== */

/** Một lượt cú đập (ms). Chạm cầu đúng mốc SMASH_AT để khớp bộ đếm % và đường bay vào hero. */
export const DURATION = 2480;
export const CONTACT_AT = INTRO_TIMING.SMASH_AT;

/** Khung vẽ, mặt sàn, chỗ đứng. */
export const VIEW = { w: 500, h: 720 } as const;
export const GROUND_Y = 676;
/** Chừa đủ chỗ bên trái cho vợt ở thế trophy (vợt nằm ngang sau đầu). */
export const ROOT_X = 205;

/** Độ dài xương và các điểm gắn khớp (đơn vị viewBox). */
export const BONE = {
  thigh: 90,
  shin: 88,
  /** Mắt cá tới đế giày. */
  ankleH: 9,
  /** Gót và mũi giày tính từ mắt cá, dùng để giữ chân bám sàn. */
  heel: 11,
  toe: 30,
  torso: 116,
  upperArm: 64,
  forearm: 58,
  /** Cổ tay tới tâm nắm tay, chỗ cán vợt đi qua. */
  hand: 9,
  /** Vợt tính từ tâm nắm tay: hết cán, hết thân, tâm mặt vợt. */
  grip: 26,
  shaft: 58,
  racketRx: 20,
  racketRy: 29,
  shoulder: { x: 3, y: -102 },
  neckBase: { x: 4, y: -112 },
  hipNear: { x: 3, y: 0 },
  hipFar: { x: -4, y: -2 },
  hairPivot: { x: -18, y: -44 },
  hem: { x: 0, y: 4 },
} as const;

/** Tâm mặt vợt trong hệ toạ độ của vợt. */
export const RACKET_HEAD_Y = BONE.grip + BONE.shaft + BONE.racketRy;

/** Cú bật: rời đất, chạm đất (ms), độ cao đỉnh. Đỉnh rơi đúng lúc chạm cầu. */
export const JUMP = { takeoff: 1260, land: 1940, height: 92 } as const;

/** Lò xo cho chuyển động thứ cấp: độ cứng k, giảm chấn c, hệ số trễ, biên độ tối đa. */
export const SPRING = {
  racket: { k: 2500, c: 70, gain: 0.3, max: 16 },
  hair: { k: 90, c: 7, gain: 0.8, max: 45 },
  hem: { k: 300, c: 18, gain: 0.5, max: 10 },
} as const;

/** Giới hạn tự nhiên của khớp: gối, khuỷu không gập ngược. */
export const LIMIT = {
  knee: [0, 150],
  elbow: [-160, 0],
  ankle: [-40, 50],
  head: [-40, 30],
} as const;

/* =================================================================== */
/* POSE                                                                  */
/* =================================================================== */

export type Pose = {
  /** Hông (xương chậu): xoay nhẹ theo thân. */
  pelvis: number;
  /** Thân trên, tương đối với hông. */
  torso: number;
  /** Đầu + cổ. Âm = ngẩng lên nhìn cầu. */
  head: number;
  /** Tay cầm vợt (tay phải, phía gần người xem): vai, khuỷu, cổ tay. */
  shR: number;
  elR: number;
  wrR: number;
  /** Tay không cầm vợt (phía xa): chỉ cầu, giữ thăng bằng. */
  shL: number;
  elL: number;
  /** Chân gần (phải) và chân xa (trái): hông, gối, cổ chân. */
  hipR: number;
  kneeR: number;
  ankR: number;
  hipL: number;
  kneeL: number;
  ankL: number;
};

const POSE_KEYS = [
  "pelvis",
  "torso",
  "head",
  "shR",
  "elR",
  "wrR",
  "shL",
  "elL",
  "hipR",
  "kneeR",
  "ankR",
  "hipL",
  "kneeL",
  "ankL",
] as const satisfies readonly (keyof Pose)[];

/** Các khớp của tay vợt: đi theo easing riêng (vung nhanh, chuẩn bị chậm). */
const ARM_KEYS = new Set<keyof Pose>(["shR", "elR", "wrR"]);

/*
 * Bàn chân phẳng khi pelvis + hip + knee + ank = 0. Cổ chân chỉ gập được
 * 40°, nên ống chân nghiêng tối đa ~40° nếu muốn cả bàn chân chạm sàn;
 * nghiêng hơn thì gót nhấc, đứng trên mũi chân (đúng lúc nén lấy đà).
 */

/** 1. Sẵn sàng: gối chùng, vợt giơ cao trước mặt, tay trái chỉ lên cầu. */
const READY: Pose = {
  pelvis: 0,
  torso: 8,
  head: -16,
  shR: 222,
  elR: -62,
  wrR: 8,
  shL: 207,
  elL: -8,
  hipR: 6,
  kneeR: 22,
  ankR: -28,
  hipL: -20,
  kneeL: 30,
  ankL: -10,
};

/** Nhún thở: chùng gối thêm một chút giữa nhịp sẵn sàng. */
const BREATH: Pose = {
  ...READY,
  torso: 10,
  head: -18,
  shR: 220,
  elR: -64,
  wrR: 10,
  shL: 205,
  elL: -10,
  hipR: 2,
  kneeR: 30,
  ankR: -32,
  hipL: -24,
  kneeL: 38,
  ankL: -14,
};

/** 2. Thế cúp (trophy): thân ngả sau, khuỷu nâng cao, vợt gập ra sau đầu. */
const TROPHY: Pose = {
  pelvis: -6,
  torso: -14,
  head: -26,
  shR: 185,
  elR: -45,
  wrR: -25,
  shL: 200,
  elL: -4,
  hipR: 14,
  kneeR: 30,
  ankR: -38,
  hipL: -18,
  kneeL: 34,
  ankL: -10,
};

/** Nén lấy đà (anticipation): khuỵu sâu, vợt rơi xuống sau lưng (racket drop). */
const LOAD: Pose = {
  pelvis: -4,
  torso: -10,
  head: -24,
  shR: 178,
  elR: -138,
  wrR: -28,
  shL: 196,
  elL: -6,
  hipR: -24,
  kneeR: 68,
  ankR: -40,
  hipL: -46,
  kneeL: 82,
  ankL: -32,
};

/** Rời đất: hai chân duỗi, mũi chân miết sàn, vợt vẫn chờ sau lưng. */
const TAKEOFF: Pose = {
  pelvis: 0,
  torso: -8,
  head: -24,
  shR: 182,
  elR: -128,
  wrR: -30,
  shL: 200,
  elL: -10,
  hipR: 8,
  kneeR: 10,
  ankR: 30,
  hipL: -6,
  kneeL: 8,
  ankL: 26,
};

/** 3. Chạm cầu: tay duỗi tối đa, vợt hơi vượt trước; tay trái kéo xuống; chân cắt kéo. */
const CONTACT: Pose = {
  pelvis: 4,
  torso: 2,
  head: -22,
  shR: 182,
  elR: -4,
  wrR: 8,
  shL: 290,
  elL: -70,
  hipR: -42,
  kneeR: 76,
  ankR: 22,
  hipL: 28,
  kneeL: 46,
  ankL: 18,
};

/** Bẻ cổ tay ngay sau chạm: vợt quét ra trước, thân gập theo. */
const SNAP: Pose = {
  pelvis: 6,
  torso: 16,
  head: -6,
  shR: 232,
  elR: -14,
  wrR: 34,
  shL: 300,
  elL: -95,
  hipR: -14,
  kneeR: 52,
  ankR: 16,
  hipL: 6,
  kneeL: 36,
  ankL: 14,
};

/** 4. Theo đà: vợt chéo xuống qua người, hai chân đổi chỗ, với xuống sàn. */
const FOLLOW: Pose = {
  pelvis: 8,
  torso: 24,
  head: 6,
  shR: 296,
  elR: -30,
  wrR: 30,
  shL: 315,
  elL: -100,
  hipR: 4,
  kneeR: 16,
  ankR: 4,
  hipL: -26,
  kneeL: 18,
  ankL: 6,
};

/** 5. Tiếp đất: khuỵu gối giảm chấn (squash), tay buông theo đà. */
const LAND: Pose = {
  pelvis: 4,
  torso: 18,
  head: 0,
  shR: 308,
  elR: -36,
  wrR: 20,
  shL: 300,
  elL: -60,
  hipR: -26,
  kneeR: 62,
  ankR: -40,
  hipL: -50,
  kneeL: 84,
  ankL: -38,
};

/* =================================================================== */
/* EASING VÀ DÒNG THỜI GIAN                                              */
/* =================================================================== */

type Ease = (t: number) => number;

export const EASE = {
  /** Nhún, thở, chuyển thế chậm. */
  sine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  inOut: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  /** Bật lên, giảm tốc tự nhiên. */
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  /** Vung vợt: tăng tốc tới đúng khung chạm cầu. */
  in: (t: number) => t * t,
} satisfies Record<string, Ease>;

type Key = {
  at: number;
  /** Tên pha, hiện ở chế độ debug. */
  name: string;
  pose: Pose;
  /** Easing của đoạn ĐI TỚI key này. */
  ease: Ease;
  /** Easing riêng cho tay vợt trên đoạn này, nếu khác thân. */
  easeArm?: Ease;
};

export const KEYS: readonly Key[] = [
  { at: 0, name: "Sẵn sàng", pose: READY, ease: EASE.sine },
  { at: 240, name: "Sẵn sàng: nhún thở", pose: BREATH, ease: EASE.sine },
  { at: 480, name: "Sẵn sàng", pose: READY, ease: EASE.sine },
  { at: 900, name: "Vung ra sau (trophy)", pose: TROPHY, ease: EASE.inOut },
  { at: 1180, name: "Nén lấy đà", pose: LOAD, ease: EASE.inOut },
  { at: JUMP.takeoff, name: "Bật nhảy", pose: TAKEOFF, ease: EASE.outQuad },
  {
    at: CONTACT_AT,
    name: "Chạm cầu",
    pose: CONTACT,
    ease: EASE.out,
    easeArm: EASE.in,
  },
  { at: 1740, name: "Bẻ cổ tay", pose: SNAP, ease: EASE.inOut, easeArm: EASE.outQuad },
  { at: 1900, name: "Theo đà", pose: FOLLOW, ease: EASE.out },
  { at: 2120, name: "Tiếp đất", pose: LAND, ease: EASE.out },
  { at: DURATION, name: "Về thế sẵn sàng", pose: READY, ease: EASE.inOut },
];

const clamp = (v: number, [lo, hi]: readonly [number, number]) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** Đoạn chứa thời điểm t. */
export function segmentAt(t: number) {
  const tt = Math.min(DURATION, Math.max(0, t));
  let i = 1;
  while (i < KEYS.length - 1 && KEYS[i].at < tt) i++;
  return { from: KEYS[i - 1], to: KEYS[i] };
}

/** Pose tại thời điểm t (ms): nội suy giữa hai key, rồi khoá khớp trong giới hạn. */
export function poseAt(t: number): Pose {
  const { from, to } = segmentAt(t);
  const u = (Math.min(DURATION, Math.max(0, t)) - from.at) / (to.at - from.at);
  const eBody = to.ease(u);
  const eArm = (to.easeArm ?? to.ease)(u);
  const p = {} as Pose;
  for (const k of POSE_KEYS) {
    p[k] = lerp(from.pose[k], to.pose[k], ARM_KEYS.has(k) ? eArm : eBody);
  }
  p.kneeR = clamp(p.kneeR, LIMIT.knee);
  p.kneeL = clamp(p.kneeL, LIMIT.knee);
  p.elR = clamp(p.elR, LIMIT.elbow);
  p.elL = clamp(p.elL, LIMIT.elbow);
  p.ankR = clamp(p.ankR, LIMIT.ankle);
  p.ankL = clamp(p.ankL, LIMIT.ankle);
  p.head = clamp(p.head, LIMIT.head);
  return p;
}

/* =================================================================== */
/* ĐỘNG HỌC THUẬN (FK): cùng phép biến đổi với cây <g> trong SVG         */
/* =================================================================== */

type Mat = readonly [number, number, number, number, number, number];
export type Pt = { x: number; y: number };

const I: Mat = [1, 0, 0, 1, 0, 0];

function mul(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}
const tr = (m: Mat, x: number, y: number) => mul(m, [1, 0, 0, 1, x, y]);
const rot = (m: Mat, deg: number) => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return mul(m, [c, s, -s, c, 0, 0]);
};
const pt = (m: Mat, x: number, y: number): Pt => ({
  x: m[0] * x + m[2] * y + m[4],
  y: m[1] * x + m[3] * y + m[5],
});

export type Lag = { racket: number; hair: number; hem: number };
const NO_LAG: Lag = { racket: 0, hair: 0, hem: 0 };

/** Toạ độ thế giới (viewBox) của các khớp, gót/mũi giày và tâm mặt vợt. */
export function skeleton(p: Pose, x: number, y: number, lag: Lag = NO_LAG) {
  const root = tr(I, x, y);
  const hips = rot(root, p.pelvis);
  const leg = (h: Pt, hip: number, knee: number, ank: number) => {
    const th = rot(tr(hips, h.x, h.y), hip);
    const sh = rot(tr(th, 0, BONE.thigh), knee);
    const ft = rot(tr(sh, 0, BONE.shin), ank);
    return {
      hip: pt(th, 0, 0),
      knee: pt(sh, 0, 0),
      ankle: pt(ft, 0, 0),
      heel: pt(ft, -BONE.heel, BONE.ankleH),
      toe: pt(ft, BONE.toe, BONE.ankleH),
    };
  };
  const torso = rot(hips, p.torso);
  const shoulder = tr(torso, BONE.shoulder.x, BONE.shoulder.y);
  const upper = rot(shoulder, p.shR);
  const fore = rot(tr(upper, 0, BONE.upperArm), p.elR);
  const hand = rot(tr(fore, 0, BONE.forearm), p.wrR);
  const racket = rot(tr(hand, 0, BONE.hand), lag.racket);
  return {
    legR: leg(BONE.hipNear, p.hipR, p.kneeR, p.ankR),
    legL: leg(BONE.hipFar, p.hipL, p.kneeL, p.ankL),
    shoulder: pt(shoulder, 0, 0),
    elbow: pt(fore, 0, 0),
    wrist: pt(hand, 0, 0),
    grip: pt(racket, 0, 0),
    racketHead: pt(racket, 0, RACKET_HEAD_Y),
  };
}

/** Khoảng từ gốc (hông) xuống điểm thấp nhất của hai bàn chân. */
export function reach(p: Pose) {
  const s = skeleton(p, 0, 0);
  return Math.max(s.legR.heel.y, s.legR.toe.y, s.legL.heel.y, s.legL.toe.y);
}

const REST_REACH = reach(READY);
const REACH_TAKEOFF = reach(poseAt(JUMP.takeoff));
const REACH_LAND = reach(poseAt(JUMP.land));

/** Độ cao bay: parabol thật (lên chậm dần, xuống nhanh dần), đỉnh ở giữa cú bật. */
export function airAt(t: number) {
  if (t <= JUMP.takeoff || t >= JUMP.land) return 0;
  const mid = (JUMP.takeoff + JUMP.land) / 2;
  const half = (JUMP.land - JUMP.takeoff) / 2;
  const u = (t - mid) / half;
  return JUMP.height * (1 - u * u);
}

/**
 * Toạ độ y của gốc. Khi đứng: hạ gốc cho điểm thấp nhất của bàn chân chạm
 * đúng mặt sàn (gối chùng thì người tự thấp xuống, không bao giờ lún hay
 * lơ lửng). Khi bay: chiều dài chân chuyển mượt từ lúc rời đất sang lúc
 * chạm đất, cộng độ cao bay, để quỹ đạo hông đúng parabol.
 */
export function rootYAt(t: number) {
  if (t <= JUMP.takeoff || t >= JUMP.land) return GROUND_Y - reach(poseAt(t));
  const s = smooth((t - JUMP.takeoff) / (JUMP.land - JUMP.takeoff));
  return GROUND_Y - lerp(REACH_TAKEOFF, REACH_LAND, s) - airAt(t);
}

/* =================================================================== */
/* CHUYỂN ĐỘNG THỨ CẤP: lò xo trễ nhịp so với khớp cha                   */
/* =================================================================== */

const SIM_HZ = 240;
const SIM_N = Math.round((DURATION / 1000) * SIM_HZ);

function worldAngles(p: Pose) {
  const torso = p.pelvis + p.torso;
  return { torso, head: torso + p.head, hand: torso + p.shR + p.elR + p.wrR };
}

/** Giới hạn mềm: càng gần biên càng khó tăng, không có điểm gãy. */
const soft = (v: number, max: number) => max * Math.tanh(v / max);

/*
 * Mô phỏng một lần lúc nạp module, bước cố định 1/240 giây. Chạy hai vòng
 * và giữ vòng sau, để trạng thái lò xo ở khung đầu đúng bằng khung cuối:
 * phát lặp lại (chế độ debug) không có cú giật ở mối nối.
 */
const LAGS: Lag[] = (() => {
  const dt = 1 / SIM_HZ;
  const st = {
    racket: { x: 0, v: 0 },
    hair: { x: 0, v: 0 },
    hem: { x: 0, v: 0 },
  };
  const w0 = worldAngles(READY);
  st.racket.x = w0.hand;
  st.hair.x = w0.head;
  st.hem.x = w0.torso;
  let out: Lag[] = [];
  for (let pass = 0; pass < 2; pass++) {
    out = [];
    for (let i = 0; i <= SIM_N; i++) {
      const w = worldAngles(poseAt((i / SIM_N) * DURATION));
      const step = (
        s: { x: number; v: number },
        target: number,
        k: number,
        c: number,
      ) => {
        s.v += (k * (target - s.x) - c * s.v) * dt;
        s.x += s.v * dt;
      };
      step(st.racket, w.hand, SPRING.racket.k, SPRING.racket.c);
      step(st.hair, w.head, SPRING.hair.k, SPRING.hair.c);
      step(st.hem, w.torso, SPRING.hem.k, SPRING.hem.c);
      out.push({
        racket: soft(SPRING.racket.gain * (st.racket.x - w.hand), SPRING.racket.max),
        hair: soft(SPRING.hair.gain * (st.hair.x - w.head), SPRING.hair.max),
        hem: soft(SPRING.hem.gain * (st.hem.x - w.torso), SPRING.hem.max),
      });
    }
  }
  return out;
})();

export function lagAt(t: number): Lag {
  const f = (Math.min(DURATION, Math.max(0, t)) / DURATION) * SIM_N;
  const i = Math.min(SIM_N - 1, Math.floor(f));
  const u = f - i;
  const a = LAGS[i];
  const b = LAGS[i + 1];
  return {
    racket: lerp(a.racket, b.racket, u),
    hair: lerp(a.hair, b.hair, u),
    hem: lerp(a.hem, b.hem, u),
  };
}

/** Tóc đuôi ngựa buông theo trọng lực: bù một nửa góc đầu, cộng độ trễ. */
const HAIR_REST = 28;
const HEAD_W0 = worldAngles(READY).head;
export function hairAt(t: number) {
  const w = worldAngles(poseAt(t));
  return HAIR_REST - 0.5 * (w.head - HEAD_W0) + lagAt(t).hair;
}

/* =================================================================== */
/* CẢNH: điểm chạm, quả cầu, chớp sáng, vệt vung, bóng đổ                 */
/* =================================================================== */

export function skeletonAt(t: number) {
  return skeleton(poseAt(t), ROOT_X, rootYAt(t), lagAt(t));
}

/** Tâm mặt vợt đúng khung chạm cầu. Mọi thứ khác neo vào điểm này. */
export const CONTACT_POINT: Pt = skeletonAt(CONTACT_AT).racketHead;

type Bez = [Pt, Pt, Pt];
const quad = ([a, b, c]: Bez, u: number): Pt => {
  const m = 1 - u;
  return {
    x: m * m * a.x + 2 * m * u * b.x + u * u * c.x,
    y: m * m * a.y + 2 * m * u * b.y + u * u * c.y,
  };
};
const quadTan = ([a, b, c]: Bez, u: number): Pt => ({
  x: 2 * (1 - u) * (b.x - a.x) + 2 * u * (c.x - b.x),
  y: 2 * (1 - u) * (b.y - a.y) + 2 * u * (c.y - b.y),
});
/** Góc để đế cầu (hướng +y của hình quả cầu) đi trước theo hướng bay. */
const corkFirst = (v: Pt) => (Math.atan2(v.y, v.x) * 180) / Math.PI - 90;

const C = CONTACT_POINT;
/** Quả cầu rơi tới từ trên cao bên phải. */
const IN_PATH: Bez = [
  { x: C.x + 175, y: C.y - 150 },
  { x: C.x + 60, y: C.y - 125 },
  C,
];
const IN_START = 200;
/** Đường bay dự phòng sau cú đập (khi JavaScript chưa kịp dựng đường bay vào hero). */
const OUT_PATH: Bez = [
  C,
  { x: C.x + 260, y: C.y - 130 },
  { x: C.x + 540, y: C.y + 40 },
];
const OUT_END = 2400;

export function shuttleInAt(t: number) {
  const s = Math.min(1, Math.max(0, (t - IN_START) / (CONTACT_AT - IN_START)));
  // Cầu rơi gần như ở vận tốc giới hạn: chỉ hơi nhanh dần.
  const u = Math.pow(s, 1.15);
  const p = quad(IN_PATH, u);
  const o = t > CONTACT_AT ? 0 : EASE.sine(Math.min(1, Math.max(0, (t - 120) / 220)));
  return { x: p.x, y: p.y, r: corkFirst(quadTan(IN_PATH, Math.max(u, 0.001))), o };
}

export function shuttleOutAt(t: number) {
  const s = Math.min(1, Math.max(0, (t - CONTACT_AT) / (OUT_END - CONTACT_AT)));
  // Rời vợt rất nhanh rồi chậm dần vì lực cản.
  const u = EASE.outQuad(s);
  const p = quad(OUT_PATH, u);
  const o =
    t <= CONTACT_AT ? 0 : 1 - EASE.sine(Math.min(1, Math.max(0, (t - 2100) / 300)));
  return { x: p.x, y: p.y, r: corkFirst(quadTan(OUT_PATH, Math.min(u, 0.999))), o };
}

export function impactAt(t: number) {
  if (t < CONTACT_AT - 15) return { s: 0.2, o: 0 };
  if (t <= CONTACT_AT) {
    const u = (t - (CONTACT_AT - 15)) / 15;
    return { s: lerp(0.2, 1.1, u), o: u };
  }
  const u = Math.min(1, (t - CONTACT_AT) / 360);
  return { s: lerp(1.1, 2.4, EASE.out(u)), o: 1 - EASE.out(u) };
}

/** Vệt vung: chính quỹ đạo mặt vợt từ cuối cú vung tới hết pha bẻ cổ tay. */
const SWOOSH_FROM = 1380;
const SWOOSH_TO = 1720;
const SWOOSH_PTS: { t: number; p: Pt; len: number }[] = (() => {
  const out: { t: number; p: Pt; len: number }[] = [];
  for (let t = SWOOSH_FROM; t <= SWOOSH_TO; t += 10) {
    const p = skeletonAt(t).racketHead;
    const prev = out[out.length - 1];
    out.push({ t, p, len: prev ? prev.len + Math.hypot(p.x - prev.p.x, p.y - prev.p.y) : 0 });
  }
  return out;
})();
const SWOOSH_LEN = SWOOSH_PTS[SWOOSH_PTS.length - 1].len || 1;

export const SWOOSH_D = SWOOSH_PTS.map(
  ({ p }, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
).join("");

export function swooshAt(t: number) {
  // Vệt mọc theo đúng vị trí mặt vợt (pathLength = 1), rồi tan.
  let drawn = 0;
  if (t >= SWOOSH_TO) drawn = 1;
  else if (t > SWOOSH_FROM) {
    const f = (t - SWOOSH_FROM) / 10;
    const i = Math.floor(f);
    drawn =
      lerp(SWOOSH_PTS[i].len, SWOOSH_PTS[i + 1].len, f - i) / SWOOSH_LEN;
  }
  let o = 0;
  if (t > SWOOSH_FROM && t <= CONTACT_AT) o = EASE.sine(Math.min(1, (t - SWOOSH_FROM) / 60));
  else if (t > CONTACT_AT) o = 1 - EASE.sine(Math.min(1, (t - CONTACT_AT) / 320));
  return { off: 1 - drawn, o };
}

/** Bóng đổ: nhỏ và nhạt khi bay cao, giãn ra khi khuỵu gối. */
export function shadowAt(t: number) {
  const air = airAt(t) / JUMP.height;
  const crouch =
    air > 0 ? 0 : Math.min(1, Math.max(0, (REST_REACH - reach(poseAt(t))) / 40));
  const fade = rootOpacityAt(t);
  return {
    sx: (1 - 0.5 * air) * (1 + 0.18 * crouch),
    sy: (1 - 0.35 * air) * (1 + 0.1 * crouch),
    o: (0.9 - 0.6 * air) * fade,
  };
}

export function rootOpacityAt(t: number) {
  return EASE.sine(Math.min(1, Math.max(0, t / 260)));
}

/* =================================================================== */
/* LẤY MẪU → CSS                                                          */
/* =================================================================== */

type Track = {
  name: string;
  at: (t: number) => number[];
  /** Sai số cho phép khi rút gọn, theo từng thành phần. */
  tol: number[];
  css: (v: number[]) => string;
};

const n1 = (v: number) => String(Number(v.toFixed(1)));
const n3 = (v: number) => String(Number(v.toFixed(3)));
const rotate = (v: number[]) => `rotate:${n1(v[0])}deg`;
/** 0,35° là dưới mức mắt phân biệt ở cỡ nhân vật này. */
const ANGLE_TOL = [0.35];

const angleTrack = (name: keyof Pose): Track => ({
  name,
  at: (t) => [poseAt(t)[name]],
  tol: ANGLE_TOL,
  css: rotate,
});

const placed = (v: number[]) =>
  `translate:${n1(v[0])}px ${n1(v[1])}px;rotate:${n1(v[2])}deg;opacity:${n3(v[3])}`;

export const TRACKS: Track[] = [
  {
    name: "root",
    at: (t) => [ROOT_X, rootYAt(t), rootOpacityAt(t)],
    tol: [0.35, 0.35, 0.01],
    css: (v) => `translate:${n1(v[0])}px ${n1(v[1])}px;opacity:${n3(v[2])}`,
  },
  ...POSE_KEYS.map(angleTrack),
  { name: "racket", at: (t) => [lagAt(t).racket], tol: ANGLE_TOL, css: rotate },
  { name: "hair", at: (t) => [hairAt(t)], tol: [0.6], css: rotate },
  { name: "hem", at: (t) => [lagAt(t).hem], tol: [0.4], css: rotate },
  {
    name: "shadow",
    at: (t) => {
      const s = shadowAt(t);
      return [s.sx, s.sy, s.o];
    },
    tol: [0.006, 0.006, 0.01],
    css: (v) => `scale:${n3(v[0])} ${n3(v[1])};opacity:${n3(v[2])}`,
  },
  {
    name: "shin",
    at: (t) => {
      const s = shuttleInAt(t);
      return [s.x, s.y, s.r, s.o];
    },
    tol: [0.5, 0.5, 0.8, 0.012],
    css: placed,
  },
  {
    name: "shout",
    at: (t) => {
      const s = shuttleOutAt(t);
      return [s.x, s.y, s.r, s.o];
    },
    tol: [0.5, 0.5, 0.8, 0.012],
    css: placed,
  },
  {
    name: "impact",
    at: (t) => {
      const s = impactAt(t);
      return [s.s, s.o];
    },
    tol: [0.01, 0.01],
    css: (v) => `scale:${n3(v[0])};opacity:${n3(v[1])}`,
  },
  {
    name: "swoosh",
    at: (t) => {
      const s = swooshAt(t);
      return [s.off, s.o];
    },
    tol: [0.004, 0.01],
    css: (v) => `stroke-dashoffset:${n3(v[0])};opacity:${n3(v[1])}`,
  },
];

/** Lưới 120 Hz, cộng mọi mốc key, cộng hai mẫu sát nhau ở khung chạm (bước nhảy của quả cầu). */
const SAMPLE_TIMES: number[] = (() => {
  const set = new Set<number>();
  const step = 1000 / 120;
  for (let t = 0; t < DURATION; t += step) set.add(Number(t.toFixed(3)));
  for (const k of KEYS) set.add(k.at);
  for (const t of [JUMP.takeoff, JUMP.land, SWOOSH_FROM, SWOOSH_TO, CONTACT_AT - 15, CONTACT_AT + 0.5]) {
    set.add(t);
  }
  set.add(DURATION);
  return [...set].sort((a, b) => a - b);
})();

/**
 * Bỏ những mẫu nằm gần đúng trên đoạn thẳng nối hai mẫu giữ lại. Đường
 * cong vẫn y nguyên trong sai số, chỉ CSS ngắn đi nhiều lần. Easing đã
 * nằm sẵn trong giá trị mẫu, nên giữa các mẫu CSS chạy `linear`.
 */
function simplify(times: number[], vals: number[][], tol: number[]) {
  const keep = [0];
  let a = 0;
  for (let b = 2; b < times.length; b++) {
    let ok = true;
    for (let i = a + 1; i < b && ok; i++) {
      const u = (times[i] - times[a]) / (times[b] - times[a]);
      for (let c = 0; c < tol.length; c++) {
        if (Math.abs(lerp(vals[a][c], vals[b][c], u) - vals[i][c]) > tol[c]) {
          ok = false;
          break;
        }
      }
    }
    if (!ok) {
      a = b - 1;
      keep.push(a);
    }
  }
  keep.push(times.length - 1);
  return keep;
}

function buildCss(): string {
  const pct = (t: number) => `${n3((t / DURATION) * 100)}%`;
  const rules: string[] = [
    ".rg{transform-box:view-box;transform-origin:0 0}",
    // Đường bay dự phòng chỉ hiện khi JS không dựng được đường bay vào hero.
    '.intro[data-flight="js"] .rg-shout{display:none}',
  ];
  for (const track of TRACKS) {
    const vals = SAMPLE_TIMES.map(track.at);
    const keep = simplify(SAMPLE_TIMES, vals, track.tol);
    // Dáng đứng yên khi không chạy: thế sẵn sàng, hiện rõ.
    const rest = track.name === "root" ? [ROOT_X, rootYAt(0), 1] : track.at(0);
    rules.push(`.rg-${track.name}{${track.css(rest)}}`);
    rules.push(
      `html[data-intro="play"] .rg-${track.name}{animation:rg-${track.name} ${DURATION}ms linear both}`,
    );
    rules.push(
      `@keyframes rg-${track.name}{${keep
        .map((i) => `${pct(SAMPLE_TIMES[i])}{${track.css(vals[i])}}`)
        .join("")}}`,
    );
  }
  return rules.join("\n");
}

export const RIG_CSS = buildCss();

/** Vị trí điểm chạm theo % hộp nhân vật (cho mốc đo `.intro-racket`). */
export const CONTACT_PCT = {
  x: `${((C.x / VIEW.w) * 100).toFixed(2)}%`,
  y: `${((C.y / VIEW.h) * 100).toFixed(2)}%`,
};
