"use client";

import {
  ImagePlus,
  Megaphone,
  MessageSquare,
  UserSearch,
  X,
} from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createPostAction } from "@/actions/posts";
import { idleState } from "@/actions/types";
import { Alert, Avatar, Card } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { LIMITS, MAX_POST_IMAGES, type PostTypeKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Draft = { file: File; url: string };

const TYPE_OPTIONS: {
  key: PostTypeKey;
  label: string;
  icon: typeof MessageSquare;
  modOnly?: boolean;
}[] = [
  { key: "text", label: "Chém gió", icon: MessageSquare },
  { key: "looking_for_player", label: "Tìm người", icon: UserSearch },
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

  // Dọn sạch sau khi đăng thành công.
  useEffect(() => {
    if (state.status !== "success") return;
    setContent("");
    setType("text");
    setDrafts((current) => {
      current.forEach((d) => URL.revokeObjectURL(d.url));
      return [];
    });
    setOpen(false);
    formRef.current?.reset();
  }, [state.runId, state.status]);

  // Thu hồi object URL khi rời trang, tránh rò bộ nhớ.
  useEffect(() => {
    return () => drafts.forEach((d) => URL.revokeObjectURL(d.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Ghi danh sách ảnh hiện tại ngược vào input file.
   * Không có bước này thì chọn ảnh làm nhiều đợt hoặc bỏ bớt ảnh
   * sẽ gửi lên sai, vì input chỉ nhớ đúng lần chọn cuối cùng.
   */
  useEffect(() => {
    if (!fileRef.current) return;
    const transfer = new DataTransfer();
    drafts.forEach((d) => transfer.items.add(d.file));
    fileRef.current.files = transfer.files;
  }, [drafts]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setDrafts((current) => {
      const room = MAX_POST_IMAGES - current.length;
      const picked = Array.from(list).slice(0, Math.max(0, room));
      return [
        ...current,
        ...picked.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ];
    });
    setOpen(true);
  }

  /**
   * Nhận ảnh dán thẳng từ clipboard.
   *
   * Đây là đường ngắn nhất để khoe ảnh: chụp màn hình hoặc copy ảnh ở
   * chỗ khác rồi Ctrl+V vào ô soạn. Không có nó thì phải lưu ảnh ra tệp
   * rồi mới bấm nút chọn — ba bước cho một việc đáng lẽ một bước.
   */
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

  function removeDraft(index: number) {
    setDrafts((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, i) => i !== index);
    });
  }

  const options = TYPE_OPTIONS.filter((o) => !o.modOnly || canAnnounce);
  const overLimit = content.length > LIMITS.postContent;
  const canSubmit = content.trim().length > 0 && !overLimit;

  return (
    <Card className="overflow-hidden">
      <form
        ref={formRef}
        action={action}
        className={cn(
          "relative p-4 transition-colors sm:p-5",
          dangKeo && "bg-gold-50 dark:bg-gold-400/10",
        )}
        onDragOver={(e) => {
          // Chỉ bật khi thứ đang kéo là tệp, không phải chữ bôi đen.
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDangKeo(true);
        }}
        onDragLeave={(e) => {
          // `relatedTarget` nằm ngoài form mới là rời thật. Không kiểm thì
          // rê qua từng phần tử con cũng bị tính là rời, khung nháy liên tục.
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDangKeo(false);
        }}
        onDrop={khiTha}
      >
        {dangKeo && (
          <div className="pointer-events-none absolute inset-2 grid place-items-center rounded-xl border-2 border-dashed border-gold-400 text-[13px] font-bold text-gold-700 dark:text-gold-300">
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
              rows={open ? 4 : 1}
              maxLength={LIMITS.postContent + 200}
              placeholder={`${author.fullName.split(" ").slice(-1)[0]} ơi, có gì mới không?`}
              aria-label="Nội dung bài viết"
              className={cn(
                "w-full resize-none rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-[15px] leading-relaxed text-ink-200 outline-none transition-all duration-200",
                "placeholder:text-ink-500 hover:border-ink-600",
                "focus:border-gold-400 focus:bg-ink-900 focus:ring-4 focus:ring-gold-400/15",
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
                      className="aspect-square w-full rounded-xl object-cover ring-1 ring-ink-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeDraft(i)}
                      aria-label={`Bỏ ảnh ${i + 1}`}
                      className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-navy-900/85 text-white transition-colors hover:bg-navy-900"
                    >
                      <X className="size-3.5" strokeWidth={3} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/*
              HÀNG NÚT LUÔN HIỆN, KHÔNG GIẤU SAU CÚ BẤM ĐẦU TIÊN.

              Bản trước gói cả nút ảnh, chọn loại bài và nút đăng vào
              `{open && ...}`, nên lúc nghỉ ô soạn bài chỉ còn trơ một ô
              chữ. Chụp bảng tin thật thì thấy đúng vậy: không một dấu
              hiệu nào cho biết đăng được ảnh — mà "khoe ảnh buổi vừa
              đánh" lại chính là việc người ta vào đây để làm.

              Giờ nút ảnh nằm ngoài, thấy ngay từ đầu. Phần còn lại
              (chọn loại bài, đếm chữ, nút đăng) vẫn chỉ hiện khi bắt đầu
              viết — những thứ đó chỉ có nghĩa khi đã có nội dung.
            */}
            {!open && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-100"
                >
                  <ImagePlus className="size-4" />
                  Ảnh
                </button>
                <span className="text-[12px] text-ink-600">
                  hoặc dán ảnh thẳng vào đây
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
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                          active
                            ? "bg-gold-100 dark:bg-gold-400/20 text-gold-700 dark:text-gold-300"
                            : "text-ink-500 hover:bg-ink-850 hover:text-ink-300",
                        )}
                      >
                        <Icon className="size-3.5" />
                        {o.label}
                      </button>
                    );
                  })}
                </div>

                {state.status === "error" && state.message && (
                  <Alert tone="rose">{state.message}</Alert>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-ink-800 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={drafts.length >= MAX_POST_IMAGES}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-100 disabled:opacity-40"
                    >
                      <ImagePlus className="size-4" />
                      Ảnh
                      <span className="tabular text-ink-600">
                        {drafts.length}/{MAX_POST_IMAGES}
                      </span>
                    </button>

                    {content.length > LIMITS.postContent - 400 && (
                      <span
                        className={cn(
                          "tabular text-[12px] font-semibold",
                          overLimit
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-ink-500",
                        )}
                      >
                        {content.length}/{LIMITS.postContent}
                      </span>
                    )}
                  </div>

                  <SubmitButton
                    variant="accent"
                    size="sm"
                    disabled={!canSubmit}
                    pendingText="Đang đăng…"
                  >
                    Đăng
                  </SubmitButton>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Input file thật, ẩn đi — các nút ở trên điều khiển nó. */}
        <input
          ref={fileRef}
          type="file"
          name="images"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </form>
    </Card>
  );
}
