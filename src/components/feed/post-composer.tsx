"use client";

import {
  ImagePlus,
  Link2,
  Megaphone,
  MessageSquare,
  UserSearch,
  X,
} from "@/components/icons";
import { useActionState, useEffect, useRef, useState } from "react";

import { createPostAction } from "@/actions/posts";
import { idleState } from "@/actions/types";
import { Alert, Avatar, Card } from "@/components/ui";
import { ODanLink } from "@/components/feed/o-dan-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { LIMITS, MAX_POST_IMAGES, type PostTypeKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Draft = { file: File; url: string };

const NUT_NHANH =
  "inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100";

const TYPE_OPTIONS: {
  key: PostTypeKey;
  label: string;
  icon: typeof MessageSquare;
  modOnly?: boolean;
}[] = [
  { key: "text", label: "Chém gió", icon: MessageSquare },
  { key: "looking_for_player", label: "Tìm người", icon: UserSearch },
  { key: "link", label: "Link", icon: Link2 },
  { key: "announcement", label: "Thông báo", icon: Megaphone, modOnly: true },
];

export function PostComposer({
  author,
  canAnnounce,
}: {
  author: { id: string; fullName: string; avatarUrl: string | null };
  canAnnounce: boolean;
}) {
  const [state, action] = useActionState(createPostAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostTypeKey>("text");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [dangKeo, setDangKeo] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Dọn sạch sau khi đăng thành công.
  useEffect(() => {
    if (state.status !== "success") return;
    setContent("");
    setType("text");
    setLinkUrl("");
    setDrafts((current) => {
      current.forEach((d) => URL.revokeObjectURL(d.url));
      return [];
    });
    setOpen(false);
    formRef.current?.reset();
  }, [state.runId, state.status]);

  // Thu hồi object URL khi rời trang, tránh rò bộ nhớ. Đọc qua ref để lấy
  // danh sách MỚI NHẤT — effect rỗng phụ thuộc chỉ thấy mảng rỗng lúc đầu.
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  useEffect(() => {
    return () => draftsRef.current.forEach((d) => URL.revokeObjectURL(d.url));
  }, []);

  /**
   * Dựng FormData lúc gửi: ảnh lấy từ `drafts`, không lấy từ input file.
   *
   * React 19 tự `reset()` biểu mẫu sau mỗi lần chạy action, kể cả khi máy
   * chủ báo lỗi. Input file bị xoá trắng trong khi ảnh xem trước vẫn còn
   * nguyên; sửa chữ rồi bấm đăng lại là bài lên KHÔNG có ảnh. Ô chữ, loại
   * bài và link đều có kiểm soát nên reset không làm mất.
   */
  function guiBai(formData: FormData) {
    formData.delete("images");
    drafts.forEach((d) => formData.append("images", d.file));
    return action(formData);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    // Chép ra mảng ngay: input file bị xoá giá trị ngay sau khi gọi hàm này.
    const files = Array.from(list);
    setDrafts((current) => {
      const room = MAX_POST_IMAGES - current.length;
      const picked = files.slice(0, Math.max(0, room));
      return [
        ...current,
        ...picked.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ];
    });
    setOpen(true);
  }

  function khiDan(e: React.ClipboardEvent) {
    const anh = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (anh.length === 0) return;
    e.preventDefault();
    const dt = new DataTransfer();
    anh.forEach((f) => dt.items.add(f));
    addFiles(dt.files);
  }

  function khiTha(e: React.DragEvent) {
    e.preventDefault();
    setDangKeo(false);
    const anh = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (anh.length === 0) return;
    const dt = new DataTransfer();
    anh.forEach((f) => dt.items.add(f));
    addFiles(dt.files);
  }

  function moVoiLoai(loai: PostTypeKey) {
    setType(loai);
    setOpen(true);
    requestAnimationFrame(() =>
      formRef.current?.querySelector("textarea")?.focus(),
    );
  }

  function removeDraft(index: number) {
    setDrafts((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, i) => i !== index);
    });
  }

  const options = TYPE_OPTIONS.filter((o) => !o.modOnly || canAnnounce);
  const overLimit = content.length > LIMITS.postContent;
  const laLink = type === "link";
  const canSubmit = laLink
    ? linkUrl.trim().length > 0 && !overLimit
    : content.trim().length > 0 && !overLimit;

  return (
    <Card className="overflow-hidden">
      <form
        ref={formRef}
        action={guiBai}
        className={cn(
          "relative p-4 transition-colors sm:p-5",
          dangKeo && "bg-gold-50 dark:bg-gold-400/10",
        )}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDangKeo(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDangKeo(false);
        }}
        onDrop={khiTha}
      >
        {dangKeo && (
          <div className="pointer-events-none absolute inset-2 grid place-items-center rounded-lg border-2 border-dashed border-gold-500 bg-ink-900/90 text-[13px] font-semibold text-gold-700 dark:text-gold-300">
            Thả ảnh vào đây
          </div>
        )}
        <input type="hidden" name="type" value={type} />

        <div className="flex gap-3">
          <Avatar
            name={author.fullName}
            src={author.avatarUrl}
            seed={author.id}
            size="md"
            className="mt-0.5"
          />

          <div className="min-w-0 flex-1 space-y-3">
            <textarea
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setOpen(true)}
              onPaste={khiDan}
              rows={open ? 4 : 2}
              maxLength={LIMITS.postContent + 200}
              placeholder={
                laLink
                  ? "Thêm một câu dẫn (không bắt buộc)…"
                  : `${author.fullName.split(" ").slice(-1)[0]} ơi, có gì mới không?`
              }
              aria-label="Nội dung bài viết"
              data-tu-vien-focus
              className={cn(
                "w-full resize-none rounded-lg border border-transparent bg-ink-850 px-3.5 py-2.5 text-[15px] leading-relaxed text-ink-200 outline-none transition-[background-color,border-color,box-shadow] duration-200",
                "placeholder:text-ink-500 hover:border-ink-700",
                "focus:border-gold-500 focus:bg-ink-900 focus:ring-2 focus:ring-gold-400/25",
              )}
            />

            {/* Ảnh đã chọn */}
            {drafts.length > 0 && (
              <ul className="grid grid-cols-4 gap-2">
                {drafts.map((d, i) => (
                  <li key={d.url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.url}
                      alt={`Ảnh đính kèm ${i + 1}`}
                      className="aspect-square w-full rounded-lg object-cover ring-1 ring-ink-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeDraft(i)}
                      aria-label={`Bỏ ảnh ${i + 1}`}
                      className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-navy-950/80 text-white transition-colors hover:bg-navy-950"
                    >
                      <X className="size-3" strokeWidth={2.5} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!open && (
              <div className="-ml-1 flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={NUT_NHANH}
                >
                  <ImagePlus className="size-4" />
                  <span>Ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => moVoiLoai("looking_for_player")}
                  className={NUT_NHANH}
                >
                  <UserSearch className="size-4" />
                  <span>Tìm người</span>
                </button>
                <button
                  type="button"
                  onClick={() => moVoiLoai("link")}
                  className={NUT_NHANH}
                >
                  <Link2 className="size-4" />
                  <span>Link</span>
                </button>

                <span className="ml-auto text-[12.5px] font-medium text-ink-500 pointer-coarse:hidden max-sm:hidden">
                  Dán hoặc kéo ảnh vào đây
                </span>
              </div>
            )}

            {open && (
              <>
                {/* Loại bài */}
                <div className="flex flex-wrap gap-1.5">
                  {options.map((o) => {
                    const Icon = o.icon;
                    const active = type === o.key;
                    return (
                      <button
                        key={o.key}
                        type="button"
                        onClick={() => setType(o.key)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                          active
                            ? "border-navy-900 bg-navy-900 text-white dark:border-gold-400 dark:bg-gold-400 dark:text-navy-900"
                            : "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:text-ink-100",
                        )}
                      >
                        <Icon className="size-3" />
                        <span>{o.label}</span>
                      </button>
                    );
                  })}
                </div>

                {laLink && <ODanLink url={linkUrl} datUrl={setLinkUrl} />}

                {state.status === "error" && state.message && (
                  <Alert tone="rose">{state.message}</Alert>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-ink-800 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={drafts.length >= MAX_POST_IMAGES}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100 disabled:opacity-40"
                    >
                      <ImagePlus className="size-3.5" />
                      <span>Ảnh</span>
                      <span className="tabular text-ink-500">
                        {drafts.length}/{MAX_POST_IMAGES}
                      </span>
                    </button>

                    {content.length > LIMITS.postContent - 400 && (
                      <span
                        className={cn(
                          "tabular text-[12.5px] font-semibold",
                          overLimit
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-ink-500",
                        )}
                      >
                        {content.length}/{LIMITS.postContent}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="h-9 rounded-lg px-3 text-[13px] font-semibold text-ink-400 transition-colors hover:text-ink-100"
                    >
                      Huỷ
                    </button>
                    <SubmitButton
                      variant="accent"
                      size="sm"
                      disabled={!canSubmit}
                      pendingText="Đang đăng…"
                    >
                      Đăng
                    </SubmitButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Input file chỉ để mở hộp chọn ảnh; ảnh gửi đi lấy từ `drafts`
            (xem guiBai), nên không đặt `name` và xoá ngay sau khi chọn —
            chọn lại đúng tấm vừa bỏ vẫn kích hoạt onChange. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </form>
    </Card>
  );
}
