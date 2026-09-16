"use client";

import { Check, Flag, ShieldAlert, X } from "lucide-react";
import { useActionState, useState } from "react";

import {
  cancelChallengeAction,
  joinChallengeAction,
  leaveChallengeAction,
  respondInviteAction,
} from "@/actions/challenges";
import {
  confirmResultAction,
  disputeResultAction,
  submitResultAction,
} from "@/actions/results";
import { idleState, type ActionState } from "@/actions/types";
import {
  Alert,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TeamSide } from "@/lib/challenge-logic";

function ErrorAlert({ state }: { state: ActionState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <Alert tone="rose" className="mt-3">
      {state.message}
    </Alert>
  );
}

/* ------------------------------------------------------------------ */
/* Nhận kèo mở                                                         */
/* ------------------------------------------------------------------ */

export function JoinChallengeForm({
  challengeId,
  team,
  disabled,
}: {
  challengeId: string;
  team: TeamSide;
  disabled?: boolean;
}) {
  const [state, action] = useActionState(joinChallengeAction, idleState);

  return (
    <form action={action}>
      <input type="hidden" name="challengeId" value={challengeId} />
      <input type="hidden" name="team" value={team} />
      <SubmitButton
        variant="secondary"
        size="sm"
        disabled={disabled}
        className="w-full"
        pendingText="Đang vào…"
      >
        Vào đội {team}
      </SubmitButton>
      <ErrorAlert state={state} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Phản hồi lời thách đích danh                                        */
/* ------------------------------------------------------------------ */

export function RespondInviteForm({ challengeId }: { challengeId: string }) {
  const [state, action] = useActionState(respondInviteAction, idleState);

  return (
    <form action={action}>
      <input type="hidden" name="challengeId" value={challengeId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton
          variant="accent"
          name="answer"
          value="accept"
          className="flex-1"
          icon={<Check className="size-4" strokeWidth={2.5} />}
          pendingText="Đang nhận…"
        >
          Nhận kèo
        </SubmitButton>
        <SubmitButton
          variant="secondary"
          name="answer"
          value="decline"
          className="flex-1"
          icon={<X className="size-4" />}
          pendingText="Đang gửi…"
        >
          Từ chối
        </SubmitButton>
      </div>
      <ErrorAlert state={state} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Rời kèo                                                             */
/* ------------------------------------------------------------------ */

export function LeaveChallengeForm({ challengeId }: { challengeId: string }) {
  const [state, action] = useActionState(leaveChallengeAction, idleState);

  return (
    <form action={action}>
      <input type="hidden" name="challengeId" value={challengeId} />
      <SubmitButton variant="ghost" size="sm" className="text-ink-500">
        Rời kèo
      </SubmitButton>
      <ErrorAlert state={state} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Huỷ kèo                                                             */
/* ------------------------------------------------------------------ */

export function CancelChallengeForm({ challengeId }: { challengeId: string }) {
  const [state, action] = useActionState(cancelChallengeAction, idleState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
      >
        <X className="size-4" />
        Huỷ kèo
      </Button>
    );
  }

  return (
    <Card className="w-full border-rose-200 bg-rose-50">
      <CardBody>
        <h3 className="mb-3 text-sm font-bold text-rose-700">
          Huỷ kèo này?
        </h3>
        <form action={action} className="space-y-3">
          <input type="hidden" name="challengeId" value={challengeId} />
          <Field label="Lý do huỷ" hint="Không bắt buộc, nhưng nên có.">
            <Input name="reason" placeholder="Bận đột xuất, hẹn dịp khác…" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setOpen(false)}
            >
              Quay lại
            </Button>
            <SubmitButton variant="danger" size="sm" pendingText="Đang huỷ…">
              Xác nhận huỷ
            </SubmitButton>
          </div>
          <ErrorAlert state={state} />
        </form>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Nhập kết quả                                                        */
/* ------------------------------------------------------------------ */

export function SubmitResultForm({
  challengeId,
  isFreeFormat,
  pointsTarget,
}: {
  challengeId: string;
  isFreeFormat: boolean;
  pointsTarget: number | null;
}) {
  const [state, action] = useActionState(submitResultAction, idleState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="accent" className="w-full" onClick={() => setOpen(true)}>
        <Flag className="size-4" strokeWidth={2.5} />
        Nhập kết quả
      </Button>
    );
  }

  return (
    <Card>
      <CardBody>
        <h3 className="mb-1 text-base font-bold text-ink-100">Nhập kết quả</h3>
        <p className="mb-4 text-[13px] text-ink-500">
          Đội kia sẽ phải xác nhận thì kết quả mới được tính.
        </p>

        <form action={action} className="space-y-3.5">
          <input type="hidden" name="challengeId" value={challengeId} />

          <Field
            label="Đội thắng"
            htmlFor="winningTeam"
            required
            error={state.errors?.winningTeam}
          >
            <Select
              id="winningTeam"
              name="winningTeam"
              defaultValue=""
              required
            >
              <option value="" disabled>
                — Chọn đội thắng —
              </option>
              <option value="A">Đội A</option>
              <option value="B">Đội B</option>
            </Select>
          </Field>

          {!isFreeFormat && (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Điểm đội A"
                htmlFor="scoreA"
                required
                error={state.errors?.scoreA}
              >
                <Input
                  id="scoreA"
                  type="number"
                  name="scoreA"
                  min={0}
                  max={99}
                  inputMode="numeric"
                  placeholder={pointsTarget ? String(pointsTarget) : "0"}
                  className="tabular text-center text-lg font-bold"
                />
              </Field>
              <Field
                label="Điểm đội B"
                htmlFor="scoreB"
                required
                error={state.errors?.scoreB}
              >
                <Input
                  id="scoreB"
                  type="number"
                  name="scoreB"
                  min={0}
                  max={99}
                  inputMode="numeric"
                  placeholder="0"
                  className="tabular text-center text-lg font-bold"
                />
              </Field>
            </div>
          )}

          <Field label="Ghi chú" htmlFor="notes" error={state.errors?.notes}>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Gáy nhẹ một câu cũng được."
              className="min-h-16"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Thôi
            </Button>
            <SubmitButton
              variant="primary"
              className="flex-1"
              pendingText="Đang gửi…"
            >
              Gửi kết quả
            </SubmitButton>
          </div>
          <ErrorAlert state={state} />
        </form>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Xác nhận / phản đối kết quả                                         */
/* ------------------------------------------------------------------ */

export function ConfirmResultActions({ challengeId }: { challengeId: string }) {
  const [confirmState, confirmAction] = useActionState(
    confirmResultAction,
    idleState,
  );
  const [disputeState, disputeAction] = useActionState(
    disputeResultAction,
    idleState,
  );
  const [disputing, setDisputing] = useState(false);

  if (disputing) {
    return (
      <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
        <h3 className="mb-3 text-sm font-bold text-rose-700">
          Không đồng ý kết quả
        </h3>
        <form action={disputeAction} className="space-y-3">
          <input type="hidden" name="challengeId" value={challengeId} />
          <Field label="Lý do" required error={disputeState.errors?.reason}>
            <Textarea
              name="reason"
              required
              placeholder="Tỉ số thật là 21-19 chứ không phải…"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setDisputing(false)}
            >
              Quay lại
            </Button>
            <SubmitButton variant="danger" size="sm" pendingText="Đang gửi…">
              Báo sai
            </SubmitButton>
          </div>
          <ErrorAlert state={disputeState} />
        </form>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <Alert tone="violet">
        Đội kia vừa báo kết quả. Kiểm tra lại rồi xác nhận giúp nhé — xác nhận
        xong mới tính vào bảng xếp hạng và sổ nợ.
      </Alert>
      <div className="flex flex-col gap-2 sm:flex-row">
        <form action={confirmAction} className="flex-1">
          <input type="hidden" name="challengeId" value={challengeId} />
          <SubmitButton
            variant="accent"
            className="w-full"
            icon={<Check className="size-4" strokeWidth={2.5} />}
            pendingText="Đang xác nhận…"
          >
            Đúng rồi
          </SubmitButton>
        </form>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setDisputing(true)}
        >
          <ShieldAlert className="size-4" />
          Không đúng
        </Button>
      </div>
      <ErrorAlert state={confirmState} />
    </div>
  );
}
