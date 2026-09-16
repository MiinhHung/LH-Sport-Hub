import "server-only";

import { and, asc, desc, eq, gte, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  challengeParticipants,
  challenges,
  playSessionAttendees,
  playSessions,
  profiles,
} from "@/db/schema";
import type { TeamSide } from "@/lib/challenge-logic";

/** Cột profile an toàn để hiển thị công khai trong nội bộ. */
const publicProfileColumns = {
  id: true,
  fullName: true,
  avatarUrl: true,
  department: true,
  skillLevel: true,
  role: true,
  status: true,
} as const;

const challengeWith = {
  creator: { columns: publicProfileColumns },
  session: {
    columns: { id: true, title: true, startsAt: true, venueName: true } as const,
  },
  participants: {
    with: { user: { columns: publicProfileColumns } },
    orderBy: [asc(challengeParticipants.team), asc(challengeParticipants.joinedAt)] as any,
  },
  result: true as const,
} as const;

export type ChallengeDetail = NonNullable<
  Awaited<ReturnType<typeof getChallengeDetail>>
>;

export async function getChallengeDetail(id: string) {
  return db.query.challenges.findFirst({
    where: eq(challenges.id, id),
    with: {
      creator: { columns: publicProfileColumns },
      session: {
        columns: { id: true, title: true, startsAt: true, venueName: true },
      },
      participants: {
        with: { user: { columns: publicProfileColumns } },
        orderBy: (p: any, { asc }: any) => [asc(p.team), asc(p.joinedAt)],
      },
      result: true,
    },
  });
}

export type ChallengeFilter = {
  tab?: "open" | "mine" | "todo" | "done" | "all";
  sport?: string | null;
  userId: string;
  limit?: number;
};

export async function listChallenges({
  tab = "open",
  sport = null,
  userId,
  limit = 60,
}: ChallengeFilter) {
  const conditions = [];

  if (sport) conditions.push(eq(challenges.sport, sport as never));

  switch (tab) {
    case "open":
      conditions.push(eq(challenges.status, "open"));
      break;
    case "done":
      conditions.push(
        inArray(challenges.status, ["completed", "cancelled", "declined"]),
      );
      break;
    case "mine":
    case "todo": {
      const myChallengeIds = db
        .select({ id: challengeParticipants.challengeId })
        .from(challengeParticipants)
        .where(
          and(
            eq(challengeParticipants.userId, userId),
            inArray(challengeParticipants.status, ["accepted", "invited"]),
          ),
        );
      conditions.push(inArray(challenges.id, myChallengeIds));
      if (tab === "todo") {
        conditions.push(
          inArray(challenges.status, [
            "open",
            "locked",
            "pending_confirm",
            "disputed",
          ]),
        );
      }
      break;
    }
    case "all":
    default:
      break;
  }

  return db.query.challenges.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: {
      creator: { columns: publicProfileColumns },
      session: {
        columns: { id: true, title: true, startsAt: true, venueName: true },
      },
      participants: {
        with: { user: { columns: publicProfileColumns } },
        orderBy: (p: any, { asc }: any) => [asc(p.team), asc(p.joinedAt)],
      },
      result: true,
    },
    orderBy: [desc(challenges.createdAt)],
    limit,
  });
}

/**
 * Những việc đang chờ chính người dùng xử lý — nguồn dữ liệu cho
 * thanh "Việc của bạn" ở đầu trang Kèo.
 */
export async function getMyTodos(userId: string) {
  const mine = await db.query.challenges.findMany({
    where: inArray(
      challenges.id,
      db
        .select({ id: challengeParticipants.challengeId })
        .from(challengeParticipants)
        .where(
          and(
            eq(challengeParticipants.userId, userId),
            inArray(challengeParticipants.status, ["accepted", "invited"]),
          ),
        ),
    ),
    with: {
      creator: { columns: publicProfileColumns },
      session: {
        columns: { id: true, title: true, startsAt: true, venueName: true },
      },
      participants: {
        with: { user: { columns: publicProfileColumns } },
        orderBy: (p: any, { asc }: any) => [asc(p.team), asc(p.joinedAt)],
      },
      result: true,
    },
    orderBy: [desc(challenges.updatedAt)],
    limit: 100,
  });

  const invites = mine.filter(
    (c) =>
      c.status === "open" &&
      c.participants.some(
        (p) => p.userId === userId && p.status === "invited",
      ),
  );

  const needResult = mine.filter((c) => c.status === "locked");

  const needConfirm = mine.filter((c) => {
    if (c.status !== "pending_confirm" || !c.result) return false;
    const myTeam = c.participants.find(
      (p) => p.userId === userId && p.status === "accepted",
    )?.team;
    const submitterTeam = c.participants.find(
      (p) => p.userId === c.result!.submittedBy,
    )?.team;
    return Boolean(myTeam) && myTeam !== submitterTeam;
  });

  const disputed = mine.filter((c) => c.status === "disputed");

  return { invites, needResult, needConfirm, disputed };
}

/* ------------------------------------------------------------------ */
/* Buoi tap                                                            */
/* ------------------------------------------------------------------ */

const sessionWith = {
  creator: { columns: publicProfileColumns },
  attendees: {
    with: { user: { columns: publicProfileColumns } },
    orderBy: (p: any, { asc }: any) => [asc(p.createdAt)],
  },
} as const;

export type PlaySessionDetail = NonNullable<
  Awaited<ReturnType<typeof getSessionDetail>>
>;

export async function getSessionDetail(id: string) {
  return db.query.playSessions.findFirst({
    where: eq(playSessions.id, id),
    with: {
      creator: { columns: publicProfileColumns },
      attendees: {
        with: { user: { columns: publicProfileColumns } },
        orderBy: (p: any, { asc }: any) => [asc(p.createdAt)],
      },
      challenges: { 
        with: {
          creator: { columns: publicProfileColumns },
          session: {
            columns: { id: true, title: true, startsAt: true, venueName: true },
          },
          participants: {
            with: { user: { columns: publicProfileColumns } },
            orderBy: (p: any, { asc }: any) => [asc(p.team), asc(p.joinedAt)],
          },
          result: true,
        }
      } 
    },
  });
}

export async function listUpcomingSessions(limit = 20) {
  // Coi buổi tập là "sắp tới" cho tới khi kết thúc.
  return db.query.playSessions.findMany({
    where: and(
      gte(playSessions.endsAt, new Date()),
      eq(playSessions.status, "open"),
    ),
    with: {
      creator: { columns: publicProfileColumns },
      attendees: {
        with: { user: { columns: publicProfileColumns } },
        orderBy: (p: any, { asc }: any) => [asc(p.createdAt)],
      },
    },
    orderBy: [asc(playSessions.startsAt)],
    limit,
  });
}

export async function listPastSessions(limit = 20) {
  return db.query.playSessions.findMany({
    where: or(
      sql`${playSessions.endsAt} < now()`,
      eq(playSessions.status, "cancelled"),
    ),
    with: {
      creator: { columns: publicProfileColumns },
      attendees: {
        with: { user: { columns: publicProfileColumns } },
        orderBy: (p: any, { asc }: any) => [asc(p.createdAt)],
      },
    },
    orderBy: [desc(playSessions.startsAt)],
    limit,
  });
}

/** Buổi tập còn mở, dùng cho dropdown "gắn kèo vào buổi tập". */
export async function listSelectableSessions() {
  return db.query.playSessions.findMany({
    where: and(
      gte(playSessions.endsAt, new Date()),
      eq(playSessions.status, "open"),
    ),
    columns: { id: true, title: true, startsAt: true, venueName: true },
    orderBy: [asc(playSessions.startsAt)],
    limit: 20,
  });
}

/* ------------------------------------------------------------------ */
/* Thanh vien                                                          */
/* ------------------------------------------------------------------ */

export async function listMembers() {
  return db.query.profiles.findMany({
    where: eq(profiles.status, "active"),
    columns: publicProfileColumns,
    orderBy: [asc(profiles.fullName)],
  });
}

export async function getProfileById(id: string) {
  return db.query.profiles.findFirst({ where: eq(profiles.id, id) });
}

/* ------------------------------------------------------------------ */
/* Bang phong than                                                     */
/* ------------------------------------------------------------------ */

export type LeaderboardEntry = {
  profile: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    department: string | null;
  };
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  /** Kèo nhận rồi nhưng bị huỷ / quá hạn chưa đánh. */
  ghosted: number;
};

/**
 * Với quy mô vài chục người và vài trăm kèo, gom số liệu trong TS
 * dễ đọc và dễ sửa hơn nhiều so với một câu SQL tổng hợp.
 * Nếu dữ liệu lớn lên thì chuyển sang materialized view.
 */export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  // Ba truy vấn gộp, mỗi cái chỉ trả về đúng con số cần dùng.
  //
  // Bản trước nạp tới 2000 kèo và 2000 khoản nợ KÈM QUAN HỆ vào bộ nhớ
  // rồi mới cộng bằng JavaScript. Trang Thành viên và Hồ sơ cũng gọi hàm
  // này, nên mỗi lần mở là kéo về vài MB chỉ để hiện mấy con số.
  const [members, playedRows, ghostRows] = await Promise.all([
    listMembers(),

    // Từng lượt tham gia của kèo đã chốt: thắng hay thua, chốt lúc nào.
    // Sắp theo thời gian để tính chuỗi thắng bên dưới.
    db.execute<{
      user_id: string;
      won: boolean;
      completed_at: Date | null;
    }>(sql`
      select cp.user_id,
             (cp.team = cr.winning_team) as won,
             c.completed_at
      from challenge_participants cp
      join challenges c on c.id = cp.challenge_id
      join challenge_results cr on cr.challenge_id = c.id
      where c.status = 'completed'
        and cr.status = 'confirmed'
        and cp.status = 'accepted'
      order by c.completed_at asc nulls last
    `),


    // Kèo đã chốt người rồi nhưng bị huỷ => tính là "xù kèo".
    db.execute<{ user_id: string; total: number }>(sql`
      select cp.user_id, count(*)::int as total
      from challenge_participants cp
      join challenges c on c.id = cp.challenge_id
      where c.status = 'cancelled'
        and c.locked_at is not null
        and cp.status = 'accepted'
      group by cp.user_id
    `),
  ]);

  const stats = new Map<string, LeaderboardEntry>();
  for (const m of members) {
    stats.set(m.id, {
      profile: {
        id: m.id,
        fullName: m.fullName,
        avatarUrl: m.avatarUrl,
        department: m.department,
      },
      played: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      ghosted: 0,
    });
  }

  // Chuỗi thắng phải duyệt theo thứ tự thời gian nên vẫn tính bằng JS,
  // nhưng giờ chỉ trên vài trăm dòng gọn thay vì cả bảng kèo.
  const streak = new Map<string, number>();
  for (const row of playedRows) {
    const entry = stats.get(row.user_id);
    if (!entry) continue;

    entry.played += 1;
    if (row.won) {
      entry.wins += 1;
      const next = (streak.get(row.user_id) ?? 0) + 1;
      streak.set(row.user_id, next);
      entry.bestStreak = Math.max(entry.bestStreak, next);
    } else {
      entry.losses += 1;
      streak.set(row.user_id, 0);
    }
  }
  for (const [userId, value] of streak) {
    const entry = stats.get(userId);
    if (entry) entry.currentStreak = value;
  }

  for (const row of ghostRows) {
    const entry = stats.get(row.user_id);
    if (entry) entry.ghosted = row.total;
  }

  const list = [...stats.values()];
  for (const entry of list) {
    entry.winRate = entry.played === 0 ? 0 : entry.wins / entry.played;
  }

  return list.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.winRate - a.winRate ||
      a.profile.fullName.localeCompare(b.profile.fullName, "vi"),
  );
}
