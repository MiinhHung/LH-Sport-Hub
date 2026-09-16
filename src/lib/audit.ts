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
    await executor.insert(auditLogs).values({
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    console.error("[audit] không ghi được log:", entry.action, error);
  }
}
