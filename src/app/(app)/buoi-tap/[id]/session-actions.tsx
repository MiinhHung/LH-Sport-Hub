"use client";

import { Pencil, Trash2, X } from "@/components/icons";
import { useActionState, useRef, useState } from "react";

import { cancelSessionAction, deleteSessionAction } from "@/actions/sessions";
import { idleState } from "@/actions/types";
import { Alert, Field, Input } from "@/components/ui";
import { Button, LinkButton } from "@/components/ui/button";
import { useHoiLai } from "@/components/ui/hoi-lai";
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
  canEdit,
}: {
  sessionId: string;
  canCancel: boolean;
  goingCount: number;
  /** Buổi đã huỷ thì chỉ còn xoá được, không sửa. */
  canEdit: boolean;
}) {
  const [cancelState, cancelAction] = useActionState(
    cancelSessionAction,
    idleState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteSessionAction,
    idleState,
  );

  const { hoi, hopThoai } = useHoiLai();
  const formRef = useRef<HTMLFormElement>(null);
  const daHoiRoi = useRef(false);
  // Lưu runId của lần huỷ trước lúc mở ô xác nhận: có kết quả "success"
  // MỚI thì đóng ô lại, khỏi để khung "Huỷ buổi tập này?" treo sau khi
  // đã huỷ xong.
  const [moTuRunId, setMoTuRunId] = useState<number | undefined | null>(null);
  const cancelling =
    moTuRunId !== null &&
    canCancel &&
    !(cancelState.status === "success" && cancelState.runId !== moTuRunId);
  const setCancelling = (mo: boolean) =>
    setMoTuRunId(mo ? cancelState.runId : null);

  const confirmDelete =
    goingCount > 1
      ? `Xoá hẳn buổi tập này? ${goingCount} người đã nhận đi sẽ nhận được thông báo.\n\nKhông khôi phục lại được. Nếu chỉ báo là nghỉ thì dùng Huỷ buổi.`
      : "Xoá hẳn buổi tập này? Không khôi phục lại được.";

  // Nằm trong một thẻ ở cột phải, nên ô huỷ là một vùng tô nhạt chứ
  // không phải thêm một thẻ nữa (thẻ lồng thẻ).
  if (cancelling) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-400/30 dark:bg-rose-500/10">
        <h3 className="mb-3 text-[14px] font-semibold text-rose-700 dark:text-rose-300">
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
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Sửa đứng đầu và là việc KHÔNG phá gì: gõ nhầm tên sân thì sửa,
          chứ trước đây phải xoá buổi rồi tạo lại, mất sạch danh sách
          người đã nhận đi. */}
      {canEdit && (
        <LinkButton
          variant="secondary"
          size="sm"
          href={`/buoi-tap/${sessionId}/sua`}
          className="w-full"
        >
          <Pencil className="size-4" />
          Sửa buổi
        </LinkButton>
      )}

      <div className="flex gap-2">
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCancelling(true)}
            className="flex-1 hover:text-rose-700 dark:hover:text-rose-300"
          >
            <X className="size-4" />
            Huỷ buổi
          </Button>
        )}

        <form
          action={deleteAction}
          ref={formRef}
          className="flex flex-1"
          onSubmit={async (e) => {
            if (daHoiRoi.current) {
              daHoiRoi.current = false;
              return;
            }
            e.preventDefault();
            const ok = await hoi({
              tieuDe: "Xoá hẳn buổi tập này?",
              moTa: confirmDelete,
              nguyHiem: true,
            });
            if (!ok) return;
            daHoiRoi.current = true;
            formRef.current?.requestSubmit();
          }}
        >
          {hopThoai}
          <input type="hidden" name="sessionId" value={sessionId} />
          <SubmitButton
            variant="ghost"
            size="sm"
            className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
            pendingText="Đang xoá…"
          >
            <Trash2 className="size-4" />
            Xoá buổi
          </SubmitButton>
        </form>
      </div>

      {deleteState.status === "error" && deleteState.message && (
        <Alert tone="rose">{deleteState.message}</Alert>
      )}
    </div>
  );
}
