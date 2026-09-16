"use client";

import { useActionState, useState } from "react";

import { createChallengeAction } from "@/actions/challenges";
import { idleState } from "@/actions/types";
import {
  Alert,
  Avatar,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
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
  type StakeKey,
} from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";

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

function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 active:translate-y-px",
        active
          ? "border-gold-400 bg-gold-50 font-bold text-gold-700 shadow-[var(--shadow-soft)]"
          : "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:bg-ink-850 hover:text-ink-200",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ChallengeForm({
  members,
  sessions,
}: {
  members: Member[];
  sessions: SessionOption[];
}) {
  const [state, formAction] = useActionState(createChallengeAction, idleState);

  const [format, setFormat] = useState<ChallengeFormatKey>("1v1");
  const [kind, setKind] = useState<"open" | "direct">("open");
  const [stakeType, setStakeType] = useState<StakeKey>("nuoc");
  const [stakeQty, setStakeQty] = useState<number>(STAKES.nuoc.defaultQty);
  const [points, setPoints] = useState<number | "">(21);
  const [opponents, setOpponents] = useState<string[]>([]);
  const [partnerId, setPartnerId] = useState<string>("");

  const spec = CHALLENGE_FORMATS[format];
  const opponentsNeeded = spec.playersPerTeam;
  const supportsPartner = format === "2v2";
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

  return (
    <form action={formAction} className="space-y-5">
      {/* --- Môn & thể thức --- */}
      <Card>
        <CardBody className="space-y-4">
          <Field label="Môn" htmlFor="sport" required error={err.sport}>
            <Select id="sport" name="sport" defaultValue="cau_long">
              {SPORT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SPORTS[key].icon} {SPORTS[key].label}
                </option>
              ))}
            </Select>
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

          <Field label="Kiểu kèo" required error={err.kind}>
            <input type="hidden" name="kind" value={kind} />
            <div className="grid grid-cols-2 gap-2">
              <Chip active={kind === "open"} onClick={() => setKind("open")}>
                Kèo mở — ai cũng nhận được
              </Chip>
              <Chip
                active={kind === "direct"}
                onClick={() => setKind("direct")}
              >
                Thách đích danh
              </Chip>
            </div>
          </Field>
        </CardBody>
      </Card>

      {/* --- Nội dung kèo --- */}
      <Card>
        <CardBody className="space-y-4">
          <Field label="Tên kèo" htmlFor="title" required error={err.title}>
            <Input
              id="title"
              name="title"
              required
              maxLength={LIMITS.challengeTitle}
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
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={points === "" ? "" : points}
                  onChange={(e) =>
                    setPoints(e.target.value === "" ? "" : Number(e.target.value))
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
              placeholder="Đánh 1 séc quyết định, thua không được cãi."
            />
          </Field>
        </CardBody>
      </Card>

      {/* --- Phần thưởng --- */}
      <Card>
        <CardBody className="space-y-4">
          <Field label="Thua thì bao gì?" required error={err.stakeType}>
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
            <p className="mt-2 text-xs text-ink-500">
              Cả đội thua bao cả đội thắng. Không dùng tiền mặt — giữ cho vui.
            </p>
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
        </CardBody>
      </Card>

      {/* --- Chọn người --- */}
      {(kind === "direct" || supportsPartner) && (
        <Card>
          <CardBody className="space-y-4">
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
                label={`Thách ai? (chọn ${opponentsNeeded} người cho đội B)`}
                required
                error={err.opponentIds}
              >
                {opponents.map((id) => (
                  <input key={id} type="hidden" name="opponentIds[]" value={id} />
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
                            ? "bg-gold-50 font-semibold text-gold-700"
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
          </CardBody>
        </Card>
      )}

      {/* --- Thời gian --- */}
      <Card>
        <CardBody className="space-y-4">
          <Field
            label="Gắn vào buổi tập"
            htmlFor="sessionId"
            error={err.sessionId}
            hint="Để trống nghĩa là đánh lúc nào cũng được."
          >
            <Select id="sessionId" name="sessionId" defaultValue="">
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
            />
          </Field>
        </CardBody>
      </Card>

      {state.status === "error" && state.message && (
        <Alert tone="rose">{state.message}</Alert>
      )}

      <div className="flex gap-3">
        <SubmitButton variant="accent" size="lg" className="flex-1" pendingText="Đang tạo kèo…">
          Tạo kèo
        </SubmitButton>
      </div>
    </form>
  );
}
