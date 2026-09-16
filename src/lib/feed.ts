import "server-only";

import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

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
 * Bảng tin: bài ghim lên đầu, còn lại mới nhất trước.
 * Mỗi bài kèm 3 bình luận gần nhất; bấm "xem thêm" mới tải hết.
 */
export async function listFeed({
  viewerId,
  limit = LIMITS.feedPageSize,
  offset = 0,
  authorId,
}: {
  viewerId: string;
  limit?: number;
  offset?: number;
  authorId?: string;
}) {
  const where = and(
    eq(posts.status, "published"),
    isNull(posts.deletedAt),
    ...(authorId ? [eq(posts.authorId, authorId)] : []),
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
    db.query.comments.findMany({
      where: and(
        inArray(comments.postId, postIds),
        eq(comments.status, "published"),
        isNull(comments.deletedAt),
      ),
      orderBy: [asc(comments.createdAt)],
      with: { author: { columns: publicAuthor } },
      limit: 500,
    }),
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
    content: c.content,
    createdAt: c.createdAt,
    author: c.author,
    reactions: reactionMap.get(c.id) ?? emptyReactions,
  })) satisfies FeedComment[];
}

export async function getPost(postId: string, viewerId: string) {
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), isNull(posts.deletedAt)),
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
