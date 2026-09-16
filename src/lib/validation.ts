import { z } from "zod";

import {
  CHALLENGE_FORMATS,
  CHALLENGE_FORMAT_KEYS,
  LIMITS,
  MAX_POINTS,
  MAX_STAKE_QTY,
  MIN_POINTS,
  POST_TYPE_KEYS,
  REACTION_KEYS,
  SKILL_LEVEL_KEYS,
  SPORT_KEYS,
  STAKES,
  STAKE_KEYS,
} from "@/lib/constants";
import { parseMapUrl } from "@/lib/maps";

/* ------------------------------------------------------------------ */
/* Tien ich                                                            */
/* ------------------------------------------------------------------ */

/** Chuỗi bắt buộc, tự trim, chặn chuỗi rỗng. */
const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} không được để trống.`)
    .max(max, `${label} tối đa ${max} ký tự.`);

/** Chuỗi tuỳ chọn: "" và khoảng trắng đều thành null. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} tối đa ${max} ký tự.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null);

/** Nhận chuỗi từ input datetime-local và đổi sang Date. */
const dateTimeField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} không được để trống.`)
    .transform((value, ctx) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({ code: "custom", message: `${label} không hợp lệ.` });
        return z.NEVER;
      }
      return parsed;
    });

const optionalDateTimeField = (label: string) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({ code: "custom", message: `${label} không hợp lệ.` });
        return z.NEVER;
      }
      return parsed;
    })
    .nullable()
    .default(null);

const optionalInt = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) {
        ctx.addIssue({ code: "custom", message: `${label} phải là số nguyên.` });
        return z.NEVER;
      }
      if (parsed < min || parsed > max) {
        ctx.addIssue({
          code: "custom",
          message: `${label} phải trong khoảng ${min} – ${max}.`,
        });
        return z.NEVER;
      }
      return parsed;
    })
    .nullable()
    .default(null);

const uuidField = z.string().uuid("Định danh không hợp lệ.");

/** Cho phép chậm 5 phút so với hiện tại, tránh lệch đồng hồ client/server. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Ho so                                                               */
/* ------------------------------------------------------------------ */

export const profileSchema = z.object({
  fullName: requiredText(LIMITS.fullName, "Họ tên"),
  department: optionalText(80, "Phòng ban"),
  skillLevel: z.enum(SKILL_LEVEL_KEYS as [string, ...string[]]),
  bio: optionalText(LIMITS.bio, "Giới thiệu"),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/* ------------------------------------------------------------------ */
/* Dang nhap / dang ky                                                 */
/* ------------------------------------------------------------------ */

export const signInSchema = z.object({
  email: z.email("Email không hợp lệ.").trim().toLowerCase(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export const signUpSchema = z.object({
  email: z.email("Email không hợp lệ.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự.")
    .max(72, "Mật khẩu tối đa 72 ký tự."),
  fullName: requiredText(LIMITS.fullName, "Họ tên"),
});

/* ------------------------------------------------------------------ */
/* Buoi tap                                                            */
/* ------------------------------------------------------------------ */

/** Checkbox: có mặt trong FormData nghĩa là được tick. */
const checkboxField = z
  .union([z.string(), z.undefined()])
  .transform((v) => v === "on" || v === "true" || v === "1");

/** Link Google Maps dán tay — chỉ nhận đúng tên miền của Google. */
const mapUrlField = z
  .string()
  .trim()
  .max(600, "Link bản đồ quá dài.")
  .transform((v, ctx) => {
    if (v === "") return null;
    if (!parseMapUrl(v)) {
      ctx.addIssue({
        code: "custom",
        message: "Cần là link Google Maps (google.com hoặc maps.app.goo.gl).",
      });
      return z.NEVER;
    }
    return v;
  })
  .nullable()
  .default(null);

export const playSessionSchema = z
  .object({
    sport: z.enum(SPORT_KEYS as [string, ...string[]]),
    title: requiredText(LIMITS.sessionTitle, "Tên buổi tập"),
    venueName: requiredText(LIMITS.venueName, "Địa điểm"),
    venueAddress: optionalText(LIMITS.venueAddress, "Địa chỉ"),
    mapUrl: mapUrlField,
    showMap: checkboxField,
    startsAt: dateTimeField("Giờ bắt đầu"),
    endsAt: dateTimeField("Giờ kết thúc"),
    maxPlayers: optionalInt("Số người tối đa", 2, 100),
    costTotal: optionalInt("Tổng tiền sân", 0, 100_000_000),
    notes: optionalText(LIMITS.sessionNotes, "Ghi chú"),
  })
  .refine((v) => v.endsAt.getTime() > v.startsAt.getTime(), {
    message: "Giờ kết thúc phải sau giờ bắt đầu.",
    path: ["endsAt"],
  })
  .refine((v) => v.startsAt.getTime() > Date.now() - CLOCK_SKEW_MS, {
    message: "Không thể tạo buổi tập trong quá khứ.",
    path: ["startsAt"],
  });

export type PlaySessionInput = z.infer<typeof playSessionSchema>;

/* ------------------------------------------------------------------ */
/* Keo                                                                 */
/* ------------------------------------------------------------------ */

export const challengeSchema = z
  .object({
    sport: z.enum(SPORT_KEYS as [string, ...string[]]),
    format: z.enum(CHALLENGE_FORMAT_KEYS as [string, ...string[]]),
    kind: z.enum(["open", "direct"]),
    title: requiredText(LIMITS.challengeTitle, "Tên kèo"),
    description: optionalText(LIMITS.challengeDescription, "Mô tả"),
    pointsTarget: optionalInt("Số điểm", MIN_POINTS, MAX_POINTS),
    stakeType: z.enum(STAKE_KEYS as [string, ...string[]]),
    stakeQty: z.coerce
      .number()
      .int("Số lượng phải là số nguyên.")
      .min(1, "Số lượng tối thiểu là 1.")
      .max(MAX_STAKE_QTY, `Số lượng tối đa là ${MAX_STAKE_QTY}.`)
      .default(1),
    stakeNote: optionalText(LIMITS.stakeNote, "Ghi chú phần thưởng"),
    sessionId: uuidField.nullable().default(null),
    playDeadline: optionalDateTimeField("Hạn đánh"),
    /** Đồng đội cùng đội A (chỉ dùng cho 2v2). */
    partnerId: uuidField.nullable().default(null),
    /** Người bị thách đấu, thuộc đội B (bắt buộc khi kind = direct). */
    opponentIds: z.array(uuidField).default([]),
  })
  .superRefine((v, ctx) => {
    const format = v.format as keyof typeof CHALLENGE_FORMATS;
    const spec = CHALLENGE_FORMATS[format];

    if (format !== "free" && v.pointsTarget === null) {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng nhập số điểm của kèo.",
        path: ["pointsTarget"],
      });
    }

    if (v.stakeType === "khac" && !v.stakeNote) {
      ctx.addIssue({
        code: "custom",
        message: 'Chọn "Khác" thì phải ghi rõ phần thưởng.',
        path: ["stakeNote"],
      });
    }

    if (format !== "2v2" && v.partnerId) {
      ctx.addIssue({
        code: "custom",
        message: "Chỉ kèo 2v2 mới có đồng đội.",
        path: ["partnerId"],
      });
    }

    const expectedOpponents = spec.playersPerTeam;

    if (v.kind === "direct") {
      if (v.opponentIds.length !== expectedOpponents) {
        ctx.addIssue({
          code: "custom",
          message: `Kèo thách đích danh ${spec.label} cần chọn đúng ${expectedOpponents} đối thủ.`,
          path: ["opponentIds"],
        });
      }
    } else if (v.opponentIds.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Kèo mở không chọn trước đối thủ.",
        path: ["opponentIds"],
      });
    }

    const picked = [...v.opponentIds, ...(v.partnerId ? [v.partnerId] : [])];
    if (new Set(picked).size !== picked.length) {
      ctx.addIssue({
        code: "custom",
        message: "Không thể chọn trùng người.",
        path: ["opponentIds"],
      });
    }

    if (
      v.playDeadline &&
      v.playDeadline.getTime() < Date.now() - CLOCK_SKEW_MS
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Hạn đánh không thể ở quá khứ.",
        path: ["playDeadline"],
      });
    }
  })
  .transform((v) => ({
    ...v,
    // Kèo danh dự luôn là 1 phần, không đếm số lượng.
    stakeQty: STAKES[v.stakeType as keyof typeof STAKES].createsDebt
      ? v.stakeQty
      : 1,
    pointsTarget: v.format === "free" ? null : v.pointsTarget,
  }));

export type ChallengeInput = z.infer<typeof challengeSchema>;

export const joinChallengeSchema = z.object({
  challengeId: uuidField,
  team: z.enum(["A", "B"]),
});

/* ------------------------------------------------------------------ */
/* Ket qua                                                             */
/* ------------------------------------------------------------------ */

export const resultSchema = z
  .object({
    challengeId: uuidField,
    winningTeam: z.enum(["A", "B"]),
    scoreA: optionalInt("Điểm đội A", 0, MAX_POINTS),
    scoreB: optionalInt("Điểm đội B", 0, MAX_POINTS),
    notes: optionalText(LIMITS.resultNote, "Ghi chú"),
  })
  .superRefine((v, ctx) => {
    const bothScores = v.scoreA !== null && v.scoreB !== null;
    if (!bothScores) return;

    if (v.scoreA === v.scoreB) {
      ctx.addIssue({
        code: "custom",
        message: "Tỉ số không thể hoà — kèo phải có đội thắng.",
        path: ["scoreB"],
      });
      return;
    }

    const winnerScore = v.winningTeam === "A" ? v.scoreA! : v.scoreB!;
    const loserScore = v.winningTeam === "A" ? v.scoreB! : v.scoreA!;
    if (winnerScore < loserScore) {
      ctx.addIssue({
        code: "custom",
        message: "Đội thắng phải có điểm cao hơn đội thua.",
        path: ["winningTeam"],
      });
    }
  });

export const disputeSchema = z.object({
  challengeId: uuidField,
  reason: requiredText(LIMITS.disputeReason, "Lý do không đồng ý"),
});

export const cancelChallengeSchema = z.object({
  challengeId: uuidField,
  reason: optionalText(LIMITS.cancelReason, "Lý do huỷ"),
});

/* ------------------------------------------------------------------ */
/* Bang tin                                                            */
/* ------------------------------------------------------------------ */

export const postSchema = z.object({
  content: requiredText(LIMITS.postContent, "Nội dung bài viết"),
  type: z.enum(POST_TYPE_KEYS as [string, ...string[]]).default("text"),
  challengeId: uuidField.nullable().default(null),
  sessionId: uuidField.nullable().default(null),
});

export const commentSchema = z.object({
  postId: uuidField,
  content: requiredText(LIMITS.commentContent, "Bình luận"),
});

export const reactionSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: uuidField,
  type: z.enum(REACTION_KEYS as [string, ...string[]]),
});

/* ------------------------------------------------------------------ */
/* Doc FormData                                                        */
/* ------------------------------------------------------------------ */

/**
 * Chuyển FormData thành object phẳng cho Zod.
 * Trường lặp lại (checkbox, multi-select) gom thành mảng.
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    const cleanKey = key.endsWith("[]") ? key.slice(0, -2) : key;
    const isArrayKey = key.endsWith("[]");

    if (cleanKey in out || isArrayKey) {
      const current = out[cleanKey];
      if (Array.isArray(current)) current.push(value);
      else if (current === undefined) out[cleanKey] = [value];
      else out[cleanKey] = [current, value];
    } else {
      out[cleanKey] = value;
    }
  }
  return out;
}

/** Gom lỗi Zod thành map field -> thông điệp đầu tiên. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
