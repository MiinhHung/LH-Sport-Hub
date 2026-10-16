import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import { comments, postMedia, posts, reactions } from "@/db/schema";
import { LIMITS, type ReactionKey } from "@/lib/constants";

const publicAuthor = {
  id: true,
  fullName: true,
  avatarUrl: true,
  department: true,
  role: true,
} as const;

export type ReactionSummary = {
  /** Số lượng theo từng loại, đã bỏ loại có 0. */
  counts: { type: ReactionKey; count: number }[];
  total: number;
  /** Loại cảm xúc của người đang xem, null nếu chưa thả. */
  mine: ReactionKey | null;
};

const emptyReactions: ReactionSummary = { counts: [], total: 0, mine: null };

/**
 * Gom cảm xúc cho một loạt nội dung trong đúng 1 câu truy vấn,
 * thay vì mỗi bài một lần đếm.
 */
async function loadReactions(
  targetType: "post" | "comment",
  targetIds: string[],
  viewerId: string,
): Promise<Map<string, ReactionSummary>> {
  const out = new Map<string, ReactionSummary>();
  if (targetIds.length === 0) return out;

  const rows = await db
    .select({
      targetId: reactions.targetId,
      type: reactions.type,
      count: sql<number>`count(*)::int`,
      mine: sql<boolean>`bool_or(${reactions.userId} = ${viewerId})`,
    })
    .from(reactions)
    .where(
      and(
        eq(reactions.targetType, targetType),
        inArray(reactions.targetId, targetIds),
      ),
    )
    .groupBy(reactions.targetId, reactions.type);

  for (const row of rows) {
    const entry = out.get(row.targetId) ?? {
      counts: [],
      total: 0,
      mine: null,
    };
    entry.counts.push({ type: row.type as ReactionKey, count: row.count });
    entry.total += row.count;
    if (row.mine) entry.mine = row.type as ReactionKey;
    out.set(row.targetId, entry);
  }

  for (const entry of out.values()) {
    entry.counts.sort((a, b) => b.count - a.count);
  }

  return out;
}

export type FeedComment = {
  id: string;
  /** Bình luận gốc nếu đây là câu trả lời. */
  parentId: string | null;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    department: string | null;
    role: string;
  };
  reactions: ReactionSummary;
};

export type FeedPost = Awaited<ReturnType<typeof listFeed>>["items"][number];

/**
 * Bộ lọc bảng tin trên URL (`?loai=`). Giữ ở đây để trang và câu truy
 * vấn dùng chung một danh sách; giá trị lạ trên URL coi như "Tất cả".
 */
export const FEED_FILTER_KEYS = [
  "all",
  "keo",
  "tim-nguoi",
  "thong-bao",
] as const;
export type FeedFilterKey = (typeof FEED_FILTER_KEYS)[number];

export function isFeedFilterKey(v: unknown): v is FeedFilterKey {
  return (
    typeof v === "string" &&
    (FEED_FILTER_KEYS as readonly string[]).includes(v)
  );
}

/**
 * Số bình luận mới nhất nạp sẵn cho mỗi bài. Bảng tin chỉ hiện 3 cái
 * cuối, phần còn lại nằm sau nút "Xem thêm N bình luận".
 */
const BINH_LUAN_MOI_BAI = 20;

/**
 * N bình luận MỚI NHẤT của từng bài, trả về theo thứ tự cũ → mới.
 *
 * Trước đây lấy 500 bình luận CŨ NHẤT của cả trang rồi chia theo bài:
 * một bài nhiều bình luận ăn hết hạn mức, bài khác mất bình luận mới.
 * Đánh số trong từng bài (row_number) thì bài nào cũng có phần của mình.
 */
async function loadLatestComments(postIds: string[]) {
  const xepHang = db
    .select({
      id: comments.id,
      hang: sql<number>`row_number() over (partition by ${comments.postId} order by ${comments.createdAt} desc)`.as(
        "hang",
      ),
    })
    .from(comments)
    .where(
      and(
        inArray(comments.postId, postIds),
        eq(comments.status, "published"),
        isNull(comments.deletedAt),
      ),
    )
    .as("xep_hang");

  const ids = (
    await db
      .select({ id: xepHang.id })
      .from(xepHang)
      .where(lte(xepHang.hang, BINH_LUAN_MOI_BAI))
  ).map((r) => r.id);

  if (ids.length === 0) return [];

  return db.query.comments.findMany({
    where: inArray(comments.id, ids),
    orderBy: [asc(comments.createdAt)],
    with: { author: { columns: publicAuthor } },
  });
}

/**
 * Bảng tin: bài ghim lên đầu, còn lại mới nhất trước.
 * Mỗi bài kèm 3 bình luận gần nhất; bấm "xem thêm" mới tải hết.
 */
export async function listFeed({
  viewerId,
  limit = LIMITS.feedPageSize,
  offset = 0,
  authorId,
  loai = "all",
}: {
  viewerId: string;
  limit?: number;
  offset?: number;
  authorId?: string;
  /** Lọc theo loại bài, làm luôn trong SQL để phân trang vẫn đúng. */
  loai?: FeedFilterKey;
}) {
  const where = and(
    eq(posts.status, "published"),
    isNull(posts.deletedAt),
    ...(authorId ? [eq(posts.authorId, authorId)] : []),
    ...(loai === "keo" ? [isNotNull(posts.challengeId)] : []),
    ...(loai === "tim-nguoi" ? [eq(posts.type, "looking_for_player")] : []),
    ...(loai === "thong-bao" ? [eq(posts.type, "announcement")] : []),
  );

  const rows = await db.query.posts.findMany({
    where,
    orderBy: [desc(posts.isPinned), desc(posts.createdAt)],
    limit: limit + 1, // lấy dư 1 để biết còn trang sau không
    offset,
    with: {
      author: { columns: publicAuthor },
      media: { orderBy: [asc(postMedia.sortOrder)] },
      challenge: { columns: { id: true, title: true, status: true } },
      session: { columns: { id: true, title: true, startsAt: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const postIds = page.map((p) => p.id);

  if (postIds.length === 0) {
    return {
      items: [] as ((typeof page)[number] & {
        reactions: ReactionSummary;
        comments: FeedComment[];
      })[],
      hasMore: false,
    };
  }

  const [postReactions, allComments] = await Promise.all([
    loadReactions("post", postIds, viewerId),
    loadLatestComments(postIds),
  ]);

  const commentReactions = await loadReactions(
    "comment",
    allComments.map((c) => c.id),
    viewerId,
  );

  const byPost = new Map<string, FeedComment[]>();
  for (const c of allComments) {
    const list = byPost.get(c.postId) ?? [];
    list.push({
      id: c.id,
      parentId: c.parentId,
      content: c.content,
      createdAt: c.createdAt,
      author: c.author,
      reactions: commentReactions.get(c.id) ?? emptyReactions,
    });
    byPost.set(c.postId, list);
  }

  const items = page.map((post) => ({
    ...post,
    reactions: postReactions.get(post.id) ?? emptyReactions,
    comments: byPost.get(post.id) ?? [],
  }));

  return { items, hasMore };
}

/** Toàn bộ bình luận của một bài, dùng khi bấm "xem tất cả". */
export async function listComments(postId: string, viewerId: string) {
  const rows = await db.query.comments.findMany({
    where: and(
      eq(comments.postId, postId),
      eq(comments.status, "published"),
      isNull(comments.deletedAt),
    ),
    orderBy: [asc(comments.createdAt)],
    with: { author: { columns: publicAuthor } },
    limit: 200,
  });

  const reactionMap = await loadReactions(
    "comment",
    rows.map((c) => c.id),
    viewerId,
  );

  return rows.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    content: c.content,
    createdAt: c.createdAt,
    author: c.author,
    reactions: reactionMap.get(c.id) ?? emptyReactions,
  })) satisfies FeedComment[];
}

export async function getPost(postId: string, viewerId: string) {
  const post = await db.query.posts.findFirst({
    // Bài bị ẩn (status 'hidden') cũng coi như không có.
    where: and(
      eq(posts.id, postId),
      eq(posts.status, "published"),
      isNull(posts.deletedAt),
    ),
    with: {
      author: { columns: publicAuthor },
      media: { orderBy: [asc(postMedia.sortOrder)] },
      challenge: { columns: { id: true, title: true, status: true } },
      session: { columns: { id: true, title: true, startsAt: true } },
    },
  });
  if (!post) return null;

  const reactionMap = await loadReactions("post", [post.id], viewerId);

  return {
    ...post,
    reactions: reactionMap.get(post.id) ?? emptyReactions,
  };
}
