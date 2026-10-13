"use client";

import { Camera } from "@/components/icons";
import { useActionState, useState } from "react";

import { updateProfileAction } from "@/actions/profile";
import { idleState } from "@/actions/types";
import { Alert, Avatar, Field, Input, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  LIMITS,
  SKILL_LEVELS,
  SKILL_LEVEL_KEYS,
  UPLOAD,
} from "@/lib/constants";

export function ProfileForm({
  profile,
}: {
  profile: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    department: string | null;
    skillLevel: string;
    bio: string | null;
  };
}) {
  const [state, action] = useActionState(updateProfileAction, idleState);
  const [preview, setPreview] = useState<string | null>(null);
  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      {/* Ảnh đại diện */}
      <div className="flex items-center gap-4 rounded-lg bg-ink-850 p-3.5">
        <Avatar
          name={profile.fullName}
          src={preview ?? profile.avatarUrl}
          seed={profile.id}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink-300">Ảnh đại diện</p>
          <p className="mt-0.5 text-xs text-ink-500">
            JPG, PNG hoặc WebP, tối đa{" "}
            {Math.round(UPLOAD.maxBytes / (1024 * 1024))}MB.
          </p>
        </div>
        {/* Ô chọn tệp ẩn trong nhãn: vòng focus vẽ lên nhãn qua focus-within */}
        <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 text-[13px] font-semibold text-ink-200 transition-[border-color,background-color] focus-within:ring-2 focus-within:ring-gold-400/40 hover:border-ink-600 hover:bg-ink-850 active:scale-[0.98]">
          <Camera className="size-4" aria-hidden />
          Đổi ảnh
          <input
            type="file"
            name="avatar"
            accept={UPLOAD.allowedMimeTypes.join(",")}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </label>
      </div>

      <Field label="Họ và tên" htmlFor="fullName" required error={err.fullName}>
        <Input
          id="fullName"
          name="fullName"
          required
          maxLength={LIMITS.fullName}
          defaultValue={profile.fullName}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phòng ban" htmlFor="department" error={err.department}>
          <Input
            id="department"
            name="department"
            maxLength={80}
            defaultValue={profile.department ?? ""}
            placeholder="Kỹ thuật"
          />
        </Field>

        <Field
          label="Trình độ"
          htmlFor="skillLevel"
          required
          error={err.skillLevel}
          hint="Để người tạo kèo dễ ghép cặp cho vừa sức."
        >
          <Select
            id="skillLevel"
            name="skillLevel"
            defaultValue={profile.skillLevel}
          >
            {SKILL_LEVEL_KEYS.map((key) => (
              <option key={key} value={key}>
                {SKILL_LEVELS[key].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Giới thiệu" htmlFor="bio" error={err.bio}>
        <Textarea
          id="bio"
          name="bio"
          maxLength={LIMITS.bio}
          defaultValue={profile.bio ?? ""}
          placeholder="Đánh trái tay hơi yếu, ai thách nhẹ tay giúp."
        />
      </Field>

      {state.status === "error" && state.message && (
        <Alert tone="rose">{state.message}</Alert>
      )}
      {state.status === "success" && state.message && (
        <Alert tone="emerald">{state.message}</Alert>
      )}

      <div className="flex justify-end border-t border-ink-800 pt-5">
        <SubmitButton variant="primary" pendingText="Đang lưu…">
          Lưu hồ sơ
        </SubmitButton>
      </div>
    </form>
  );
}
