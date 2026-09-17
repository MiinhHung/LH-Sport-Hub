"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from "motion/react";
import * as React from "react";

/**
 * Hiệu ứng phóng to theo con trỏ, kiểu thanh Dock của macOS.
 *
 * Ba chỗ cố ý làm khác bản mẫu, không phải chép thiếu:
 *
 * 1. BIẾN ĐỔI THAY VÌ ĐỔI KÍCH THƯỚC. Bản mẫu chạy `width`/`height`, tức là
 *    trình duyệt phải tính lại bố cục cho MỌI mục, MỖI khung hình. Trong
 *    thanh header dính trên đỉnh thì đó là nguồn giật thấy rõ. `transform`
 *    chạy thẳng trên compositor nên không đụng tới bố cục, và các mục bên
 *    cạnh không bị đẩy qua đẩy lại.
 *
 * 2. GIỮ NGUYÊN CHỮ. Dock của macOS là ô biểu tượng không chữ, hiện nhãn
 *    khi rê vào. Ở đây "Cẩm nang" với "Xếp hạng" cần đọc được ngay, nên
 *    chữ ở lại — chỉ biểu tượng nở ra và cả mục nhấc lên.
 *
 * 3. DÙNG clientX, KHÔNG PHẢI pageX. Bản mẫu so `pageX` (tính từ đầu tài
 *    liệu) với `rect.x` (tính từ mép khung nhìn). Hai hệ quy chiếu khác
 *    nhau, nên khi trang cuộn ngang thì tâm phóng to lệch đi.
 *
 * Trên thiết bị cảm ứng và khi người dùng bật "giảm chuyển động" thì tắt
 * hẳn: không có con trỏ thì hiệu ứng vô nghĩa, mà vẫn tốn một spring chạy
 * cho mỗi mục.
 */

const SPRING: SpringOptions = { mass: 0.1, stiffness: 170, damping: 14 };

/** Bán kính ảnh hưởng quanh con trỏ, tính bằng pixel. */
const DISTANCE = 130;

/** Mốc xa nhất — con trỏ ở ngoài khoảng này thì mục về nguyên cỡ. */
const OFF = Number.MAX_SAFE_INTEGER;

const MagneticContext = React.createContext<MotionValue<number> | null>(null);

/**
 * Bọc quanh danh sách mục. Trả về `null` cho ngữ cảnh khi không nên chạy
 * hiệu ứng, và `useMagnetic` bên dưới hiểu đó là "đứng yên".
 */
export function MagneticRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const mouseX = useMotionValue(OFF);
  const [enabled, setEnabled] = React.useState(false);

  // Bật sau khi mount. Dựng phía máy chủ không biết có chuột hay không, nên
  // lần render đầu luôn là bản tĩnh — tránh lệch khi hydrate.
  React.useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setEnabled(fine.matches && !calm.matches);
    apply();
    fine.addEventListener("change", apply);
    calm.addEventListener("change", apply);
    return () => {
      fine.removeEventListener("change", apply);
      calm.removeEventListener("change", apply);
    };
  }, []);

  return (
    <MagneticContext.Provider value={enabled ? mouseX : null}>
      <ul
        className={className}
        onMouseMove={enabled ? (e) => mouseX.set(e.clientX) : undefined}
        onMouseLeave={enabled ? () => mouseX.set(OFF) : undefined}
      >
        {children}
      </ul>
    </MagneticContext.Provider>
  );
}

/**
 * Tính độ nở và độ nhấc của một mục theo khoảng cách tới con trỏ.
 *
 * Luôn gọi đủ mọi hook dù hiệu ứng có bật hay không — số lượng và thứ tự
 * hook phải cố định giữa các lần render. Khi tắt thì `mouseX` đứng im ở
 * OFF nên mọi giá trị nằm yên ở mức nghỉ, không tốn gì.
 */
export function useMagnetic() {
  const mouseX = React.useContext(MagneticContext);
  const ref = React.useRef<HTMLLIElement>(null);
  const still = useMotionValue(OFF);
  const source = mouseX ?? still;

  const distance = useTransform(source, (x: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || x === OFF) return DISTANCE * 2;
    return x - (rect.x + rect.width / 2);
  });

  const scaleTarget = useTransform(
    distance,
    [-DISTANCE, 0, DISTANCE],
    [1, 1.08, 1],
    { clamp: true },
  );
  const liftTarget = useTransform(
    distance,
    [-DISTANCE, 0, DISTANCE],
    [0, -4, 0],
    { clamp: true },
  );
  const iconTarget = useTransform(
    distance,
    [-DISTANCE, 0, DISTANCE],
    [1, 1.26, 1],
    { clamp: true },
  );

  const scale = useSpring(scaleTarget, SPRING);
  const y = useSpring(liftTarget, SPRING);
  const iconScale = useSpring(iconTarget, SPRING);

  return { ref, scale, y, iconScale, active: mouseX !== null };
}

export const MagneticItem = motion.li;
export const MagneticIcon = motion.span;
