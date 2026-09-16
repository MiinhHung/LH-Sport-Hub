"use client";

import { Camera, Check, HandCoins } from "lucide-react";
import { useActionState, useState } from "react";

import { confirmDebtPaidAction, markDebtPaidAction } from "@/actions/debts";
import { idleState } from "@/actions/types";
import { Alert } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { UPLOAD } from "@/lib/constants";

export function DebtActions({
  debtId,
  status,
  isDebtor,
  isCreditor,
}: {
  debtId: string;
  status: string;
  isDebtor: boolean;
  isCreditor: boolean;
}) {
  const [markState, markAction] = useActionState(markDebtPaidAction, idleState);
  const [confirmState, confirmAction] = useActionState(
    confirmDebtPaidAction,
    idleState,
  );
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  /* Đội thua báo đã trả */
  if (status === "outstanding" && isDebtor) {
    if (!open) {
      return (
        <div className="border-t border-ink-800 pt-3">
          <Button
            variant="accent"
            size="sm"
            className="w-full"
            onClick={() => setOpen(true)}
          >
            <HandCoins className="size-4" strokeWidth={2.5} />
            Tôi trả rồi
          </Button>
        </div>
      );
    }

    return (
      <form action={markAction} className="space-y-2.5 border-t border-ink-800 pt-3">
        <input type="hidden" name="debtId" value={debtId} />

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-ink-700 px-3 py-2.5 transition-colors hover:border-gold-300 hover:bg-gold-50">
          <Camera className="size-4 shrink-0 text-ink-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-400">
            {fileName ?? "Đính kèm ảnh chứng minh (tuỳ chọn)"}
          </span>
          <input
            type="file"
            name="proof"
            accept={UPLOAD.allowedMimeTypes.join(",")}
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Thôi
          </Button>
          <SubmitButton
            variant="accent"
            size="sm"
            className="flex-1"
            pendingText="Đang gửi…"
          >
            Báo đã trả
          </SubmitButton>
        </div>

        {markState.status === "error" && markState.message && (
          <Alert tone="rose">{markState.message}</Alert>
        )}
      </form>
    );
  }

  /* Đội thắng xác nhận đã nhận */
  if (status === "pending_confirm" && isCreditor) {
    return (
      <form action={confirmAction} className="space-y-2 border-t border-ink-800 pt-3">
        <input type="hidden" name="debtId" value={debtId} />
        <SubmitButton
          variant="accent"
          size="sm"
          className="w-full"
          icon={<Check className="size-4" strokeWidth={2.5} />}
          pendingText="Đang xác nhận…"
        >
          Nhận rồi, xoá nợ
        </SubmitButton>
        {confirmState.status === "error" && confirmState.message && (
          <Alert tone="rose">{confirmState.message}</Alert>
        )}
      </form>
    );
  }

  if (status === "pending_confirm" && isDebtor) {
    return (
      <p className="border-t border-ink-800 pt-3 text-[12.5px] text-ink-500">
        Đã báo trả — đang chờ đội kia xác nhận.
      </p>
    );
  }

  return null;
}
