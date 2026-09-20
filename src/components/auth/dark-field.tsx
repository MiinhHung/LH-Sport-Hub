"use client";

import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Ô nhập cho hai trang đăng nhập / đăng ký.
 *
 * PHẢI CÓ BẢN RIÊNG, KHÔNG DÙNG LẠI `Input` CHUNG. `Input` trong
 * `components/ui` dựng cho nền sáng: viền ink-700, nền ink-900, chữ
 * ink-200. Đặt nó lên mặt kính navy thì thành một ô trắng đục — vừa phá
 * lớp kính vừa mất hết hiệu ứng ở dưới. Đây không phải là nhân đôi mã
 * cho vui; hai bảng màu ngược nhau thì phải là hai thứ.
 *
 * Giữ lại của bản mẫu: biểu tượng bên trái đổi màu khi ô được chọn, và
 * nút hiện/ẩn mật khẩu. Bỏ `whileFocus` của bản mẫu vì thẻ `div` không
 * nhận tiêu điểm nên nó không bao giờ chạy.
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
        className="block text-[13px] font-semibold text-white/75"
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
        <p className="text-xs font-medium text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-xs text-white/45">{hint}</p>
      ) : null}
    </div>
  );
}

export function AuthInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon: LucideIcon }) {
  const [focus, setFocus] = React.useState(false);
  const laMatKhau = props.type === "password";
  const [hien, setHien] = React.useState(false);

  return (
    <div className="relative flex items-center">
      <Icon
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-3.5 size-4 transition-colors duration-300",
          focus ? "text-gold-300" : "text-white/35",
        )}
      />

      <input
        {...props}
        // Móc để CSS chặn màu nền tự điền của Chrome — xem globals.css.
        data-auth-input=""
        // Đổi kiểu ô chứ không đổi thuộc tính `type` của props, để bên gọi
        // vẫn khai báo `type="password"` một cách trung thực.
        type={laMatKhau ? (hien ? "text" : "password") : props.type}
        onFocus={(e) => {
          setFocus(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          props.onBlur?.(e);
        }}
        className={cn(
          "h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 text-[15px] text-white outline-none transition-all duration-200",
          "placeholder:text-white/30",
          "hover:border-white/20 focus:border-gold-400/70 focus:bg-white/[0.1] focus:ring-4 focus:ring-gold-400/15",
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
          className="absolute right-3 text-white/40 transition-colors duration-200 hover:text-white"
        >
          {hien ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      )}
    </div>
  );
}

/** Nút gửi của biểu mẫu, bản cho nền tối. */
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
      className="group/nut relative mt-1 h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-gold-300 via-gold-400 to-gold-300 text-[13px] font-bold tracking-[0.1em] text-navy-950 uppercase transition-transform duration-200 hover:-translate-y-px disabled:translate-y-0 disabled:opacity-70"
    >
      {/* Vệt sáng quét ngang, chỉ chạy trong lúc đang gửi */}
      {pending && (
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full animate-[nut-quet_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />
      )}
      <span className="relative flex items-center justify-center gap-2">
        {pending ? pendingText : children}
      </span>
    </button>
  );
}
