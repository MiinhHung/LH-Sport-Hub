"use client";

import { MoreHorizontal, Pin, PinOff, Trash2 } from "@/components/icons";
import { useEffect, useRef, useState, useTransition } from "react";

import { deletePostAction, togglePinPostAction } from "@/actions/posts";
import { idleState } from "@/actions/types";
import { tachCau, useHoiLai } from "@/components/ui/hoi-lai";

export function PostMenu({
  postId,
  isPinned,
  canDelete,
  canPin,
}: {
  postId: string;
  isPinned: boolean;
  canDelete: boolean;
  canPin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hoi, hopThoai } = useHoiLai();
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!canDelete && !canPin) return null;

  async function run(action: typeof deletePostAction, confirmText?: string) {
    if (confirmText) {
      const ok = await hoi({ ...tachCau(confirmText), nguyHiem: true });
      if (!ok) return;
    }
    setOpen(false);
    setError(null);
    const fd = new FormData();
    fd.set("postId", postId);
    startTransition(async () => {
      const result = await action(idleState, fd);
      if (result.status === "error")
        setError(result.message ?? "Có lỗi xảy ra.");
    });
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      {hopThoai}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Tuỳ chọn bài viết"
        className="grid size-10 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-200"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-rise absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-ink-800 bg-ink-900 py-1 shadow-[var(--shadow-pop)]"
        >
          {canPin && (
            <button
              type="button"
              role="menuitem"
              onClick={() => run(togglePinPostAction)}
              className="flex w-full items-center gap-2.5 px-3.5 py-3 text-[13.5px] font-medium text-ink-300 transition-colors hover:bg-ink-850 hover:text-ink-100"
            >
              {isPinned ? (
                <PinOff className="size-4 text-ink-500" />
              ) : (
                <Pin className="size-4 text-ink-500" />
              )}
              {isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                run(deletePostAction, "Xoá bài này? Không khôi phục lại được.")
              }
              className="flex w-full items-center gap-2.5 px-3.5 py-3 text-[13.5px] font-medium text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="size-4" />
              Xoá bài
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-rose-200 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1.5 text-[12.5px] font-medium text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
