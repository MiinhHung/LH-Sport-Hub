/**
 * Cau hinh & hang so dung chung cho LH Sport Hub.
 * Moi gioi han / danh sach lua chon deu tap trung o day de de chinh sua.
 */

export const APP_NAME = "LH Sport Hub";
export const APP_DESCRIPTION =
  "Cong dong the thao noi bo: buoi tap, keo thach dau va cam nang cau long.";

/* ------------------------------------------------------------------ */
/* Video nen                                                           */
/* ------------------------------------------------------------------ */

/**
 * Video chay nen o trang dang nhap / dang ky va dau trang Cam nang.
 *
 * Co hai che do, `file` duoc uu tien neu co:
 *
 *  - `file`      duong dan toi mp4 dat trong `public/`. Muot nhat: khong tai
 *                JS ben ngoai, lap lien mach, khong bao gio bi chen quang cao.
 *  - `youtubeId` nhung tu YouTube. Chay ngay khong can chuan bi gi, doi lai
 *                phai tai trinh phat cua YouTube va YouTube co quyen chen
 *                quang cao vao video cua nguoi khac.
 *
 * `poster` hien trong luc video chua kip chay nen hay chon mot khung hinh
 * giong video de khong thay cu nhay.
 */
export const HERO_VIDEO = {
  /** Vi du: "/videos/hero.mp4" (tao thu muc `public/videos` roi bo file vao). */
  file: null as string | null,
  youtubeId: "J8X27fNXnaw" as string | null,
  poster: "/images/feed-1.jpg",
};

/* ------------------------------------------------------------------ */
/* Mon the thao                                                        */
/* ------------------------------------------------------------------ */

export const SPORTS = {
  cau_long: { label: "Cầu lông", icon: "🏸" },
  boi: { label: "Bơi", icon: "🏊" },
  khac: { label: "Khác", icon: "🤾" },
} as const;

export type SportKey = keyof typeof SPORTS;
export const SPORT_KEYS = Object.keys(SPORTS) as SportKey[];

/* ------------------------------------------------------------------ */
/* Trinh do                                                            */
/* ------------------------------------------------------------------ */

export const SKILL_LEVELS = {
  moi_tap: { label: "Mới tập", short: "Mới", order: 1 },
  trung_binh: { label: "Trung bình", short: "TB", order: 2 },
  kha: { label: "Khá", short: "Khá", order: 3 },
  tot: { label: "Tốt", short: "Tốt", order: 4 },
} as const;

export type SkillLevelKey = keyof typeof SKILL_LEVELS;
export const SKILL_LEVEL_KEYS = Object.keys(SKILL_LEVELS) as SkillLevelKey[];

/* ------------------------------------------------------------------ */
/* Phan thuong cua keo                                                 */
/* ------------------------------------------------------------------ */

/**
 * `unit` la don vi dem duoc => so no tong hop duoc ("no 4 bua sang").
 * `createsDebt = false` nghia la keo khong sinh no (vi du keo danh du).
 */
export const STAKES = {
  nuoc: {
    label: "Chai nước",
    unit: "chai nước",
    icon: "💧",
    defaultQty: 2,
    createsDebt: true,
  },
  an_sang: {
    label: "Bữa sáng",
    unit: "bữa sáng",
    icon: "🍜",
    defaultQty: 1,
    createsDebt: true,
  },
  tra_sua: {
    label: "Trà sữa",
    unit: "ly trà sữa",
    icon: "🧋",
    defaultQty: 1,
    createsDebt: true,
  },
  ca_phe: {
    label: "Cà phê",
    unit: "ly cà phê",
    icon: "☕",
    defaultQty: 1,
    createsDebt: true,
  },
  ong_cau: {
    label: "Ống cầu",
    unit: "ống cầu",
    icon: "🏸",
    defaultQty: 1,
    createsDebt: true,
  },
  danh_du: {
    label: "Danh dự",
    unit: "danh dự",
    icon: "🏆",
    defaultQty: 1,
    createsDebt: false,
  },
  khac: {
    label: "Khác",
    unit: "phần",
    icon: "🎁",
    defaultQty: 1,
    createsDebt: true,
  },
} as const;

export type StakeKey = keyof typeof STAKES;
export const STAKE_KEYS = Object.keys(STAKES) as StakeKey[];

export const MAX_STAKE_QTY = 20;

/** Chuoi hien thi cua mot phan thuong, vi du "2 chai nước". */
export function formatStake(
  stakeType: StakeKey,
  qty: number,
  note?: string | null,
): string {
  const stake = STAKES[stakeType];
  if (stakeType === "danh_du") return "Danh dự (không mất gì)";
  if (stakeType === "khac") return note?.trim() || `${qty} ${stake.unit}`;
  return `${qty} ${stake.unit}`;
}

/* ------------------------------------------------------------------ */
/* The thuc keo                                                        */
/* ------------------------------------------------------------------ */

export const CHALLENGE_FORMATS = {
  "1v1": { label: "1 vs 1", playersPerTeam: 1, totalPlayers: 2 },
  "2v2": { label: "2 vs 2", playersPerTeam: 2, totalPlayers: 4 },
  free: { label: "Tự do", playersPerTeam: 1, totalPlayers: 2 },
} as const;

export type ChallengeFormatKey = keyof typeof CHALLENGE_FORMATS;
export const CHALLENGE_FORMAT_KEYS = Object.keys(
  CHALLENGE_FORMATS,
) as ChallengeFormatKey[];

/** Cac moc diem hay dung. Van cho phep nhap so khac. */
export const POINT_PRESETS = [11, 15, 21] as const;
export const MIN_POINTS = 1;
export const MAX_POINTS = 99;

export const TEAM_LABELS = { A: "Đội A", B: "Đội B" } as const;

/* ------------------------------------------------------------------ */
/* Bang tin                                                            */
/* ------------------------------------------------------------------ */

export const POST_TYPES = {
  text: { label: "Chém gió", icon: "💬", tone: "slate" },
  image: { label: "Ảnh", icon: "📸", tone: "sky" },
  announcement: { label: "Thông báo", icon: "📢", tone: "amber" },
  looking_for_player: { label: "Tìm người", icon: "🙋", tone: "lime" },
} as const;

export type PostTypeKey = keyof typeof POST_TYPES;
export const POST_TYPE_KEYS = Object.keys(POST_TYPES) as PostTypeKey[];

/** Cảm xúc: mỗi người giữ đúng một loại cho mỗi nội dung. */
export const REACTIONS = {
  like: { label: "Thích", icon: "👍" },
  love: { label: "Thương", icon: "❤️" },
  haha: { label: "Haha", icon: "😂" },
  fire: { label: "Cháy", icon: "🔥" },
  clap: { label: "Vỗ tay", icon: "👏" },
  sad: { label: "Buồn", icon: "😢" },
} as const;

export type ReactionKey = keyof typeof REACTIONS;
export const REACTION_KEYS = Object.keys(REACTIONS) as ReactionKey[];

export const MAX_POST_IMAGES = 4;

/* ------------------------------------------------------------------ */
/* Gioi han noi dung                                                   */
/* ------------------------------------------------------------------ */

export const LIMITS = {
  challengeTitle: 120,
  challengeDescription: 1000,
  stakeNote: 120,
  sessionTitle: 120,
  sessionNotes: 1000,
  venueName: 160,
  venueAddress: 300,
  fullName: 80,
  bio: 300,
  resultNote: 300,
  disputeReason: 500,
  cancelReason: 300,
  postContent: 3000,
  commentContent: 1000,
  imageAlt: 200,
  /** Số bài nạp mỗi lần cuộn bảng tin. */
  feedPageSize: 15,
  /** So keo dang mo toi da moi nguoi - chong "no chong no". */
  maxOpenChallengesPerUser: 5,
  /** So ngay khong phan hoi thi ket qua duoc tu dong xac nhan. */
  autoConfirmResultAfterDays: 3,
} as const;

/* ------------------------------------------------------------------ */
/* Upload anh                                                          */
/* ------------------------------------------------------------------ */

export const UPLOAD = {
  bucket: "media",
  maxBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExtensions: ["jpg", "jpeg", "png", "webp"] as const,
} as const;

/* ------------------------------------------------------------------ */
/* Vai tro                                                             */
/* ------------------------------------------------------------------ */

export const ROLES = {
  member: { label: "Thành viên", rank: 1 },
  organizer: { label: "Người tổ chức", rank: 2 },
  moderator: { label: "Kiểm duyệt", rank: 3 },
  admin: { label: "Quản trị", rank: 4 },
} as const;

export type RoleKey = keyof typeof ROLES;
