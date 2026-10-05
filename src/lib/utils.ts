import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* Ngay gio                                                            */
/* ------------------------------------------------------------------ */

const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || "Asia/Ho_Chi_Minh";

const WEEKDAYS = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

function parts(date: Date) {
  const fmt = new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) map[p.type] = p.value;
  return map;
}

/** "Thứ 7, 19/09 • 19:00" */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return "Chưa xác định";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Chưa xác định";
  const p = parts(d);
  const weekday = WEEKDAYS[dayIndexInZone(d)];
  return `${weekday}, ${p.day}/${p.month} • ${p.hour}:${p.minute}`;
}

/** "19/09/2026" */
export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const p = parts(d);
  return `${p.day}/${p.month}/${p.year}`;
}

/** "19:00" */
export function formatTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const p = parts(d);
  return `${p.hour}:${p.minute}`;
}

function dayIndexInZone(date: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

/**
 * Ngày thứ mấy trong tuần, dạng chữ: "Thứ 7", "Chủ nhật".
 */
export function weekdayLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return WEEKDAYS[dayIndexInZone(d)] ?? "";
}

/** Chỉ số ngày trong năm theo múi giờ app, dùng để so hai mốc cùng ngày. */
function ymdInZone(date: Date): string {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Hôm nay? Ngày mai? */
export function dayLabel(date: Date | string): string | null {
  const d = typeof date === "string" ? new Date(date) : date;
  const homNay = new Date();
  const mai = new Date(homNay.getTime() + 24 * 60 * 60 * 1000);
  if (ymdInZone(d) === ymdInZone(homNay)) return "Hôm nay";
  if (ymdInZone(d) === ymdInZone(mai)) return "Ngày mai";
  return null;
}

/**
 * Buổi này rơi vào tuần nào: 0 = tuần này, 1 = tuần sau, 2 = xa hơn.
 *
 * TUẦN BẮT ĐẦU TỪ THỨ HAI, không phải Chủ nhật. `getDay()` của
 * JavaScript coi Chủ nhật là 0 theo lối Mỹ; ở Việt Nam thì Chủ nhật là
 * ngày CUỐI tuần. Không đổi lại thì mỗi Chủ nhật, buổi tập hôm đó bị xếp
 * sang "tuần sau" trong khi ai cũng hiểu nó là cuối tuần này.
 *
 * Mốc so sánh lấy theo múi giờ của app chứ không theo máy người dùng, để
 * ai mở từ nước ngoài vẫn thấy đúng tuần như người ở nhà.
 */
export function weekBucket(date: Date | string): 0 | 1 | 2 {
  const d = typeof date === "string" ? new Date(date) : date;

  const thuHaiCuaTuan = (moc: Date) => {
    const thu = dayIndexInZone(moc); // 0 = Chủ nhật
    const luiLai = thu === 0 ? 6 : thu - 1;
    const p = parts(moc);
    // Dựng lại ngày theo múi giờ app rồi lùi về thứ Hai, giữ mốc giữa
    // trưa để đổi ngày do lệch giờ không đẩy sang hôm trước.
    const nen = new Date(`${p.year}-${p.month}-${p.day}T12:00:00`);
    nen.setDate(nen.getDate() - luiLai);
    return nen;
  };

  const dauTuanNay = thuHaiCuaTuan(new Date());
  const p = parts(d);
  const ngay = new Date(`${p.year}-${p.month}-${p.day}T12:00:00`);

  const soTuan = Math.floor(
    (ngay.getTime() - dauTuanNay.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );

  if (soTuan <= 0) return 0;
  if (soTuan === 1) return 1;
  return 2;
}

export const WEEK_BUCKET_LABELS = ["Tuần này", "Tuần sau", "Sau đó"] as const;

/** "3 phút trước", "2 ngày trước", "vừa xong" */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);

  if (sec < 45) return "vừa xong";
  if (sec < 90) return "1 phút trước";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hour = Math.round(min / 60);
  if (hour < 24) return `${hour} giờ trước`;
  const day = Math.round(hour / 24);
  if (day < 30) return `${day} ngày trước`;
  const month = Math.round(day / 30);
  if (month < 12) return `${month} tháng trước`;
  return `${Math.round(month / 12)} năm trước`;
}

/** Khoảng cách tới tương lai: "còn 2 ngày", "đã qua" */
export function timeUntil(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  if (diffMs <= 0) return "đã qua";
  const min = Math.round(diffMs / 60000);
  if (min < 60) return `còn ${min} phút`;
  const hour = Math.round(min / 60);
  if (hour < 24) return `còn ${hour} giờ`;
  const day = Math.round(hour / 24);
  return `còn ${day} ngày`;
}

/** Giá trị cho input type="datetime-local" (giờ địa phương). */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ------------------------------------------------------------------ */
/* Khac                                                                */
/* ------------------------------------------------------------------ */

export function formatVnd(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Màu nền avatar ổn định theo id, để mỗi người luôn cùng một màu. */
/**
 * Màu nền cho ảnh đại diện chữ cái, suy ra từ id người dùng.
 *
 * BẢNG MÀU TRẦM, KHÔNG PHẢI CẦU VỒNG. Bản trước dùng mười màu mức 500-600
 * (hồng sen, hổ phách, xanh ngọc, tím...). Hai chỗ hỏng:
 *
 * 1. CHỮ TRẮNG TRÊN ĐÓ KHÔNG ĐỌC ĐƯỢC. Đo tương phản chữ trắng trên sáu
 *    màu trong bảng cũ: rose-500 ra 3,67 · amber-500 ra 2,15 · lime-600
 *    ra 3,09 · teal-500 ra 2,49 · sky-500 ra 2,77 · fuchsia-500 ra 3,46.
 *    Ngưỡng cho chữ nhỏ là 4,5 — tức là trượt toàn bộ. Bảng mới đo lại
 *    nằm trong khoảng 5,0 đến 10,0.
 * 2. Mười màu rực đặt cạnh nhau trong một dãy avatar chửi nhau với navy
 *    và vàng của thương hiệu; nhìn ra một tờ sticker chứ không ra một
 *    đội.
 *
 * Vẫn đủ mười màu phân biệt được người nọ với người kia, chỉ là trầm
 * xuống để chúng ngồi chung được với nhau.
 */
export function avatarColor(seed: string): string {
  const palette = [
    "bg-navy-700",
    "bg-slate-600",
    "bg-teal-700",
    "bg-emerald-700",
    "bg-amber-700",
    "bg-rose-800",
    "bg-indigo-700",
    "bg-stone-600",
    "bg-cyan-800",
    "bg-violet-800",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

/** Ghép danh sách tên kiểu tiếng Việt: "A, B và C". */
export function joinNames(names: string[]): string {
  if (names.length === 0) return "—";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} và ${names[names.length - 1]}`;
}
