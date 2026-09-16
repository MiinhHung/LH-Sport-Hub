import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ================================================================== */
/* ENUMS                                                              */
/* ================================================================== */

export const sportEnum = pgEnum("sport_type", ["cau_long", "boi", "khac"]);

export const skillLevelEnum = pgEnum("skill_level", [
  "moi_tap",
  "trung_binh",
  "kha",
  "tot",
]);

export const userRoleEnum = pgEnum("user_role", [
  "member",
  "organizer",
  "moderator",
  "admin",
]);

export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);

export const playSessionStatusEnum = pgEnum("play_session_status", [
  "open",
  "cancelled",
  "completed",
]);

export const attendeeStatusEnum = pgEnum("attendee_status", [
  "going",
  "not_going",
]);

export const challengeFormatEnum = pgEnum("challenge_format", [
  "1v1",
  "2v2",
  "free",
]);

export const challengeKindEnum = pgEnum("challenge_kind", ["open", "direct"]);

/**
 * Vong doi keo:
 *  open            - dang tim doi
 *  locked          - du nguoi, cho danh
 *  pending_confirm - da nhap ket qua, cho ben kia xac nhan
 *  disputed        - hai ben khong thong nhat ket qua
 *  completed       - ket qua da chot
 *  declined        - keo thach dich danh bi tu choi
 *  cancelled       - nguoi tao huy keo
 */
export const challengeStatusEnum = pgEnum("challenge_status", [
  "open",
  "locked",
  "pending_confirm",
  "disputed",
  "completed",
  "declined",
  "cancelled",
]);

export const teamEnum = pgEnum("team_side", ["A", "B"]);

export const participantStatusEnum = pgEnum("participant_status", [
  "invited",
  "accepted",
  "declined",
  "left",
]);

export const resultStatusEnum = pgEnum("result_status", [
  "pending",
  "confirmed",
  "disputed",
]);

export const stakeEnum = pgEnum("stake_type", [
  "nuoc",
  "an_sang",
  "tra_sua",
  "ca_phe",
  "ong_cau",
  "danh_du",
  "khac",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "challenge_accepted",
  "challenge_locked",
  "challenge_invited",
  "challenge_declined",
  "challenge_cancelled",
  "challenge_left",
  "result_submitted",
  "result_confirmed",
  "result_disputed",
  "result_auto_confirmed",
  "debt_marked_paid",
  "debt_paid_confirmed",
  "debt_waived",
  "session_created",
  "session_cancelled",
  "session_reminder",
  "session_joined",
  "post_comment",
  "post_reaction",
  "comment_reply",
  "post_mention",
]);

/* ================================================================== */
/* BANG TIN                                                           */
/* ================================================================== */

export const postTypeEnum = pgEnum("post_type", [
  "text",
  "image",
  "announcement",
  "looking_for_player",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "published",
  "hidden",
  "deleted",
]);

export const reactionTargetEnum = pgEnum("reaction_target", [
  "post",
  "comment",
]);

export const reactionTypeEnum = pgEnum("reaction_type", [
  "like",
  "love",
  "haha",
  "fire",
  "clap",
  "sad",
]);

/* ================================================================== */
/* PROFILES                                                           */
/* ================================================================== */

/**
 * `id` trung voi `auth.users.id` cua Supabase Auth.
 * Khoa ngoai toi schema `auth` duoc them trong supabase/setup.sql
 * (Drizzle khong quan ly schema `auth` cua Supabase).
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    department: text("department"),
    skillLevel: skillLevelEnum("skill_level").notNull().default("trung_binh"),
    bio: text("bio"),
    role: userRoleEnum("role").notNull().default("member"),
    status: userStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("profiles_email_key").on(sql`lower(${t.email})`)],
);

/* ================================================================== */
/* BUOI TAP                                                           */
/* ================================================================== */

export const playSessions = pgTable(
  "play_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    sport: sportEnum("sport").notNull().default("cau_long"),
    title: text("title").notNull(),
    venueName: text("venue_name").notNull(),
    venueAddress: text("venue_address"),
    /** Link Google Maps dán tay, dùng khi bản đồ tự dò ra sai chỗ. */
    mapUrl: text("map_url"),
    /** Tắt đi nếu địa chỉ chung chung, bản đồ chỉ sai càng rối. */
    showMap: boolean("show_map").notNull().default(true),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    maxPlayers: integer("max_players"),
    /** Tong tien san du kien, don vi VND. */
    costTotal: integer("cost_total"),
    notes: text("notes"),
    status: playSessionStatusEnum("status").notNull().default("open"),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    /** Danh dau da gui nhac lich, de cron khong gui trung. */
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  },
  (t) => [
    index("play_sessions_starts_at_idx").on(t.startsAt),
    index("play_sessions_status_idx").on(t.status),
  ],
);

export const playSessionAttendees = pgTable(
  "play_session_attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => playSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: attendeeStatusEnum("status").notNull().default("going"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("play_session_attendees_unique").on(t.sessionId, t.userId),
    index("play_session_attendees_session_idx").on(t.sessionId),
  ],
);

/* ================================================================== */
/* KEO                                                                */
/* ================================================================== */

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    sport: sportEnum("sport").notNull().default("cau_long"),
    format: challengeFormatEnum("format").notNull(),
    kind: challengeKindEnum("kind").notNull().default("open"),
    title: text("title").notNull(),
    description: text("description"),
    /** Danh toi bao nhieu diem. NULL voi the thuc tu do. */
    pointsTarget: integer("points_target"),
    stakeType: stakeEnum("stake_type").notNull(),
    stakeQty: integer("stake_qty").notNull().default(1),
    stakeNote: text("stake_note"),
    /** Keo co the gan vao mot buoi tap, hoac de trong = "danh luc nao cung duoc". */
    sessionId: uuid("session_id").references(() => playSessions.id, {
      onDelete: "set null",
    }),
    /** Han danh. NULL = khong gioi han. */
    playDeadline: timestamp("play_deadline", { withTimezone: true }),
    status: challengeStatusEnum("status").notNull().default("open"),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("challenges_status_idx").on(t.status),
    index("challenges_creator_idx").on(t.creatorId),
    index("challenges_session_idx").on(t.sessionId),
    index("challenges_created_at_idx").on(t.createdAt),
  ],
);

export const challengeParticipants = pgTable(
  "challenge_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    team: teamEnum("team").notNull(),
    isCreator: boolean("is_creator").notNull().default(false),
    status: participantStatusEnum("status").notNull().default("accepted"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("challenge_participants_unique").on(t.challengeId, t.userId),
    index("challenge_participants_challenge_idx").on(t.challengeId),
    index("challenge_participants_user_idx").on(t.userId),
  ],
);

export const challengeResults = pgTable(
  "challenge_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    submittedBy: uuid("submitted_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    winningTeam: teamEnum("winning_team").notNull(),
    scoreA: integer("score_a"),
    scoreB: integer("score_b"),
    notes: text("notes"),
    status: resultStatusEnum("status").notNull().default("pending"),
    confirmedBy: uuid("confirmed_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    autoConfirmed: boolean("auto_confirmed").notNull().default(false),
    disputeReason: text("dispute_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("challenge_results_challenge_unique").on(t.challengeId),
    index("challenge_results_status_idx").on(t.status),
  ],
);

/* ================================================================== */
/* BAI VIET / BINH LUAN / CAM XUC                                     */
/* ================================================================== */

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    type: postTypeEnum("type").notNull().default("text"),
    status: contentStatusEnum("status").notNull().default("published"),
    /** Bài ghim luôn nằm đầu bảng tin. Chỉ ban quản trị ghim được. */
    isPinned: boolean("is_pinned").notNull().default(false),
    /** Bài có thể gắn với một kèo hoặc một buổi tập để dẫn link. */
    challengeId: uuid("challenge_id").references(() => challenges.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id").references(() => playSessions.id, {
      onDelete: "set null",
    }),
    /** Đếm sẵn để bảng tin không phải join đếm mỗi lần đọc. */
    commentCount: integer("comment_count").notNull().default(0),
    reactionCount: integer("reaction_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("posts_created_at_idx").on(t.createdAt),
    index("posts_status_idx").on(t.status),
    index("posts_author_idx").on(t.authorId),
    index("posts_pinned_idx").on(t.isPinned),
  ],
);

export const postMedia = pgTable(
  "post_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    width: integer("width"),
    height: integer("height"),
    fileSize: integer("file_size"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("post_media_post_idx").on(t.postId, t.sortOrder)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: contentStatusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("comments_post_idx").on(t.postId, t.createdAt),
    index("comments_author_idx").on(t.authorId),
  ],
);

/**
 * Mỗi người chỉ giữ MỘT cảm xúc cho mỗi nội dung — bấm loại khác thì đổi,
 * bấm lại loại cũ thì gỡ. Ràng buộc unique bên dưới là chốt chặn cuối.
 */
export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    targetType: reactionTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    type: reactionTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("reactions_unique_per_user").on(
      t.userId,
      t.targetType,
      t.targetId,
    ),
    index("reactions_target_idx").on(t.targetType, t.targetId),
  ],
);

/* ================================================================== */
/* NHAN TIN RIENG (1-1)                                               */
/* ================================================================== */

/**
 * Cuộc trò chuyện giữa ĐÚNG hai người.
 *
 * Quy ước: userAId luôn nhỏ hơn userBId khi so chuỗi. Nhờ vậy mỗi cặp
 * chỉ có đúng một hàng, và tìm cuộc trò chuyện chỉ cần một lần so khớp
 * thay vì phải kiểm tra cả hai chiều.
 *
 * Muốn chat nhóm sau này thì cần bảng participants riêng — đổi lúc đó,
 * còn bây giờ giữ đơn giản cho đúng nhu cầu.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: uuid("user_a_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** Mốc để xếp danh sách, khỏi phải join bảng messages mỗi lần đọc. */
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastMessagePreview: text("last_message_preview"),
    lastSenderId: uuid("last_sender_id"),
    /** Mỗi người tự nhớ đã đọc tới đâu. */
    readAtA: timestamp("read_at_a", { withTimezone: true }),
    readAtB: timestamp("read_at_b", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("conversations_pair_unique").on(t.userAId, t.userBId),
    index("conversations_user_a_idx").on(t.userAId, t.lastMessageAt),
    index("conversations_user_b_idx").on(t.userBId, t.lastMessageAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** Có thể rỗng khi tin nhắn chỉ gồm ảnh. */
    content: text("content").notNull().default(""),
    imageUrl: text("image_url"),
    imageWidth: integer("image_width"),
    imageHeight: integer("image_height"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

/* ================================================================== */
/* THONG BAO & AUDIT                                                  */
/* ================================================================== */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message"),
    /** Duong dan noi bo de bam thang toi noi dung lien quan. */
    href: text("href"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [
    index("notifications_recipient_idx").on(t.recipientId, t.isRead),
    index("notifications_created_at_idx").on(t.createdAt),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ],
);

/* ================================================================== */
/* RELATIONS                                                          */
/* ================================================================== */

export const profilesRelations = relations(profiles, ({ many }) => ({
  createdChallenges: many(challenges),
  challengeParticipations: many(challengeParticipants),
  sessionAttendances: many(playSessionAttendees),
  notifications: many(notifications),
}));

export const playSessionsRelations = relations(
  playSessions,
  ({ one, many }) => ({
    creator: one(profiles, {
      fields: [playSessions.creatorId],
      references: [profiles.id],
    }),
    attendees: many(playSessionAttendees),
    challenges: many(challenges),
  }),
);

export const playSessionAttendeesRelations = relations(
  playSessionAttendees,
  ({ one }) => ({
    session: one(playSessions, {
      fields: [playSessionAttendees.sessionId],
      references: [playSessions.id],
    }),
    user: one(profiles, {
      fields: [playSessionAttendees.userId],
      references: [profiles.id],
    }),
  }),
);

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [challenges.creatorId],
    references: [profiles.id],
  }),
  session: one(playSessions, {
    fields: [challenges.sessionId],
    references: [playSessions.id],
  }),
  participants: many(challengeParticipants),
  result: one(challengeResults, {
    fields: [challenges.id],
    references: [challengeResults.challengeId],
  }),
}));

export const challengeParticipantsRelations = relations(
  challengeParticipants,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeParticipants.challengeId],
      references: [challenges.id],
    }),
    user: one(profiles, {
      fields: [challengeParticipants.userId],
      references: [profiles.id],
    }),
  }),
);

export const challengeResultsRelations = relations(
  challengeResults,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeResults.challengeId],
      references: [challenges.id],
    }),
    submitter: one(profiles, {
      fields: [challengeResults.submittedBy],
      references: [profiles.id],
    }),
  }),
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [posts.authorId],
    references: [profiles.id],
  }),
  challenge: one(challenges, {
    fields: [posts.challengeId],
    references: [challenges.id],
  }),
  session: one(playSessions, {
    fields: [posts.sessionId],
    references: [playSessions.id],
  }),
  media: many(postMedia),
  comments: many(comments),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(posts, {
    fields: [postMedia.postId],
    references: [posts.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(profiles, {
    fields: [comments.authorId],
    references: [profiles.id],
  }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(profiles, {
    fields: [reactions.userId],
    references: [profiles.id],
  }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    userA: one(profiles, {
      fields: [conversations.userAId],
      references: [profiles.id],
      relationName: "conversationUserA",
    }),
    userB: one(profiles, {
      fields: [conversations.userBId],
      references: [profiles.id],
      relationName: "conversationUserB",
    }),
    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(profiles, {
    fields: [messages.senderId],
    references: [profiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(profiles, {
    fields: [notifications.recipientId],
    references: [profiles.id],
  }),
  actor: one(profiles, {
    fields: [notifications.actorId],
    references: [profiles.id],
  }),
}));

/* ================================================================== */
/* TYPES                                                              */
/* ================================================================== */

export type Profile = typeof profiles.$inferSelect;
export type PlaySession = typeof playSessions.$inferSelect;
export type PlaySessionAttendee = typeof playSessionAttendees.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type ChallengeResult = typeof challengeResults.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostMedia = typeof postMedia.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
