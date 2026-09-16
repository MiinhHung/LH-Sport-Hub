"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { createSessionAction } from "@/actions/sessions";
import { idleState } from "@/actions/types";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { SPORTS, SPORT_KEYS } from "@/lib/constants";
import { toDateTimeLocalValue } from "@/lib/utils";

/** Thứ 7 gần nhất, 19:00–21:00 — lịch mặc định của team. */
function nextSaturday() {
  const start = new Date();
  start.setHours(19, 0, 0, 0);
  const daysUntilSat = (6 - start.getDay() + 7) % 7 || 7;
  start.setDate(start.getDate() + daysUntilSat);
  const end = new Date(start);
  end.setHours(21, 0, 0, 0);
  return { start, end };
}

export function SessionForm() {
  const router = useRouter();
  const [state, action] = useActionState(createSessionAction, idleState);

  // Đặt sau khi mount để giờ máy chủ và giờ trình duyệt không lệch nhau.
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    const { start, end } = nextSaturday();
    setStartsAt(toDateTimeLocalValue(start));
    setEndsAt(toDateTimeLocalValue(end));
  }, []);

  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Môn" htmlFor="sport" required error={err.sport}>
          <Select id="sport" name="sport" defaultValue="cau_long">
            {SPORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {SPORTS[key].icon} {SPORTS[key].label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Tên buổi tập"
          htmlFor="title"
          required
          error={err.title}
          className="sm:col-span-1"
        >
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder="Cầu lông thứ 7"
          />
        </Field>
      </div>

      <Field label="Sân" htmlFor="venueName" required error={err.venueName}>
        <Input
          id="venueName"
          name="venueName"
          required
          maxLength={160}
          placeholder="Nhà thi đấu Phú Thọ"
        />
      </Field>

      <Field
        label="Địa chỉ"
        htmlFor="venueAddress"
        error={err.venueAddress}
        hint="Không bắt buộc — nhưng tiện cho người đi lần đầu."
      >
        <Input
          id="venueAddress"
          name="venueAddress"
          maxLength={300}
          placeholder="1 Lữ Gia, Quận 11"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bắt đầu" htmlFor="startsAt" required error={err.startsAt}>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </Field>
        <Field label="Kết thúc" htmlFor="endsAt" required error={err.endsAt}>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Số người tối đa"
          htmlFor="maxPlayers"
          error={err.maxPlayers}
          hint="Bỏ trống nếu không giới hạn."
        >
          <Input
            id="maxPlayers"
            name="maxPlayers"
            type="number"
            min={2}
            max={100}
            inputMode="numeric"
            placeholder="12"
          />
        </Field>
        <Field
          label="Tổng tiền sân"
          htmlFor="costTotal"
          error={err.costTotal}
          hint="Đơn vị VNĐ, để chia đầu người sau."
        >
          <Input
            id="costTotal"
            name="costTotal"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            placeholder="240000"
          />
        </Field>
      </div>

      <Field label="Ghi chú" htmlFor="notes" error={err.notes}>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder="Sân số 3. Ai đi sớm lấy giúp cầu."
        />
      </Field>

      {state.status === "error" && state.message && (
        <Alert tone="rose">{state.message}</Alert>
      )}

      <div className="flex justify-end gap-2 border-t border-ink-800 pt-5">
        <Button variant="ghost" type="button" onClick={() => router.back()}>
          Thôi
        </Button>
        <SubmitButton variant="accent" pendingText="Đang tạo…">
          Tạo buổi tập
        </SubmitButton>
      </div>
    </form>
  );
}
