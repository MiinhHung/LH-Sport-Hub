import "server-only";

import { type Db } from "@/db";
import { auditLogs } from "@/db/schema";

type Inserter = Pick<Db, "insert">;

/**
 * Ghi audit log. Cố tình không ném lỗi ra ngoài: audit hỏng
 * thì không được phép làm hỏng nghiệp vụ chính.
 */
export async function audit(
  executor: Inserter,
  entry: {
    actorId: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<void> {
  try {
    const run = async (ins: Inserter) => {
      await ins.insert(auditLogs).values({
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        metadata: entry.metadata ?? null,
      });
    };

    // Dùng savepoint khi nằm trong transaction: nếu câu lệnh audit hỏng,
    // Postgres chỉ rollback savepoint đó chứ không abort cả transaction chính.
    if ("transaction" in executor && typeof (executor as any).transaction === "function") {
      await (executor as any).transaction(async (sp: Inserter) => {
        await run(sp);
      });
    } else {
      await run(executor);
    }
  } catch (error) {
    console.error("[audit] không ghi được log:", entry.action, error);
  }
}
