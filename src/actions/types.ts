import { ZodError } from "zod";

import { fieldErrors } from "@/lib/validation";

/** Lỗi nghiệp vụ có thông điệp hiển thị được cho người dùng. */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

/** Trạng thái trả về cho `useActionState`. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  /** Đổi mỗi lần chạy để client biết có kết quả mới. */
  runId?: number;
};

export const idleState: ActionState = { status: "idle" };

export function success(message?: string): ActionState {
  return { status: "success", message, runId: Date.now() };
}

export function failure(
  message: string,
  errors?: Record<string, string>,
): ActionState {
  return { status: "error", message, errors, runId: Date.now() };
}

/**
 * Bọc thân của server action: quy mọi lỗi về ActionState hiển thị được,
 * và không để lộ chi tiết lỗi hệ thống ra ngoài.
 */
export async function runAction(
  fn: () => Promise<ActionState>,
): Promise<ActionState> {
  try {
    return await fn();
  } catch (error) {
    // `redirect()` của Next ném ra một lỗi đặc biệt — phải để nó đi tiếp.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }

    if (error instanceof ZodError) {
      return failure("Dữ liệu chưa hợp lệ.", fieldErrors(error));
    }
    if (error instanceof AppError) {
      return failure(error.message);
    }

    console.error("[action] lỗi không lường trước:", error);
    return failure("Có lỗi xảy ra. Vui lòng thử lại.");
  }
}
