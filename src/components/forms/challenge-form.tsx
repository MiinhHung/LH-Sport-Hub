"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import {
  createChallengeAction,
  updateChallengeAction,
} from "@/actions/challenges";
import { idleState } from "@/actions/types";
import { Chip, Khoi } from "@/components/forms/khoi";
import { XemTruocKeo } from "@/components/forms/xem-truoc-keo";
import { Alert, Avatar, Field, Input, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  CHALLENGE_FORMATS,
  CHALLENGE_FORMAT_KEYS,
  LIMITS,
  MAX_STAKE_QTY,
  POINT_PRESETS,
  SPORTS,
  SPORT_KEYS,
  STAKES,
  STAKE_KEYS,
  type ChallengeFormatKey,
  type SportKey,
  type StakeKey,
} from "@/lib/constants";
import { cn, formatDateTime, toDateTimeLocalValue } from "@/lib/utils";

type Member = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
};

type SessionOption = {
  id: string;
  title: string;
  startsAt: Date;
  venueName: string;
};

/** Kèo đang sửa. Chỉ gồm những gì biểu mẫu sửa được. */
export type KeoDangSua = {
  id: string;
  title: string;
  description: string | null;
  sport: string;
  format: string;
  kind: "open" | "direct";
  pointsTarget: number | null;
  stakeType: string;
  stakeQty: number;
  stakeNote: string | null;
  sessionId: string | null;
  playDeadline: Date | null;
  /** Hai đội hiện tại — chỉ để vẽ xem trước, không gửi đi đâu. */
  doiA: Member[];
  doiB: Member[];
};

/**
 * Biểu mẫu kèo, dùng cho cả "Tạo kèo" và "Sửa kèo".
 *
 * MỘT BIỂU MẪU CHỨ KHÔNG PHẢI HAI. Chép ra một bản riêng cho việc sửa
 * nghĩa là mỗi lần đổi luật cược phải nhớ sửa hai chỗ — và cái bị quên
 * sẽ luôn là cái ít người mở hơn.
 *
 * Ở CHẾ ĐỘ SỬA, ba khối biến mất: thể thức, kiểu kèo, và chọn người.
 * Không phải vì khó làm, mà vì chúng đổi ĐỘI HÌNH chứ không đổi nội
 * dung. Đổi 1v1 thành 2v2 thì hai người đang ngồi trong kèo bỗng thiếu
 * đồng đội; đổi kèo mở thành đích danh thì người đã nhận kèo trở thành
 * người được mời. Những việc đó phải đi qua "Nhận kèo" / "Rời kèo" /
 * "Huỷ kèo" để ai cũng được hỏi ý — không phải lặng lẽ qua một ô chọn.
 * Server cũng chặn y như vậy, không chỉ ẩn ô đi ở đây.
 */
export function ChallengeForm({
  members,
  sessions,
  nguoiTao,
  keo,
  doiThuSan,
}: {
  members: Member[];
  sessions: SessionOption[];
  nguoiTao: Member;
  /** Có thì là sửa, không thì là tạo. */
  keo?: KeoDangSua;
  /**
   * Đối thủ điền sẵn, đến từ nút "Thách luôn" ở trang cá nhân.
   * Có thì biểu mẫu mở ra ở thế "thách đích danh" với người đó đã chọn.
   */
  doiThuSan?: string | null;
}) {
  const router = useRouter();
  const sua = keo != null;

  const [state, formAction] = useActionState(
    sua ? updateChallengeAction : createChallengeAction,
    idleState,
  );

  const [sport, setSport] = useState<SportKey>(
    (keo?.sport as SportKey) ?? "cau_long",
  );
  const [format, setFormat] = useState<ChallengeFormatKey>(
    (keo?.format as ChallengeFormatKey) ?? "1v1",
  );
  // Tới đây từ nút "Thách luôn" thì mở sẵn ở thế thách đích danh — người
  // ta vừa bấm đích danh một người, bắt họ chọn lại kiểu kèo là thừa.
  const [kind, setKind] = useState<"open" | "direct">(
    keo?.kind ?? (doiThuSan ? "direct" : "open"),
  );
  const [title, setTitle] = useState(keo?.title ?? "");
  const [description, setDescription] = useState(keo?.description ?? "");
  const [stakeType, setStakeType] = useState<StakeKey>(
    (keo?.stakeType as StakeKey) ?? "nuoc",
  );
  const [stakeQty, setStakeQty] = useState<number>(
    keo?.stakeQty ?? STAKES.nuoc.defaultQty,
  );
  const [stakeNote, setStakeNote] = useState(keo?.stakeNote ?? "");
  const [points, setPoints] = useState<number | "">(keo?.pointsTarget ?? 21);
  const [opponents, setOpponents] = useState<string[]>(
    doiThuSan ? [doiThuSan] : [],
  );
  const [partnerId, setPartnerId] = useState<string>("");
  const [sessionId, setSessionId] = useState(keo?.sessionId ?? "");
  const [hanDanh, setHanDanh] = useState(
    keo?.playDeadline ? toDateTimeLocalValue(keo.playDeadline) : "",
  );

  const spec = CHALLENGE_FORMATS[format];
  const opponentsNeeded = spec.playersPerTeam;
  const supportsPartner = !sua && format === "2v2";
  const err = state.errors ?? {};

  function pickStake(key: StakeKey) {
    setStakeType(key);
    setStakeQty(STAKES[key].defaultQty);
  }

  function toggleOpponent(id: string) {
    setOpponents((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= opponentsNeeded) {
        // Thay người cũ nhất để không phải bỏ chọn thủ công.
        return [...current.slice(1), id];
      }
      return [...current, id];
    });
  }

  function changeFormat(next: ChallengeFormatKey) {
    setFormat(next);
    setOpponents([]);
    if (next !== "2v2") setPartnerId("");
    if (next === "free") setPoints("");
    else if (points === "") setPoints(21);
  }

  const availableMembers = members.filter((m) => m.id !== partnerId);
  const timNguoi = (id: string) => members.find((m) => m.id === id) ?? null;

  // Đánh số khối ngay lúc dựng: ở chế độ sửa có khối bị ẩn, mà đánh số
  // cứng thì sẽ ra "1, 2, 5".
  let dem = 0;
  const so = () => ++dem;

  const buoiDangChon = sessions.find((s) => s.id === sessionId) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form action={formAction} className="min-w-0">
        {sua && <input type="hidden" name="challengeId" value={keo.id} />}

        {!sua && (
          <Khoi
            so={so()}
            tieuDe="Đánh kiểu gì"
            moTa="Đánh đơn hay đánh đôi, và ai được nhận kèo này."
          >
            <Field label="Môn" required error={err.sport}>
              <input type="hidden" name="sport" value={sport} />
              <div className="grid grid-cols-3 gap-2">
                {SPORT_KEYS.map((key) => (
                  <Chip
                    key={key}
                    active={sport === key}
                    onClick={() => setSport(key)}
                  >
                    {SPORTS[key].icon} {SPORTS[key].label}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label="Thể thức" required error={err.format}>
              <input type="hidden" name="format" value={format} />
              <div className="grid grid-cols-3 gap-2">
                {CHALLENGE_FORMAT_KEYS.map((key) => (
                  <Chip
                    key={key}
                    active={format === key}
                    onClick={() => changeFormat(key)}
                  >
                    {CHALLENGE_FORMATS[key].label}
                  </Chip>
                ))}
              </div>
              {format === "free" && (
                <p className="mt-1.5 text-xs text-ink-500">
                  Tự do: không cần tỉ số, chỉ cần chốt ai thắng. Hợp với kèo bơi
                  hoặc kèo vui.
                </p>
              )}
            </Field>

            <Field label="Ai nhận được kèo" required error={err.kind}>
              <input type="hidden" name="kind" value={kind} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Chip
                  active={kind === "open"}
                  onClick={() => setKind("open")}
                  className="text-left"
                >
                  Kèo mở
                  <span className="mt-0.5 block text-[11.5px] font-normal opacity-80">
                    Ai trong team cũng nhận được
                  </span>
                </Chip>
                <Chip
                  active={kind === "direct"}
                  onClick={() => setKind("direct")}
                  className="text-left"
                >
                  Thách đích danh
                  <span className="mt-0.5 block text-[11.5px] font-normal opacity-80">
                    Chỉ người bạn chọn
                  </span>
                </Chip>
              </div>
            </Field>
          </Khoi>
        )}

        <Khoi
          so={so()}
          tieuDe="Thách cái gì"
          moTa={
            sua
              ? "Đổi tên hay mô tả thì không ai bị ảnh hưởng. Đổi số điểm thì người trong kèo sẽ nhận thông báo."
              : "Tên kèo là thứ hiện to nhất trên bảng kèo."
          }
        >
          <Field label="Tên kèo" htmlFor="title" required error={err.title}>
            <Input
              id="title"
              name="title"
              required
              maxLength={LIMITS.challengeTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ai dám 1v1 với tôi?"
            />
          </Field>

          {format !== "free" && (
            <Field
              label="Đánh tới bao nhiêu điểm"
              required
              error={err.pointsTarget}
            >
              <input
                type="hidden"
                name="pointsTarget"
                value={points === "" ? "" : String(points)}
              />
              <div className="flex flex-wrap gap-2">
                {POINT_PRESETS.map((p) => (
                  <Chip
                    key={p}
                    active={points === p}
                    onClick={() => setPoints(p)}
                    className="min-w-16"
                  >
                    {p} điểm
                  </Chip>
                ))}
                {/* Ô "khác" để TRỐNG khi đang chọn một mốc có sẵn. Trước
                    đây nó luôn hiện lại đúng con số vừa bấm, nên cạnh
                    nút "21 điểm" đang sáng lại có thêm một ô ghi "21" —
                    nhìn như hai thứ đang chọi nhau. */}
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={
                    points !== "" && !POINT_PRESETS.includes(points as never)
                      ? points
                      : ""
                  }
                  onChange={(e) =>
                    setPoints(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-24"
                  placeholder="Khác"
                  aria-label="Số điểm khác"
                />
              </div>
            </Field>
          )}

          <Field
            label="Mô tả"
            htmlFor="description"
            error={err.description}
            hint="Luật riêng, giờ giấc, trash talk… tuỳ bạn."
          >
            <Textarea
              id="description"
              name="description"
              maxLength={LIMITS.challengeDescription}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Đánh 1 séc quyết định, thua không được cãi."
            />
          </Field>
        </Khoi>

        <Khoi
          so={so()}
          tieuDe="Thua thì bao gì"
          moTa="Cả đội thua bao cả đội thắng. Không dùng tiền mặt — giữ cho vui."
        >
          <Field label="Phần thưởng" required error={err.stakeType}>
            <input type="hidden" name="stakeType" value={stakeType} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STAKE_KEYS.map((key) => (
                <Chip
                  key={key}
                  active={stakeType === key}
                  onClick={() => pickStake(key)}
                >
                  {STAKES[key].icon} {STAKES[key].label}
                </Chip>
              ))}
            </div>
          </Field>

          {STAKES[stakeType].createsDebt && stakeType !== "khac" && (
            <Field label="Số lượng" htmlFor="stakeQty" error={err.stakeQty}>
              <div className="flex items-center gap-3">
                <Input
                  id="stakeQty"
                  name="stakeQty"
                  type="number"
                  min={1}
                  max={MAX_STAKE_QTY}
                  value={stakeQty}
                  onChange={(e) => setStakeQty(Number(e.target.value) || 1)}
                  className="w-24"
                />
                <span className="text-sm text-ink-400">
                  {STAKES[stakeType].unit}
                </span>
              </div>
            </Field>
          )}

          {stakeType === "khac" && (
            <>
              <input type="hidden" name="stakeQty" value={1} />
              <Field
                label="Ghi rõ phần thưởng"
                htmlFor="stakeNote"
                required
                error={err.stakeNote}
              >
                <Input
                  id="stakeNote"
                  name="stakeNote"
                  maxLength={LIMITS.stakeNote}
                  value={stakeNote}
                  onChange={(e) => setStakeNote(e.target.value)}
                  placeholder="Thua thì rửa xe cho người thắng"
                />
              </Field>
            </>
          )}

          {stakeType !== "khac" && (
            <input type="hidden" name="stakeNote" value="" />
          )}
          {!STAKES[stakeType].createsDebt && (
            <input type="hidden" name="stakeQty" value={1} />
          )}
        </Khoi>

        {!sua && (kind === "direct" || supportsPartner) && (
          <Khoi
            so={so()}
            tieuDe="Thách ai"
            moTa={
              kind === "direct"
                ? "Người được chọn sẽ nhận lời mời và có thể từ chối."
                : "Chọn trước đồng đội, hoặc để trống cho ai đó tự nhận."
            }
          >
            {supportsPartner && (
              <Field
                label="Đồng đội của bạn (đội A)"
                htmlFor="partnerId"
                error={err.partnerId}
                hint="Để trống nếu muốn ai đó tự nhận vào đội bạn."
              >
                <Select
                  id="partnerId"
                  name="partnerId"
                  value={partnerId}
                  onChange={(e) => {
                    setPartnerId(e.target.value);
                    setOpponents((o) => o.filter((x) => x !== e.target.value));
                  }}
                >
                  <option value="">— Chưa chọn —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {kind === "direct" && (
              <Field
                label={`Đối thủ — chọn ${opponentsNeeded} người cho đội B`}
                required
                error={err.opponentIds}
              >
                {opponents.map((id) => (
                  <input
                    key={id}
                    type="hidden"
                    name="opponentIds[]"
                    value={id}
                  />
                ))}
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-ink-700 bg-ink-900 p-1.5">
                  {availableMembers.length === 0 && (
                    <p className="px-2 py-3 text-sm text-ink-500">
                      Chưa có thành viên nào khác.
                    </p>
                  )}
                  {availableMembers.map((m) => {
                    const picked = opponents.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleOpponent(m.id)}
                        aria-pressed={picked}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                          picked
                            ? "bg-gold-50 font-semibold text-gold-700 dark:bg-gold-400/10 dark:text-gold-300"
                            : "text-ink-300 hover:bg-ink-850",
                        )}
                      >
                        <Avatar
                          name={m.fullName}
                          src={m.avatarUrl}
                          seed={m.id}
                          size="xs"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {m.fullName}
                          {m.department && (
                            <span className="ml-1.5 text-xs text-ink-600">
                              {m.department}
                            </span>
                          )}
                        </span>
                        {picked && <span className="text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-ink-500">
                  Đã chọn {opponents.length}/{opponentsNeeded}
                </p>
              </Field>
            )}
          </Khoi>
        )}

        <Khoi
          so={so()}
          tieuDe="Đánh khi nào"
          moTa="Cả hai đều không bắt buộc."
          cuoi
        >
          <Field
            label="Gắn vào buổi tập"
            htmlFor="sessionId"
            error={err.sessionId}
          >
            <Select
              id="sessionId"
              name="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              <option value="">— Đánh lúc nào cũng được —</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} · {formatDateTime(s.startsAt)} · {s.venueName}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Hạn đánh"
            htmlFor="playDeadline"
            error={err.playDeadline}
            hint="Để trống nếu không muốn giới hạn."
          >
            <Input
              id="playDeadline"
              name="playDeadline"
              type="datetime-local"
              value={hanDanh}
              onChange={(e) => setHanDanh(e.target.value)}
            />
          </Field>
        </Khoi>

        {sua && (
          <p className="mb-5 flex items-start gap-2 rounded-xl border border-ink-800 bg-ink-850/60 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-400">
            <Info className="mt-px size-4 shrink-0 text-ink-500" aria-hidden />
            <span>
              Thể thức, kiểu kèo và danh sách người chơi không sửa ở đây được —
              đổi mấy thứ đó là đổi hẳn cái kèo mà người khác đã đồng ý. Cần đổi
              thì huỷ kèo rồi tạo kèo mới.
            </span>
          </p>
        )}

        {state.status === "error" && state.message && (
          <Alert tone="rose" className="mb-4">
            {state.message}
          </Alert>
        )}

        <div className="flex justify-end gap-2 border-t border-ink-800 pt-5">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            Thôi
          </Button>
          <SubmitButton
            variant="accent"
            size="lg"
            pendingText={sua ? "Đang lưu…" : "Đang tạo kèo…"}
          >
            {sua ? "Lưu thay đổi" : "Tạo kèo"}
          </SubmitButton>
        </div>
      </form>

      {/* Xem trước — chỉ từ lg. Dưới mức đó màn hình vừa đủ cho biểu mẫu,
          mà nhét thêm một thẻ nữa thì người ta phải cuộn qua nó mới tới
          được ô đầu tiên. */}
      <div className="hidden lg:block lg:sticky lg:top-24">
        <p className="mb-2.5 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase">
          Kèo của bạn sẽ trông như vầy
        </p>
        <XemTruocKeo
          title={title}
          sport={sport}
          format={format}
          kind={kind}
          pointsTarget={points}
          stakeType={stakeType}
          stakeQty={stakeQty}
          stakeNote={stakeNote}
          nguoiTao={sua ? (keo.doiA[0] ?? nguoiTao) : nguoiTao}
          dongDoi={
            sua ? (keo.doiA[1] ?? null) : partnerId ? timNguoi(partnerId) : null
          }
          doiThu={
            sua
              ? keo.doiB
              : opponents.map(timNguoi).filter((m): m is Member => m !== null)
          }
          buoiTap={buoiDangChon?.title ?? null}
          hanDanh={hanDanh}
        />
      </div>
    </div>
  );
}
