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
 */export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  // Ba truy vấn gộp, mỗi cái chỉ trả về đúng con số cần dùng.
  //
  // Bản trước nạp tới 2000 kèo và 2000 khoản nợ KÈM QUAN HỆ vào bộ nhớ
  // rồi mới cộng bằng JavaScript. Trang Thành viên và Hồ sơ cũng gọi hàm
  // này, nên mỗi lần mở là kéo về vài MB chỉ để hiện mấy con số.
  const [members, playedRows, debtRows, ghostRows] = await Promise.all([
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

    // Nợ gom sẵn theo người + loại phần thưởng + trạng thái.
    db.execute<{
      user_id: string;
      stake_type: string;
      status: string;
      qty: number;
      rows: number;
    }>(sql`
      select cp.user_id,
             d.stake_type,
             d.status,
             sum(d.stake_qty)::int as qty,
             count(*)::int as rows
      from debts d
      join challenge_participants cp
        on cp.challenge_id = d.challenge_id
       and cp.team = d.debtor_team
       and cp.status = 'accepted'
      group by cp.user_id, d.stake_type, d.status
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
      owedUnits: 0,
      owedSummary: "",
      paidCount: 0,
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

  const owedByType = new Map<string, Map<StakeKey, number>>();
  for (const row of debtRows) {
    const entry = stats.get(row.user_id);
    if (!entry) continue;

    if (row.status === "outstanding" || row.status === "pending_confirm") {
      entry.owedUnits += row.qty;
      const byType = owedByType.get(row.user_id) ?? new Map<StakeKey, number>();
      const key = row.stake_type as StakeKey;
      byType.set(key, (byType.get(key) ?? 0) + row.qty);
      owedByType.set(row.user_id, byType);
    } else if (row.status === "paid") {
      entry.paidCount += row.rows;
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
