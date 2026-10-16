import crypto from "node:crypto";
import { and, eq, gte, isNull, lt, lte, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { settleChallenge } from "@/lib/challenge-settle";
import { db } from "@/db";
import {
  challengeResults,
  challenges,
  playSessionAttendees,
  playSessions,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { LIMITS } from "@/lib/constants";
import { notify } from "@/lib/notifications";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Tác vụ định kỳ. Gọi bằng:
 *   GET /api/cron  với header  Authorization: Bearer <CRON_SECRET>
 *
 * CHẠY MỘT LẦN MỖI NGÀY, 01:00 UTC — xem `vercel.json` (tệp đó là JSON
 * thuần, không viết chú thích vào được, nên lý do nằm ở đây).
 *
 * Vì sao mỗi ngày chứ không mỗi giờ: gói Hobby của Vercel chỉ cho cron
 * chạy một lần/ngày, lịch mỗi giờ bị từ chối thẳng lúc deploy.
 *
 * Vì sao đúng 01:00 UTC: đó là 8 giờ sáng giờ Việt Nam. Buổi tập của
 * team ở 00:00 UTC thứ 7 (7 giờ sáng VN). Chạy 01:00 UTC thứ 6 thì buổi
 * ấy còn cách 23 tiếng — lọt cửa sổ nhắc lịch bên dưới (còn lần chạy
 * sáng thứ 5 thì buổi ấy cách 47 tiếng, chưa tới) — nên lời nhắc tới
 * vào sáng thứ 6 cho buổi sáng thứ 7. Đổi sang giờ khác thì vẫn chạy,
 * chỉ là lời nhắc đến sớm hoặc muộn hơn.
 *
 * CỬA SỔ NHẮC LỊCH LÀ 36H, KHÔNG PHẢI 24H. Cửa sổ 24h khớp khít với nhịp
 * cron 24h chỉ trên giấy: Vercel không gọi cron đúng từng phút (gói
 * Hobby có thể lệch trong cả tiếng), hai lần chạy cách nhau hơn 24h là
 * có một khe mà buổi nào bắt đầu trong khe đó thì không lần quét nào
 * thấy. Nới ra 36h cho dư; `reminderSentAt` đảm bảo mỗi buổi chỉ nhắc
 * một lần. Cái giá là buổi chiều/tối có thể được nhắc sớm hơn một ngày
 * — nên lời nhắc ghi rõ ngày giờ chứ không viết "ngày mai".
 *
 * Còn một chỗ cron một lần/ngày không cứu được: buổi được TẠO (hoặc dời
 * giờ) sau lần chạy hôm nay mà bắt đầu trước lần chạy ngày mai. Cửa sổ
 * rộng mấy cũng vậy — lúc cron chạy thì buổi đó chưa có. Người tạo buổi
 * sát giờ thì tự báo trong nhóm.
 *
 * Mọi bước đều idempotent — chạy lại nhiều lần không sinh dữ liệu trùng.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET chưa được cấu hình." },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const headerBuf = Buffer.from(header);
  const expectedBuf = Buffer.from(expected);
  if (
    headerBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(headerBuf, expectedBuf)
  ) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 401 });
  }

  const report = {
    autoConfirmedResults: 0,
    remindedSessions: 0,
    closedSessions: 0,
    errors: [] as string[],
  };

  /* --------------------------------------------------------------- */
  /* 1. Tu dong xac nhan ket qua khong ai phan hoi                    */
  /* --------------------------------------------------------------- */

  const cutoff = new Date(
    Date.now() - LIMITS.autoConfirmResultAfterDays * 24 * 60 * 60 * 1000,
  );

  const stale = await db
    .select({ challengeId: challengeResults.challengeId })
    .from(challengeResults)
    .innerJoin(challenges, eq(challenges.id, challengeResults.challengeId))
    .where(
      and(
        eq(challengeResults.status, "pending"),
        eq(challenges.status, "pending_confirm"),
        lt(challengeResults.updatedAt, cutoff),
      ),
    )
    .limit(100);

  for (const row of stale) {
    try {
      const settled = await db.transaction(async (tx) => {
        const kq = await settleChallenge(tx, row.challengeId, {
          confirmedBy: null,
          auto: true,
        });
        // null = kèo đã được ai đó xử lý (xác nhận, khiếu nại, xoá) giữa
        // lúc quét và lúc khoá. Không chốt gì thì không ghi log, không đếm.
        if (!kq) return false;

        await audit(tx, {
          actorId: null,
          action: "result.auto_confirm",
          targetType: "challenge",
          targetId: row.challengeId,
          metadata: { afterDays: LIMITS.autoConfirmResultAfterDays },
        });
        return true;
      });
      if (settled) report.autoConfirmedResults += 1;
    } catch (error) {
      console.error("[cron] tự động xác nhận thất bại:", row.challengeId, error);
      report.errors.push(`auto-confirm ${row.challengeId}`);
    }
  }

  /* --------------------------------------------------------------- */
  /* 2. Nhac lich buoi tap sap dien ra (trong 36h toi)                */
  /* --------------------------------------------------------------- */

  // 36h chứ không 24h — lý do ở chú thích đầu hàm.
  const cuaSoNhac = new Date(Date.now() + 36 * 60 * 60 * 1000);

  const upcoming = await db
    .select({
      id: playSessions.id,
      title: playSessions.title,
      startsAt: playSessions.startsAt,
      venueName: playSessions.venueName,
    })
    .from(playSessions)
    .where(
      and(
        eq(playSessions.status, "open"),
        isNull(playSessions.reminderSentAt),
        gte(playSessions.startsAt, new Date()),
        lte(playSessions.startsAt, cuaSoNhac),
      ),
    )
    .limit(50);

  for (const session of upcoming) {
    try {
      await db.transaction(async (tx) => {
        const attendees = await tx
          .select({ userId: playSessionAttendees.userId })
          .from(playSessionAttendees)
          .where(
            and(
              eq(playSessionAttendees.sessionId, session.id),
              eq(playSessionAttendees.status, "going"),
            ),
          );

        await notify(
          tx,
          attendees.map((a) => ({
            recipientId: a.userId,
            actorId: null,
            type: "session_reminder" as const,
            title: `Sắp tới: ${session.title}`,
            message: `${formatDateTime(session.startsAt)} • ${session.venueName}`,
            href: `/buoi-tap/${session.id}`,
          })),
        );

        await tx
          .update(playSessions)
          .set({ reminderSentAt: new Date() })
          .where(eq(playSessions.id, session.id));
      });
      report.remindedSessions += 1;
    } catch (error) {
      console.error("[cron] nhắc lịch thất bại:", session.id, error);
      report.errors.push(`reminder ${session.id}`);
    }
  }

  /* --------------------------------------------------------------- */
  /* 3. Dong buoi tap da qua                                          */
  /* --------------------------------------------------------------- */

  const closed = await db
    .update(playSessions)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        eq(playSessions.status, "open"),
        sql`${playSessions.endsAt} < now()`,
      ),
    )
    .returning({ id: playSessions.id });

  report.closedSessions = closed.length;

  return NextResponse.json({ ok: true, ...report });
}
