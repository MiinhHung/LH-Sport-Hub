import "server-only";

import { and, asc, desc, eq, gte, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  challengeParticipants,
  challenges,
  debts,
  playSessionAttendees,
  playSessions,
  profiles,
} from "@/db/schema";
import { STAKES, type StakeKey } from "@/lib/constants";
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
  debt: true as const,
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
      debt: true,
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
      debt: true,
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
      debt: true,
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
          debt: true,
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
/* So no                                                               */
/* ------------------------------------------------------------------ */

const debtWith = {
  challenge: {
    with: {
      creator: { columns: publicProfileColumns },
      participants: { with: { user: { columns: publicProfileColumns } } },
      result: true,
    },
  },
} as const;

export type DebtRow = Awaited<ReturnType<typeof listDebts>>[number];

export async function listDebts(options?: { includeSettled?: boolean }) {
  return db.query.debts.findMany({
    where: options?.includeSettled
      ? undefined
      : inArray(debts.status, ["outstanding", "pending_confirm"]),
    with: debtWith,
    orderBy: [desc(debts.createdAt)],
    limit: 200,
  });
}

/** Tách một khoản nợ thành hai phía người cụ thể. */
export function debtSides(row: DebtRow) {
  const parts = row.challenge.participants.filter(
    (p) => p.status === "accepted" || p.status === "invited",
  );
  return {
    debtors: parts.filter((p) => p.team === (row.debtorTeam as TeamSide)),
    creditors: parts.filter((p) => p.team === (row.creditorTeam as TeamSide)),
  };
}

export function debtInvolves(row: DebtRow, userId: string) {
  const { debtors, creditors } = debtSides(row);
  return {
    isDebtor: debtors.some((p) => p.userId === userId),
    isCreditor: creditors.some((p) => p.userId === userId),
  };
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
  /** Số phần đang nợ, quy theo đơn vị phần thưởng. */
  owedUnits: number;
  owedSummary: string;
  paidCount: number;
  /** Kèo nhận rồi nhưng bị huỷ / quá hạn chưa đánh. */
  ghosted: number;
};

/**
 * Với quy mô vài chục người và vài trăm kèo, gom số liệu trong TS
 * dễ đọc và dễ sửa hơn nhiều so với một câu SQL tổng hợp.
 * Nếu dữ liệu lớn lên thì chuyển sang materialized view.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const [members, completed, allDebts] = await Promise.all([
    listMembers(),
    db.query.challenges.findMany({
      where: eq(challenges.status, "completed"),
      with: {
        participants: true,
        result: true,
      },
      orderBy: [asc(challenges.completedAt)],
      limit: 2000,
    }),
    db.query.debts.findMany({
      with: { challenge: { with: { participants: true } } },
      limit: 2000,
    }),
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
      owedUnits: 0,
      owedSummary: "",
      paidCount: 0,
      ghosted: 0,
    });
  }

  // Chuỗi thắng tính theo thứ tự thời gian hoàn tất.
  const runningStreak = new Map<string, number>();

  for (const c of completed) {
    if (!c.result || c.result.status !== "confirmed") continue;
    const winner = c.result.winningTeam;
    for (const p of c.participants) {
      if (p.status !== "accepted") continue;
      const entry = stats.get(p.userId);
      if (!entry) continue;
      entry.played += 1;
      if (p.team === winner) {
        entry.wins += 1;
        const streak = (runningStreak.get(p.userId) ?? 0) + 1;
        runningStreak.set(p.userId, streak);
        entry.bestStreak = Math.max(entry.bestStreak, streak);
      } else {
        entry.losses += 1;
        runningStreak.set(p.userId, 0);
      }
    }
  }

  for (const [userId, streak] of runningStreak) {
    const entry = stats.get(userId);
    if (entry) entry.currentStreak = streak;
  }

  // Nợ chưa trả + đã trả, gom theo loại phần thưởng.
  const owedByType = new Map<string, Map<StakeKey, number>>();

  for (const d of allDebts) {
    const parts = d.challenge.participants.filter(
      (p) => p.status === "accepted",
    );
    const debtors = parts.filter((p) => p.team === d.debtorTeam);

    if (d.status === "outstanding" || d.status === "pending_confirm") {
      for (const p of debtors) {
        const entry = stats.get(p.userId);
        if (!entry) continue;
        entry.owedUnits += d.stakeQty;
        const byType = owedByType.get(p.userId) ?? new Map<StakeKey, number>();
        const key = d.stakeType as StakeKey;
        byType.set(key, (byType.get(key) ?? 0) + d.stakeQty);
        owedByType.set(p.userId, byType);
      }
    } else if (d.status === "paid") {
      for (const p of debtors) {
        const entry = stats.get(p.userId);
        if (entry) entry.paidCount += 1;
      }
    }
  }

  for (const [userId, byType] of owedByType) {
    const entry = stats.get(userId);
    if (!entry) continue;
    entry.owedSummary = [...byType.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, qty]) => `${qty} ${STAKES[type].unit}`)
      .join(", ");
  }

  // Kèo đã chốt nhưng bị huỷ => tính là "xù kèo".
  const ghosted = await db
    .select({
      userId: challengeParticipants.userId,
      total: sql<number>`count(*)::int`,
    })
    .from(challengeParticipants)
    .innerJoin(challenges, eq(challenges.id, challengeParticipants.challengeId))
    .where(
      and(
        eq(challenges.status, "cancelled"),
        sql`${challenges.lockedAt} is not null`,
        eq(challengeParticipants.status, "accepted"),
      ),
    )
    .groupBy(challengeParticipants.userId);

  for (const row of ghosted) {
    const entry = stats.get(row.userId);
    if (entry) entry.ghosted = row.total;
  }

  const list = [...stats.values()];
  for (const entry of list) {
    entry.winRate = entry.played === 0 ? 0 : entry.wins / entry.played;
  }

  return list.sort(
    (a, b) =>
      b.wins - a.wins || b.winRate - a.winRate || a.profile.fullName.localeCompare(b.profile.fullName, "vi"),
  );
}
