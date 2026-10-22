import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  ne,
  notExists,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  challengeParticipants,
  challenges,
  playSessionAttendees,
  playSessions,
  profiles,
} from "@/db/schema";
import type { TeamSide } from "@/lib/challenge-logic";
import { isUuid } from "@/lib/validation";

/** Cột profile an toàn để hiển thị công khai trong nội bộ. */
const publicProfileColumns = {
  id: true,
  fullName: true,
  avatarUrl: true,
  department: true,
  skillLevel: true,
  role: true,
  status: true,
  /** Để vẽ chấm "đang hoạt động" — xem `lib/hoat-dong.ts`. */
  lastActiveAt: true,
} as const;

export type ChallengeDetail = NonNullable<
  Awaited<ReturnType<typeof getChallengeDetail>>
>;

export async function getChallengeDetail(id: string) {
  // Id rác trên URL (/keo/abc) mà đưa thẳng xuống Postgres sẽ nổ 22P02
  // thành trang lỗi 500; trả null để trang gọi notFound() cho đúng 404.
  if (!isUuid(id)) return null;
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
      c.participants.some((p) => p.userId === userId && p.status === "invited"),
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

export type PlaySessionDetail = NonNullable<
  Awaited<ReturnType<typeof getSessionDetail>>
>;

export async function getSessionDetail(id: string) {
  if (!isUuid(id)) return null;
  return db.query.playSessions.findFirst({
    where: eq(playSessions.id, id),
    with: {
      /*
        Riêng người TẠO buổi thì lấy thêm `qrUrl`, để trang này hiện mã
        QR nhận tiền sân.

        KHÔNG thêm `qrUrl` vào `publicProfileColumns`. Bộ cột đó dùng
        chung cho kèo, danh sách thành viên, người điểm danh… — nhét vào
        đó là phát tán mã QR của mọi người ra khắp nơi, trong khi mã QR
        mã hoá số tài khoản và chỉ nên xuất hiện đúng chỗ cần trả tiền.
        Xem ghi chú trong `supabase/08-ma-qr-nhan-tien.sql`.
      */
      creator: { columns: { ...publicProfileColumns, qrUrl: true } },
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
        },
      },
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

export type ClubStats = {
  thanhVien: number;
  keoDaDau: number;
  buoiDaTap: number;
};

/**
 * Ba con số cho ô "Hoạt động CLB" ở cột phải bảng tin. Ba lần đếm gọn
 * chạy song song, không kéo dữ liệu về.
 */
export async function getClubStats(): Promise<ClubStats> {
  const [[tv], [keo], [buoi]] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.status, "active")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(challenges)
      .where(eq(challenges.status, "completed")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(playSessions)
      .where(
        and(
          ne(playSessions.status, "cancelled"),
          sql`${playSessions.endsAt} < now()`,
        ),
      ),
  ]);
  return {
    thanhVien: tv?.value ?? 0,
    keoDaDau: keo?.value ?? 0,
    buoiDaTap: buoi?.value ?? 0,
  };
}

export async function listMembers() {
  return db.query.profiles.findMany({
    where: eq(profiles.status, "active"),
    columns: publicProfileColumns,
    orderBy: [asc(profiles.fullName)],
  });
}

export async function getProfileById(id: string) {
  if (!isUuid(id)) return null;
  return db.query.profiles.findFirst({ where: eq(profiles.id, id) });
}

/**
 * Đếm kèo mở mà người này còn vào được.
 *
 * Kèo mở không sinh thông báo cho ai cả — nó được đăng lên bảng chứ không
 * gửi tới một người cụ thể, nên bảng `notifications` không biết gì về nó.
 * Muốn báo "có người đang lên kèo" thì phải đếm trực tiếp ở đây.
 *
 * Bỏ ra ba nhóm: kèo của chính họ, kèo họ đã nhảy vào rồi, và kèo đã quá
 * hạn đánh. Thiếu vế cuối thì một cái kèo bỏ quên từ tháng trước sẽ báo
 * đỏ mãi mãi.
 */
export async function openChallengeCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(challenges)
    .where(
      and(
        eq(challenges.status, "open"),
        eq(challenges.kind, "open"),
        ne(challenges.creatorId, userId),
        or(
          isNull(challenges.playDeadline),
          gte(challenges.playDeadline, new Date()),
        ),
        notExists(
          db
            .select({ one: sql`1` })
            .from(challengeParticipants)
            .where(
              and(
                eq(challengeParticipants.challengeId, challenges.id),
                eq(challengeParticipants.userId, userId),
                ne(challengeParticipants.status, "left"),
              ),
            ),
        ),
      ),
    );

  return row?.value ?? 0;
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
 */ export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
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

/* ------------------------------------------------------------------ */
/* Trang ca nhan cua mot thanh vien khac                               */
/* ------------------------------------------------------------------ */

export type DoiDau = {
  /** Số kèo hai người đã đánh VỚI NHAU và đã chốt kết quả. */
  tong: number;
  /** Người xem thắng bao nhiêu trong số đó. */
  banThang: number;
  hoThang: number;
  /** Kèo gần nhất giữa hai người, để bấm vào xem lại. */
  ganNhat: { id: string; title: string; completedAt: Date | null } | null;
};

/**
 * Đối đầu trực tiếp giữa hai người.
 *
 * ĐÂY LÀ THỨ CHỈ APP NÀY MỚI HIỆN ĐƯỢC. Mở trang của một người trong
 * team, câu hỏi đầu tiên không phải "họ thắng bao nhiêu trận" — cái đó
 * bảng phong thần có rồi — mà là "mình với họ ai hơn ai". Dữ liệu nằm
 * sẵn trong `challenge_participants` và `challenge_results` từ lâu,
 * chỉ là chưa ai hỏi tới.
 *
 * ĐIỀU KIỆN "KHÁC ĐỘI" LÀ BẮT BUỘC. Kèo 2v2 thì hai người có thể cùng
 * một đội — lúc đó họ không đối đầu nhau, họ là đồng đội. Thiếu vế
 * `a.team <> b.team` thì mỗi trận đánh chung sẽ bị đếm thành một trận
 * đối đầu mà cả hai cùng thắng hoặc cùng thua.
 */
export async function getDoiDau(
  nguoiXem: string,
  nguoiKia: string,
): Promise<DoiDau> {
  if (nguoiXem === nguoiKia) {
    return { tong: 0, banThang: 0, hoThang: 0, ganNhat: null };
  }

  const rows = await db.execute<{
    challenge_id: string;
    title: string;
    completed_at: Date | null;
    nguoi_xem_thang: boolean;
  }>(sql`
    select c.id as challenge_id,
           c.title,
           c.completed_at,
           (a.team = cr.winning_team) as nguoi_xem_thang
    from challenge_participants a
    join challenge_participants b
      on b.challenge_id = a.challenge_id
     and b.user_id = ${nguoiKia}
     and b.status = 'accepted'
     and b.team <> a.team
    join challenges c on c.id = a.challenge_id
    join challenge_results cr on cr.challenge_id = c.id
    where a.user_id = ${nguoiXem}
      and a.status = 'accepted'
      and c.status = 'completed'
      and cr.status = 'confirmed'
    order by c.completed_at desc nulls last
  `);

  let banThang = 0;
  for (const r of rows) if (r.nguoi_xem_thang) banThang++;

  const dau = rows[0];
  return {
    tong: rows.length,
    banThang,
    hoThang: rows.length - banThang,
    ganNhat: dau
      ? {
          id: dau.challenge_id,
          title: dau.title,
          completedAt: dau.completed_at,
        }
      : null,
  };
}

export type BanHayDanh = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  soTran: number;
};

/**
 * Những người hay đánh cùng nhất — tính cả đồng đội lẫn đối thủ.
 *
 * Cố ý KHÔNG tách hai loại. Câu hỏi ở đây là "người này hay chơi với
 * ai", mà trong một đội vài chục người thì đánh chung đội hay đối đầu
 * đều là chơi với nhau cả. Tách ra chỉ làm hai danh sách ngắn tủn thay
 * vì một danh sách nói được điều gì đó.
 */
export async function getBanHayDanh(
  userId: string,
  limit = 3,
): Promise<BanHayDanh[]> {
  const rows = await db.execute<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    so_tran: number;
  }>(sql`
    select p.id, p.full_name, p.avatar_url, count(*)::int as so_tran
    from challenge_participants a
    join challenge_participants b
      on b.challenge_id = a.challenge_id
     and b.user_id <> a.user_id
     and b.status = 'accepted'
    join challenges c on c.id = a.challenge_id
    join profiles p on p.id = b.user_id
    where a.user_id = ${userId}
      and a.status = 'accepted'
      and c.status = 'completed'
      and p.status = 'active'
    group by p.id, p.full_name, p.avatar_url
    order by so_tran desc, p.full_name asc
    limit ${limit}
  `);

  return rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    soTran: r.so_tran,
  }));
}
