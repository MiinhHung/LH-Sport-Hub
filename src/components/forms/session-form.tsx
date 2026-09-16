"use client";

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import { createSessionAction } from "@/actions/sessions";
import { idleState } from "@/actions/types";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { SPORTS, SPORT_KEYS } from "@/lib/constants";
import { mapEmbedSrc, parseMapUrl } from "@/lib/maps";
import { cn, toDateTimeLocalValue } from "@/lib/utils";

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

  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    const { start, end } = nextSaturday();
    setStartsAt(toDateTimeLocalValue(start));
    setEndsAt(toDateTimeLocalValue(end));
  }, []);

  // Chờ người dùng gõ xong mới đổi bản đồ, nếu không iframe nạp lại
  // sau từng phím bấm.
  const [mapInput, setMapInput] = useState({ venueName: "", venueAddress: "", mapUrl: "" });
  useEffect(() => {
    const id = setTimeout(
      () => setMapInput({ venueName, venueAddress, mapUrl }),
      600,
    );
    return () => clearTimeout(id);
  }, [venueName, venueAddress, mapUrl]);

  const previewSrc = useMemo(
    () =>
      mapEmbedSrc(
        mapInput.venueName,
        mapInput.venueAddress,
        parseMapUrl(mapInput.mapUrl) ? mapInput.mapUrl : null,
      ),
    [mapInput],
  );

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
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
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
          value={venueAddress}
          onChange={(e) => setVenueAddress(e.target.value)}
          placeholder="1 Lữ Gia, Quận 11"
        />
      </Field>

      {/* Bản đồ */}
      <div className="space-y-3 rounded-xl border border-ink-800 bg-ink-850/50 p-3.5">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-300">
              <MapPin className="size-4 text-gold-600" aria-hidden />
              Hiện Google Maps
            </span>
            <span className="mt-0.5 block text-xs text-ink-500">
              Bản đồ tự hiện theo địa chỉ ở trên.
            </span>
          </span>

          <input
            type="checkbox"
            name="showMap"
            checked={showMap}
            onChange={(e) => setShowMap(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
              showMap ? "bg-gold-500" : "bg-ink-700",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                showMap && "translate-x-5",
              )}
            />
          </span>
        </label>

        {showMap && (
          <>
            {previewSrc ? (
              <div className="overflow-hidden rounded-lg border border-ink-800">
                <iframe
                  key={previewSrc}
                  src={previewSrc}
                  title="Xem trước bản đồ"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-44 w-full"
                />
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-ink-700 px-3 py-4 text-center text-xs text-ink-500">
                Nhập địa điểm hoặc địa chỉ để xem trước bản đồ.
              </p>
            )}

            <Field
              label="Link Google Maps"
              htmlFor="mapUrl"
              error={err.mapUrl}
              hint="Chỉ cần dán khi bản đồ ở trên chỉ sai chỗ."
            >
              <Input
                id="mapUrl"
                name="mapUrl"
                type="url"
                inputMode="url"
                maxLength={600}
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
            </Field>
          </>
        )}
      </div>

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
