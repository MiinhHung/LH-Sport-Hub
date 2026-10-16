"use client";

import { Camera } from "@/components/icons";
import { useActionState, useEffect, useRef, useState } from "react";

import { updateProfileAction } from "@/actions/profile";
import { idleState, type ActionState } from "@/actions/types";
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
  // GIỮ DỮ LIỆU KHI MÁY CHỦ BÁO LỖI. React 19 tự `reset()` biểu mẫu sau
  // mỗi lần chạy action, kể cả khi lỗi: ô `defaultValue` quay về giá trị
  // cũ, ô chọn ảnh bị xoá trong khi ảnh xem trước vẫn còn — bấm lưu lại
  // là mất ảnh mà không hay. Nên các ô chữ để có kiểm soát, còn ảnh thì
  // giữ trong state và tự gắn vào FormData lúc gửi.
  const [fullName, setFullName] = useState(profile.fullName);
  const [department, setDepartment] = useState(profile.department ?? "");
  const [skillLevel, setSkillLevel] = useState(profile.skillLevel);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [anhMoi, setAnhMoi] = useState<{ file: File; url: string } | null>(
    null,
  );

  // Ref luôn trỏ tới ảnh mới nhất, để lúc rời trang thu hồi đúng object URL.
  const anhMoiRef = useRef(anhMoi);
  useEffect(() => {
    return () => {
      if (anhMoiRef.current) URL.revokeObjectURL(anhMoiRef.current.url);
    };
  }, []);

  /** Đổi ảnh tạm, thu hồi object URL của ảnh trước đó. */
  function doiAnh(file: File | undefined) {
    if (anhMoiRef.current) URL.revokeObjectURL(anhMoiRef.current.url);
    const moi = file ? { file, url: URL.createObjectURL(file) } : null;
    anhMoiRef.current = moi;
    setAnhMoi(moi);
  }

  const [state, action] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      // Ô chọn tệp có thể đã bị reset sau lần gửi lỗi trước — lấy ảnh từ state.
      if (anhMoi) formData.set("avatar", anhMoi.file);
      const ketQua = await updateProfileAction(prev, formData);
      // Lưu xong thì ảnh đã lên máy chủ: bỏ ảnh tạm, Avatar hiện ảnh thật.
      if (ketQua.status === "success") doiAnh(undefined);
      return ketQua;
    },
    idleState,
  );
  const err = state.errors ?? {};
  const preview = anhMoi?.url ?? null;

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
            onChange={(e) => doiAnh(e.target.files?.[0])}
          />
        </label>
      </div>

      <Field label="Họ và tên" htmlFor="fullName" required error={err.fullName}>
        <Input
          id="fullName"
          name="fullName"
          required
          maxLength={LIMITS.fullName}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phòng ban" htmlFor="department" error={err.department}>
          <Input
            id="department"
            name="department"
            maxLength={80}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
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
          {/* <select> có kiểm soát KHÔNG sống sót qua reset (React không đồng
              bộ `defaultSelected`), nên để không kiểm soát và gắn `key` theo
              lượt chạy: mỗi lần có kết quả thì dựng lại với giá trị đang chọn. */}
          <Select
            key={state.runId ?? 0}
            id="skillLevel"
            name="skillLevel"
            defaultValue={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
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
          value={bio}
          onChange={(e) => setBio(e.target.value)}
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
