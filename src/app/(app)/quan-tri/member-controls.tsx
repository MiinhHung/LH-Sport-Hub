"use client";

import { useActionState } from "react";

import { setUserRoleAction, setUserStatusAction } from "@/actions/admin";
import { idleState } from "@/actions/types";
import { Select } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { ROLES, type RoleKey } from "@/lib/constants";

export function MemberControls({
  userId,
  role,
  status,
  canAssignRoles,
  isSelf,
}: {
  userId: string;
  role: RoleKey;
  status: "active" | "suspended";
  canAssignRoles: boolean;
  isSelf: boolean;
}) {
  const [roleState, roleAction] = useActionState(setUserRoleAction, idleState);
  const [statusState, statusAction] = useActionState(
    setUserStatusAction,
    idleState,
  );

  if (isSelf) {
    return (
      <p className="text-[12px] text-ink-500">
        Không thể tự đổi vai trò hoặc khoá chính mình.
      </p>
    );
  }

  const error =
    (roleState.status === "error" && roleState.message) ||
    (statusState.status === "error" && statusState.message) ||
    null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {canAssignRoles && (
          <form action={roleAction} className="flex items-center gap-1.5">
            <input type="hidden" name="userId" value={userId} />
            <Select
              name="role"
              defaultValue={role}
              aria-label="Vai trò"
              className="h-9 w-auto py-1.5 text-[13px]"
            >
              {(Object.keys(ROLES) as RoleKey[]).map((key) => (
                <option key={key} value={key}>
                  {ROLES[key].label}
                </option>
              ))}
            </Select>
            <SubmitButton variant="secondary" size="sm" pendingText="Đang lưu…">
              Đổi vai trò
            </SubmitButton>
          </form>
        )}

        <form action={statusAction}>
          <input type="hidden" name="userId" value={userId} />
          <input
            type="hidden"
            name="status"
            value={status === "active" ? "suspended" : "active"}
          />
          <SubmitButton
            variant={status === "active" ? "danger" : "secondary"}
            size="sm"
            pendingText="Đang xử lý…"
          >
            {status === "active" ? "Tạm khoá" : "Mở khoá"}
          </SubmitButton>
        </form>
      </div>

      {error && <p className="text-[12px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}
