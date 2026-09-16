"use client";

import { Trash2, X } from "lucide-react";
import { useActionState, useState } from "react";

import { cancelSessionAction, deleteSessionAction } from "@/actions/sessions";
import { idleState } from "@/actions/types";
import { Alert, Card, CardBody, Field, Input } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Huỷ và Xoá là hai việc khác nhau, cố ý tách riêng:
 *  - Huỷ  = buổi vẫn còn đó, hiện "Đã huỷ", ai cũng thấy lý do.
 *  - Xoá  = biến mất hẳn. Chỉ nên dùng khi tạo nhầm.
 */
export function SessionOwnerActions({
  sessionId,
  canCancel,
  goingCount,
}: {
  sessionId: string;
  canCancel: boolean;
  goingCount: number;
}) {
  const [cancelState, cancelAction] = useActionState(
    cancelSessionAction,
    idleState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteSessionAction,
    idleState,
  );
  const [cancelling, setCancelling] = useState(false);

  const confirmDelete =
    goingCount > 1
      ? `Xoá hẳn buổi tập này? ${goingCount} người đã nhận đi sẽ nhận được thông báo.\n\nKhông khôi phục lại được. Nếu chỉ báo là nghỉ thì dùng Huỷ buổi.`
      : "Xoá hẳn buổi tập này? Không khôi phục lại được.";

  if (cancelling) {
    return (
      <Card className="w-full border-rose-200 bg-rose-50">
        <CardBody>
          <h3 className="mb-3 text-sm font-bold text-rose-700">
            Huỷ buổi tập này?
          </h3>
          <form action={cancelAction} className="space-y-3">
            <input type="hidden" name="sessionId" value={sessionId} />
            <Field
              label="Lý do huỷ"
              hint="Mọi người đã nhận đi sẽ nhận được thông báo kèm lý do."
            >
              <Input name="reason" maxLength={300} placeholder="Mưa, sân ngập…" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setCancelling(false)}
              >
                Quay lại
              </Button>
              <SubmitButton variant="danger" size="sm" pendingText="Đang huỷ…">
                Xác nhận huỷ
              </SubmitButton>
            </div>
            {cancelState.status === "error" && cancelState.message && (
              <Alert tone="rose">{cancelState.message}</Alert>
            )}
          </form>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {canCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCancelling(true)}
          className="text-ink-500 hover:text-rose-600"
        >
          <X className="size-4" />
          Huỷ buổi
        </Button>
      )}

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmDelete)) e.preventDefault();
        }}
      >
        <input type="hidden" name="sessionId" value={sessionId} />
        <SubmitButton
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          pendingText="Đang xoá…"
        >
          <Trash2 className="size-4" />
          Xoá buổi
        </SubmitButton>
      </form>

      {deleteState.status === "error" && deleteState.message && (
        <Alert tone="rose" className="w-full">
          {deleteState.message}
        </Alert>
      )}
    </div>
  );
}
