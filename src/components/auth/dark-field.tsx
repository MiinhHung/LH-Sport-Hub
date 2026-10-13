"use client";

import { Eye, EyeOff, Loader2, type IconType } from "@/components/icons";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Ô nhập cho hai trang đăng nhập / đăng ký.
 *
 * PHẢI CÓ BẢN RIÊNG, KHÔNG DÙNG LẠI `Input` CHUNG. `Input` trong
 * `components/ui` dựng cho nền sáng: viền ink-700, nền ink-900, chữ
 * ink-200. Đặt nó lên thẻ navy thì thành một ô trắng đục. Đây không phải
 * là nhân đôi mã cho vui; hai bảng màu ngược nhau thì phải là hai thứ.
 *
 * Giữ nút hiện/ẩn mật khẩu. Biểu tượng bên trái giờ là tuỳ chọn: hai biểu
 * mẫu bỏ nó đi, nhãn phía trên đã nói ô này là gì.
 */

export function AuthField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[13.5px] font-semibold text-white"
      >
        {label}
        {required && (
          <span className="ml-1 text-gold-300" aria-hidden>
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p className="text-[12.5px] font-medium text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] text-white/70">{hint}</p>
      ) : null}
    </div>
  );
}

export function AuthInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon?: IconType }) {
  const laMatKhau = props.type === "password";
  const [hien, setHien] = React.useState(false);

  return (
    <div className="relative flex items-center">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 size-4 text-white/60" />
      )}

      <input
        {...props}
        // Móc để CSS chặn màu nền tự điền của Chrome — xem globals.css.
        data-auth-input=""
        // Đổi kiểu ô chứ không đổi thuộc tính `type` của props, để bên gọi
        // vẫn khai báo `type="password"` một cách trung thực.
        type={laMatKhau ? (hien ? "text" : "password") : props.type}
        className={cn(
          "h-11 w-full rounded-lg border border-white/30 bg-navy-950/60 text-[15px] text-white outline-none transition-[border-color,box-shadow,background-color] duration-200",
          "placeholder:text-white/55",
          "hover:border-white/50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30",
          Icon ? "pl-10" : "pl-3.5",
          laMatKhau ? "pr-11" : "pr-3.5",
          className,
        )}
      />

      {laMatKhau && (
        <button
          type="button"
          onClick={() => setHien((v) => !v)}
          // Nút này chỉ đổi cách hiển thị, không phải một bước của biểu mẫu
          // — để nó nằm trong thứ tự Tab sẽ chen vào giữa ô mật khẩu và nút
          // gửi.
          tabIndex={-1}
          aria-label={hien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-1.5 grid size-9 place-items-center rounded-lg text-white/70 transition-colors duration-200 hover:text-white"
        >
          {hien ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      )}
    </div>
  );
}

/** Nút gửi của biểu mẫu: vàng đặc, chữ navy, viết thường như mọi nút trong app. */
export function AuthSubmit({
  pending,
  pendingText,
  children,
}: {
  pending: boolean;
  pendingText: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gold-400 text-[15px] font-semibold text-navy-900 outline-none transition-[background-color,transform] duration-200 hover:bg-gold-300 focus-visible:ring-2 focus-visible:ring-gold-300 active:translate-y-px disabled:cursor-wait disabled:opacity-80"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? pendingText : children}
    </button>
  );
}
