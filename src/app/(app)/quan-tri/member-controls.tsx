"use client";

import { Lock, Unlock } from "lucide-react";
import { useActionState, useRef } from "react";

import { setUserRoleAction, setUserStatusAction } from "@/actions/admin";
import { idleState } from "@/actions/types";
import { Select } from "@/components/ui";
import { useHoiLai } from "@/components/ui/hoi-lai";
import { SubmitButton } from "@/components/ui/submit-button";
import { ROLES, type RoleKey } from "@/lib/constants";

export function MemberControls({
  userId,
  fullName,
  role,
  status,
  canAssignRoles,
  isSelf,
}: {
  userId: string;
  fullName: string;
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

  const { hoi, hopThoai } = useHoiLai();
  const formRef = useRef<HTMLFormElement>(null);
  const daHoiRoi = useRef(false);

  /*
    HÀNG CỦA CHÍNH MÌNH THÌ KHÔNG HIỆN GÌ CẢ.

    Bản trước in ra câu "Không thể tự đổi vai trò hoặc khoá chính mình."
    Một dòng chữ giải thích sự VẮNG MẶT của mấy cái nút — người ta có
    định bấm đâu mà phải nói. Nó còn chiếm đúng chỗ của vùng nút nên
    hàng của mình trông lệch hẳn so với các hàng khác.
  */
  if (isSelf) return null;

  const error =
    (roleState.status === "error" && roleState.message) ||
    (statusState.status === "error" && statusState.message) ||
    null;

  const dangMo = status === "active";

  return (
    <div className="space-y-2">
      {hopThoai}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {canAssignRoles && (
          <form action={roleAction} className="flex items-center gap-1.5">
            <input type="hidden" name="userId" value={userId} />
            <Select
              name="role"
              defaultValue={role}
              aria-label={`Vai trò của ${fullName}`}
              className="h-9 w-auto py-1.5 text-[13px]"
            >
              {(Object.keys(ROLES) as RoleKey[]).map((key) => (
                <option key={key} value={key}>
                  {ROLES[key].label}
                </option>
              ))}
            </Select>
            <SubmitButton variant="secondary" size="sm" pendingText="Đang lưu…">
              Đổi
            </SubmitButton>
          </form>
        )}

        {/*
          KHOÁ TÀI KHOẢN PHẢI HỎI LẠI, VÀ KHÔNG ĐƯỢC TO TIẾNG.

          Trước đây đây là một khối đỏ đặc — thứ bắt mắt nhất trên cả
          trang, dù nó là việc hiếm khi làm nhất. Mà bấm nhầm thì người
          đó không vào được app nữa và cũng chẳng ai báo cho họ biết vì
          sao.

          Giờ nút chỉ còn viền, và đi qua hộp thoại xác nhận — cùng loại
          đang dùng cho xoá kèo, xoá buổi tập.
        */}
        <form
          action={statusAction}
          ref={formRef}
          onSubmit={async (e) => {
            if (daHoiRoi.current) {
              daHoiRoi.current = false;
              return;
            }
            e.preventDefault();
            const ok = await hoi({
              tieuDe: dangMo
                ? `Tạm khoá ${fullName}?`
                : `Mở khoá cho ${fullName}?`,
              moTa: dangMo
                ? `${fullName} sẽ không đăng nhập được nữa, và app không tự báo cho họ biết vì sao. Kèo và bài viết cũ vẫn còn.`
                : `${fullName} sẽ đăng nhập lại được ngay.`,
              // Nhãn mặc định của hộp thoại là "Xoá" — sai hẳn việc ở
              // đây. Khoá tài khoản không xoá gì cả, và một cái nút ghi
              // "Xoá" trong hộp hỏi về việc khoá là cách nhanh nhất để
              // người ta bấm Thôi vì tưởng mình sắp xoá mất ai đó.
              nhanDongY: dangMo ? "Tạm khoá" : "Mở khoá",
              nguyHiem: dangMo,
            });
            if (!ok) return;
            daHoiRoi.current = true;
            formRef.current?.requestSubmit();
          }}
        >
          <input type="hidden" name="userId" value={userId} />
          <input
            type="hidden"
            name="status"
            value={dangMo ? "suspended" : "active"}
          />
          <SubmitButton
            variant="secondary"
            size="sm"
            pendingText="Đang xử lý…"
            className={
              dangMo
                ? "text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:hover:border-rose-400/40 dark:hover:bg-rose-500/10"
                : undefined
            }
          >
            {dangMo ? (
              <>
                <Lock className="size-3.5" />
                Tạm khoá
              </>
            ) : (
              <>
                <Unlock className="size-3.5" />
                Mở khoá
              </>
            )}
          </SubmitButton>
        </form>
      </div>

      {error && (
        <p className="text-right text-[12px] font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
