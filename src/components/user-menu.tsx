"use client";

import {
  ChevronDown,
  LogOut,
  Shield,
  Trophy,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOutAction } from "@/actions/auth";
import { Avatar } from "@/components/ui";
import { ROLES, type RoleKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ITEM =
  "flex w-full items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-850 hover:text-navy-900";

export function UserMenu({
  id,
  fullName,
  avatarUrl,
  role,
}: {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: RoleKey;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const canSeeAdmin = role === "admin" || role === "moderator";

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mở menu tài khoản"
        className={cn(
          "flex items-center gap-1.5 rounded-xl p-1 pr-1.5 transition-colors",
          open ? "bg-ink-850" : "hover:bg-ink-850",
        )}
      >
        <Avatar name={fullName} src={avatarUrl} seed={id} size="sm" />
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 text-ink-500 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-rise absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-[var(--shadow-pop)]"
        >
          <div className="flex items-center gap-3 border-b border-ink-800 bg-ink-850/60 px-3.5 py-3">
            <Avatar name={fullName} src={avatarUrl} seed={id} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-900">
                {fullName}
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-gold-600">
                {ROLES[role].label}
              </p>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/ho-so"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={ITEM}
            >
              <User className="size-4 text-ink-500" />
              Hồ sơ của tôi
            </Link>

            <Link
              href="/thanh-vien"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={ITEM}
            >
              <Users className="size-4 text-ink-500" />
              Thành viên
            </Link>

            {/* Thanh dưới trên điện thoại không còn chỗ cho mục này. */}
            <Link
              href="/bang-phong-than"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(ITEM, "md:hidden")}
            >
              <Trophy className="size-4 text-ink-500" />
              Bảng phong thần
            </Link>

            {canSeeAdmin && (
              <Link
                href="/quan-tri"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={ITEM}
              >
                <Shield className="size-4 text-ink-500" />
                Quản trị
              </Link>
            )}
          </div>

          <form action={signOutAction} className="border-t border-ink-800 py-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="size-4" />
              Đăng xuất
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
