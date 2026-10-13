"use client";

import { SportIcon } from "@/components/domain-icons";
import { MapPin } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import { createSessionAction, updateSessionAction } from "@/actions/sessions";
import { idleState } from "@/actions/types";
import { Chip, Khoi } from "@/components/forms/khoi";
import { Alert, Field, Input, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { SPORTS, SPORT_KEYS, type SportKey } from "@/lib/constants";
import { mapEmbedSrc, parseMapUrl } from "@/lib/maps";
import { cn, toDateTimeLocalValue } from "@/lib/utils";

/** Buổi tập đang sửa. */
export type BuoiDangSua = {
  id: string;
  sport: string;
  title: string;
  venueName: string;
  venueAddress: string | null;
  mapUrl: string | null;
  showMap: boolean;
  startsAt: Date;
  endsAt: Date;
  maxPlayers: number | null;
  costTotal: number | null;
  notes: string | null;
};

/** Thứ 7 gần nhất, 07:00 đến 09:00, lịch mặc định của team. */
function nextSaturday() {
  const start = new Date();
  start.setHours(7, 0, 0, 0);
  const daysUntilSat = (6 - start.getDay() + 7) % 7 || 7;
  start.setDate(start.getDate() + daysUntilSat);
  const end = new Date(start);
  end.setHours(9, 0, 0, 0);
  return { start, end };
}

/** Các khoảng hay dùng, tính bằng phút. */
const DO_DAI = [90, 120, 180] as const;

function nhanDoDai(phut: number) {
  const gio = Math.floor(phut / 60);
  const du = phut % 60;
  return du === 0 ? `${gio} tiếng` : `${gio} tiếng ${du} phút`;
}

function cong(moc: string, phut: number): string {
  const d = new Date(moc);
  if (Number.isNaN(d.getTime())) return "";
  return toDateTimeLocalValue(new Date(d.getTime() + phut * 60_000));
}

/**
 * Biểu mẫu buổi tập, dùng cho cả "Tạo buổi tập" và "Sửa buổi tập".
 *
 * GIỜ KẾT THÚC TỰ TRƯỢT THEO GIỜ BẮT ĐẦU. Bản trước, dời buổi tập từ
 * 7h sang 8h thì giờ kết thúc vẫn nằm im ở 9h, buổi tập tự dưng rút từ
 * hai tiếng xuống một tiếng, mà không có gì báo. Giữ nguyên độ dài là
 * điều người ta muốn trong gần như mọi lần dời giờ; muốn đổi độ dài thì
 * sửa thẳng ô kết thúc, hoặc bấm một trong mấy nút khoảng thời gian.
 */
export function SessionForm({ buoi }: { buoi?: BuoiDangSua }) {
  const router = useRouter();
  const sua = buoi != null;

  const [state, action] = useActionState(
    sua ? updateSessionAction : createSessionAction,
    idleState,
  );

  const [sport, setSport] = useState<SportKey>(
    (buoi?.sport as SportKey) ?? "cau_long",
  );

  // Lúc tạo thì đặt sau khi mount để giờ máy chủ và giờ trình duyệt
  // không lệch nhau; lúc sửa thì đã có giờ thật nên điền luôn.
  const [startsAt, setStartsAt] = useState(
    buoi ? toDateTimeLocalValue(buoi.startsAt) : "",
  );
  const [endsAt, setEndsAt] = useState(
    buoi ? toDateTimeLocalValue(buoi.endsAt) : "",
  );

  const [venueName, setVenueName] = useState(buoi?.venueName ?? "");
  const [venueAddress, setVenueAddress] = useState(buoi?.venueAddress ?? "");
  const [mapUrl, setMapUrl] = useState(buoi?.mapUrl ?? "");
  const [showMap, setShowMap] = useState(buoi?.showMap ?? true);

  useEffect(() => {
    if (sua) return;
    const { start, end } = nextSaturday();
    setStartsAt(toDateTimeLocalValue(start));
    setEndsAt(toDateTimeLocalValue(end));
  }, [sua]);

  // Chờ người dùng gõ xong mới đổi bản đồ, nếu không iframe nạp lại
  // sau từng phím bấm.
  const [mapInput, setMapInput] = useState({
    venueName: buoi?.venueName ?? "",
    venueAddress: buoi?.venueAddress ?? "",
    mapUrl: buoi?.mapUrl ?? "",
  });
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

  const doDaiPhut = useMemo(() => {
    const a = new Date(startsAt);
    const b = new Date(endsAt);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    const phut = Math.round((b.getTime() - a.getTime()) / 60_000);
    return phut > 0 ? phut : null;
  }, [startsAt, endsAt]);

  /** Dời giờ bắt đầu thì kéo giờ kết thúc theo, giữ nguyên độ dài. */
  function doiGioBatDau(moc: string) {
    if (doDaiPhut !== null && moc) setEndsAt(cong(moc, doDaiPhut));
    setStartsAt(moc);
  }

  const err = state.errors ?? {};

  return (
    <form action={action}>
      {sua && <input type="hidden" name="sessionId" value={buoi.id} />}

      <Khoi so={1} tieuDe="Buổi gì" moTa="Tên sẽ hiện trên lịch của cả team.">
        <Field label="Môn" required error={err.sport}>
          <input type="hidden" name="sport" value={sport} />
          <div className="grid grid-cols-3 gap-2">
            {SPORT_KEYS.map((key) => (
              <Chip
                key={key}
                active={sport === key}
                onClick={() => setSport(key)}
              >
                <SportIcon sport={key} /> {SPORTS[key].label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Tên buổi tập" htmlFor="title" required error={err.title}>
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            defaultValue={buoi?.title ?? ""}
            placeholder="Cầu lông sáng thứ 7"
          />
        </Field>
      </Khoi>

      <Khoi
        so={2}
        tieuDe="Đánh ở đâu"
        moTa="Địa chỉ không bắt buộc, nhưng tiện cho người đi lần đầu."
      >
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

        <Field label="Địa chỉ" htmlFor="venueAddress" error={err.venueAddress}>
          <Input
            id="venueAddress"
            name="venueAddress"
            maxLength={300}
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
            placeholder="1 Lữ Gia, Quận 11"
          />
        </Field>

        <div className="space-y-3 rounded-lg bg-ink-850 p-3.5">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-300">
                <MapPin
                  className="size-4 text-gold-700 dark:text-gold-300"
                  aria-hidden
                />
                Hiện Google Maps
              </span>
              <span className="mt-0.5 block text-[12.5px] text-ink-500">
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
                "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-400/40",
                showMap ? "bg-gold-400" : "bg-ink-700",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform duration-200",
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
                <p className="rounded-lg border border-dashed border-ink-700 bg-ink-900 px-3 py-4 text-center text-[12.5px] text-ink-500">
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
      </Khoi>

      <Khoi
        so={3}
        tieuDe="Mấy giờ"
        moTa={
          sua
            ? "Dời giờ bắt đầu thì giờ kết thúc tự trượt theo, giữ nguyên độ dài. Người đã nhận đi sẽ được báo."
            : "Dời giờ bắt đầu thì giờ kết thúc tự trượt theo, giữ nguyên độ dài."
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bắt đầu" htmlFor="startsAt" required error={err.startsAt}>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => doiGioBatDau(e.target.value)}
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

        <Field label="Đánh trong bao lâu">
          <div className="flex flex-wrap gap-2">
            {DO_DAI.map((phut) => (
              <Chip
                key={phut}
                active={doDaiPhut === phut}
                onClick={() => startsAt && setEndsAt(cong(startsAt, phut))}
              >
                {nhanDoDai(phut)}
              </Chip>
            ))}
            {doDaiPhut !== null && !DO_DAI.includes(doDaiPhut as never) && (
              <span className="self-center text-[12.5px] text-ink-500">
                Đang đặt {nhanDoDai(doDaiPhut)}
              </span>
            )}
          </div>
        </Field>
      </Khoi>

      <Khoi so={4} tieuDe="Vài thứ còn lại" moTa="Để trống hết cũng không sao." cuoi>
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
              defaultValue={buoi?.maxPlayers ?? ""}
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
              defaultValue={buoi?.costTotal ?? ""}
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
            defaultValue={buoi?.notes ?? ""}
            placeholder="Sân số 3. Ai đi sớm lấy giúp cầu."
          />
        </Field>
      </Khoi>

      {state.status === "error" && state.message && (
        <Alert tone="rose" className="mb-6">
          {state.message}
        </Alert>
      )}

      <div className="flex justify-end gap-2 border-t border-ink-800 pt-5">
        <Button variant="ghost" type="button" onClick={() => router.back()}>
          Thôi
        </Button>
        <SubmitButton
          variant="accent"
          pendingText={sua ? "Đang lưu…" : "Đang tạo…"}
        >
          {sua ? "Lưu thay đổi" : "Tạo buổi tập"}
        </SubmitButton>
      </div>
    </form>
  );
}
