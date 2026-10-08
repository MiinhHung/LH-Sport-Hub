import { CutReveal } from "@/components/ui/cut-reveal";
import type { ComponentProps, ReactNode } from "react";

import { avatarColor, cn, initials } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Bề mặt                                                              */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  interactive,
  ...props
}: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-800 bg-ink-900 shadow-[var(--shadow-card)]",
        // Liệt kê rõ thuộc tính thay vì transition-all: transition-all bắt
        // trình duyệt theo dõi mọi thuộc tính đổi giá trị, kể cả những thứ
        // buộc phải tính lại bố cục, nên rê chuột qua danh sách dài bị giật.
        interactive &&
          "transition-[transform,border-color,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-0.5 hover:border-ink-700 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}

/**
 * Dòng thông tin phụ kiểu tạp chí: chữ hoa nhỏ, giãn cách, ngăn nhau bằng
 * dấu chấm giữa.
 *
 * Dùng thay cho việc xếp một hàng badge. Bốn năm viên pill cạnh nhau tạo
 * thành mảng màu loang lổ, hút mắt khỏi tiêu đề và làm mọi thẻ trông
 * giống hệt nhau. Một dòng chữ nhỏ nói đúng chừng ấy thông tin mà không
 * tranh chỗ với nội dung chính.
 */
export function MetaLine({
  items,
  className,
}: {
  items: ReactNode[];
  className?: string;
}) {
  const shown = items.filter(Boolean);
  if (shown.length === 0) return null;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-semibold tracking-[0.14em] text-ink-500 uppercase",
        className,
      )}
    >
      {shown.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden className="text-ink-700">
              ·
            </span>
          )}
          {item}
        </span>
      ))}
    </p>
  );
}

/** Vùng chìm bên trong thẻ — dùng cho thông tin phụ, không phải thẻ lồng thẻ. */
export function Well({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl bg-ink-850 px-3.5 py-3", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Tiêu đề                                                             */
/* ------------------------------------------------------------------ */

/**
 * Tiêu đề trang kiểu tạp chí: nhãn nhỏ chữ hoa giãn cách, tiêu đề serif
 * cỡ lớn, câu dẫn ngắn. Chữ và khoảng trắng làm việc thay cho viền và thẻ.
 */
export function PageIntro({
  eyebrow,
  title,
  lead,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    // Không tự chừa lề dưới: trang nào cũng đã bọc trong `space-y-8`, cộng
    // thêm 40px nữa thành một khoảng trống chết giữa câu dẫn và nội dung.
    <header className={cn("pb-1", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.2em] text-gold-700 dark:text-gold-300 uppercase">
              {eyebrow}
            </p>
          )}
          {/*
            Tiêu đề trang trồi lên từng từ.

            Đặt ở đây chứ không đi sửa từng trang: `PageIntro` là tiêu đề
            chung của cả chục trang trong app, nên một chỗ này là đủ, mà
            sau thêm trang mới cũng tự có.
          */}
          <CutReveal
            as="h1"
            text={title}
            step={45}
            className="font-display mt-2 block text-[34px] leading-[1.05] font-bold text-ink-100 sm:text-[46px]"
          />
        </div>
        {action && <div className="shrink-0 pb-1">{action}</div>}
      </div>

      {lead && (
        <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-ink-500">
          {lead}
        </p>
      )}
    </header>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mb-3 flex items-center justify-between gap-3", className)}
    >
      <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.02em] text-ink-400">
        {children}
      </h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

/**
 * Nền nhạt + chữ đậm cùng sắc. Bộ tone cũ (`bg-*-500/15` + `text-*-300`)
 * vốn dành cho nền tối, đặt lên nền sáng thì đọc không nổi.
 */
const TONES = {
  lime: "bg-gold-50 dark:bg-gold-400/10 text-gold-700 dark:text-gold-300 border-gold-200 dark:border-gold-400/30",
  emerald:
    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30",
  amber:
    "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-400/30",
  rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-400/30",
  sky: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-400/30",
  violet:
    "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-400/30",
  slate: "bg-ink-850 text-ink-400 border-ink-800",
  navy: "bg-navy-50 dark:bg-navy-600/15 text-ink-100 border-navy-100 dark:border-navy-600/35",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "slate",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-[3px] text-[11.5px] leading-[1.35] font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Chấm tròn nhỏ báo trạng thái, dùng kèm nhãn chữ. */
export function Dot({ tone = "slate" }: { tone?: Tone }) {
  const dots: Record<Tone, string> = {
    lime: "bg-gold-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
    slate: "bg-ink-600",
    navy: "bg-navy-700",
  };
  return (
    <span
      aria-hidden
      className={cn("inline-block size-1.5 shrink-0 rounded-full", dots[tone])}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Ô nhập liệu                                                         */
/* ------------------------------------------------------------------ */

const fieldBase =
  "w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-[15px] text-ink-200 shadow-[var(--shadow-soft)] outline-none transition-all duration-200 placeholder:text-ink-500 hover:border-ink-600 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 disabled:cursor-not-allowed disabled:bg-ink-850 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-semibold text-ink-300"
      >
        {label}
        {required && (
          <span className="ml-1 text-rose-500" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="flex items-start gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-24 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        fieldBase,
        "cursor-pointer appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2369768d%22 stroke-width=%222.5%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M6 9l6 6 6-6%22/></svg>')]",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Trạng thái rỗng / thông báo / đang tải                              */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-700 bg-ink-900/60 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-gold-50 dark:bg-gold-400/10 text-gold-700 dark:text-gold-300 ring-1 ring-gold-200">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-ink-200">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "rose",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3 text-sm leading-relaxed",
        TONES[tone],
        className,
      )}
      role="status"
    >
      {children}
    </div>
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-ink-850", className)}
      {...props}
    />
  );
}

/** Khung chờ cho một danh sách thẻ, giữ đúng dáng bố cục thật. */
export function CardSkeleton() {
  return (
    <Card className="p-5">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-16 flex-1 rounded-xl" />
          <Skeleton className="h-16 flex-1 rounded-xl" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Khung chờ cho đầu trang: nhãn nhỏ, tiêu đề, dòng dẫn.
 *
 * Gần như mọi trang trong app mở đầu bằng `PageIntro`, nên khung chờ
 * cũng phải mở đầu bằng đúng hình đó. Khung chờ mà khác dáng với nội
 * dung thật thì lúc dữ liệu về, cả trang nhảy một cái — đúng thứ mà
 * khung chờ sinh ra để tránh.
 */
export function PageIntroSkeleton({ lead = true }: { lead?: boolean }) {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-56 max-w-full" />
      {lead && <Skeleton className="h-4 w-80 max-w-full" />}
    </div>
  );
}

/**
 * Khung chờ cho danh sách chia dòng (thông báo, tin nhắn, thành viên).
 *
 * Bề rộng dòng chữ đổi theo chỉ số thay vì bằng nhau cả loạt: một cột
 * toàn những thanh xám dài y hệt nhau đọc ra là một cái bảng, không ra
 * một danh sách tên người.
 */
export function ListSkeleton({
  rows = 5,
  avatar = true,
}: {
  rows?: number;
  avatar?: boolean;
}) {
  const rong = [72, 58, 84, 64, 76, 52, 80];
  return (
    <Card>
      <ul className="divide-y divide-ink-800">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 p-4">
            {avatar && <Skeleton className="size-10 shrink-0 rounded-full" />}
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton
                className="h-4"
                style={{ width: `${rong[i % rong.length]}%` }}
              />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Số liệu                                                             */
/* ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  sub,
  icon,
  tone = "slate",
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-800 bg-ink-900 p-3.5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-lg border",
              TONES[tone],
            )}
          >
            {icon}
          </span>
        )}
        <span className="truncate text-[11.5px] font-semibold tracking-wide text-ink-500 uppercase">
          {label}
        </span>
      </div>
      <p className="tabular mt-2 text-xl leading-none font-bold text-ink-100">
        {value}
      </p>
      {sub && <p className="mt-1.5 truncate text-xs text-ink-500">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

const AVATAR_SIZES = {
  xs: "size-6 text-[10px] rounded-[7px]",
  sm: "size-8 text-[11px] rounded-[9px]",
  md: "size-10 text-sm rounded-[11px]",
  lg: "size-16 text-lg rounded-2xl",
  xl: "size-24 text-2xl rounded-3xl",
} as const;

export function Avatar({
  name,
  src,
  seed,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  seed?: string;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`Ảnh đại diện của ${name}`}
        className={cn(
          "shrink-0 object-cover ring-1 ring-ink-800",
          AVATAR_SIZES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      title={name}
      aria-label={`Ảnh đại diện của ${name}`}
      role="img"
      className={cn(
        "flex shrink-0 items-center justify-center font-bold text-white ring-1 ring-black/5",
        avatarColor(seed ?? name),
        AVATAR_SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Chồng avatar để tóm tắt nhóm người. */
export function AvatarStack({
  people,
  max = 5,
  size = "sm",
  showRest = true,
}: {
  people: { id: string; fullName: string; avatarUrl: string | null }[];
  max?: number;
  size?: keyof typeof AVATAR_SIZES;
  /** Tắt nhãn "+N người" khi bên cạnh đã có dòng kể tên, kẻo nói hai lần. */
  showRest?: boolean;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <Avatar
            key={p.id}
            name={p.fullName}
            src={p.avatarUrl}
            seed={p.id}
            size={size}
            className="ring-2 ring-ink-900"
          />
        ))}
      </div>
      {showRest && rest > 0 && (
        <span className="ml-2 text-xs font-medium text-ink-500">
          +{rest} người
        </span>
      )}
    </div>
  );
}
