"use client";

import { Moon, Sun } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Sáng / tối cho toàn bộ app (trừ trang giới thiệu — xem ghi chú cuối tệp).
 *
 * KHÔNG DÙNG `next-themes`. Việc nó làm ở đây chỉ gói gọn trong chừng này
 * mã, mà đổi lại là một gói nữa phải theo dõi. Ba thứ khó của bài toán đều
 * đã xử lý bên dưới: nháy màu lúc tải, đồng bộ giữa các tab, và theo cài
 * đặt máy khi người dùng chưa chọn gì.
 */

const KHOA = "lh-theme";

export type Theme = "light" | "dark";

/**
 * Đoạn mã chặn, chạy TRƯỚC khi trình duyệt vẽ khung hình đầu tiên.
 *
 * ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT. Nếu để React gắn lớp `.dark` trong effect
 * thì khung hình đầu tiên đã vẽ xong bằng nền sáng rồi — người chọn nền
 * tối sẽ thấy một phát trắng loá mỗi lần mở trang. Thẻ script không có
 * `async`/`defer` đặt ngay đầu <body> thì trình duyệt dừng dựng cây lại mà
 * chạy nó, nên lớp đã nằm trên <html> từ trước khi có gì hiện ra.
 *
 * Bọc trong try/catch vì localStorage ném lỗi khi chặn cookie bên thứ ba
 * hoặc ở chế độ ẩn danh của vài trình duyệt — hỏng chỗ này mà không bắt
 * thì cả trang trắng.
 */
export const THEME_SCRIPT = `
try {
  var t = localStorage.getItem(${JSON.stringify(KHOA)});
  if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (t === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`.trim();

function docTheme(): Theme {
  try {
    const t = localStorage.getItem(KHOA);
    if (t === "dark" || t === "light") return t;
  } catch {
    // Không đọc được thì coi như chưa chọn, rơi xuống cài đặt máy.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  /*
   * Bắt đầu ở "light" ở CẢ hai phía rồi mới chỉnh lại sau khi gắn.
   *
   * Đọc localStorage ngay trong lúc render sẽ cho ra kết quả khác với
   * máy chủ và làm hỏng hydrate — đúng cái lỗi đã gặp ở thẻ kính trang
   * đăng nhập. Ở đây không sợ nháy màu, vì lớp `.dark` thật đã do đoạn
   * mã chặn gắn từ trước; state này chỉ để cái công tắc biết nó đang ở
   * nấc nào.
   */
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    setTheme(docTheme());

    // Đổi ở tab này thì tab kia cũng đổi theo. `storage` chỉ nổ ở CÁC TAB
    // KHÁC, nên không sợ vòng lặp.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KHOA) return;
      const t = e.newValue === "dark" ? "dark" : "light";
      setTheme(t);
      document.documentElement.classList.toggle("dark", t === "dark");
    };
    window.addEventListener("storage", onStorage);

    // Người dùng chưa tự chọn thì bám theo cài đặt máy, kể cả khi máy đổi
    // giữa chừng (nhiều máy tự chuyển tối theo giờ).
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => {
      try {
        if (localStorage.getItem(KHOA)) return;
      } catch {
        return;
      }
      const t: Theme = mq.matches ? "dark" : "light";
      setTheme(t);
      document.documentElement.classList.toggle("dark", t === "dark");
    };
    mq.addEventListener("change", onMq);

    return () => {
      window.removeEventListener("storage", onStorage);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const doi = React.useCallback(() => {
    setTheme((cu) => {
      const moi: Theme = cu === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", moi === "dark");
      try {
        localStorage.setItem(KHOA, moi);
      } catch {
        // Không ghi được thì vẫn đổi cho phiên này, chỉ là lần sau không nhớ.
      }
      return moi;
    });
  }, []);

  return { theme, doi };
}

/**
 * Công tắc hai nấc.
 *
 * Dựng lại từ mẫu 21st.dev nhưng sửa ba chỗ:
 *
 *  1. LÀ THẺ `button`, không phải `div role="button" tabIndex={0}`. Mẫu
 *     gốc chỉ gắn `onClick`, nên bấm chuột thì được còn gõ Space hay Enter
 *     thì không — `div` không tự kích hoạt bằng bàn phím như `button`.
 *
 *  2. Có `aria-label` và `aria-pressed`. Mẫu gốc chỉ có hai biểu tượng,
 *     trình đọc màn hình đọc ra một nút trống không rõ để làm gì.
 *
 *  3. Màu lấy từ hệ màu của app thay vì zinc, và hai biểu tượng dùng chung
 *     một con trượt thay vì hai khối tự dịch ngược chiều nhau.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, doi } = useTheme();
  const toi = theme === "dark";

  return (
    <button
      type="button"
      onClick={doi}
      aria-label={toi ? "Chuyển sang nền sáng" : "Chuyển sang nền tối"}
      aria-pressed={toi}
      title={toi ? "Nền sáng" : "Nền tối"}
      className={cn(
        "relative h-8 w-14 shrink-0 rounded-full border border-ink-800 bg-ink-850 transition-colors duration-300 hover:border-ink-700",
        className,
      )}
    >
      {/* Con trượt */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full shadow-[var(--shadow-soft)] transition-[left,background-color] duration-300 ease-out",
          // Ở nền tối, núm không được dùng navy: navy-800 và nền rãnh
          // ink-850 gần như cùng một màu, nhìn ra một cái rãnh trống
          // chứ không ra cái nút gạt. ink-700 sáng hơn rãnh một bậc.
          toi ? "left-[calc(100%-1.75rem)] bg-ink-700" : "left-1 bg-gold-400",
        )}
      >
        {toi ? (
          <Moon className="size-3.5 text-gold-300" strokeWidth={2} />
        ) : (
          <Sun className="size-3.5 text-navy-900" strokeWidth={2} />
        )}
      </span>

      {/* Biểu tượng mờ ở nấc còn lại, cho thấy bấm vào sẽ ra gì */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 grid size-6 -translate-y-1/2 place-items-center text-ink-600 transition-opacity duration-300",
          toi ? "left-1 opacity-70" : "left-[calc(100%-1.75rem)] opacity-70",
        )}
      >
        {toi ? (
          <Sun className="size-3.5" strokeWidth={2} />
        ) : (
          <Moon className="size-3.5" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}

/*
 * VỀ TRANG GIỚI THIỆU: nó không cần loại trừ bằng mã nào cả.
 *
 * Trang đó tự đặt màu bằng mã hex viết thẳng trong tệp (PAPER, INK, GOLD…)
 * chứ không đi qua thang `ink`, nên lớp `.dark` có bật hay không nó vẫn
 * giữ nguyên nền trắng. Hai trang đăng nhập / đăng ký cũng vậy — chúng đã
 * là nền tối cố định.
 *
 * Nên công tắc chỉ xuất hiện trong khung app, và cũng chỉ khung app đổi màu.
 */
