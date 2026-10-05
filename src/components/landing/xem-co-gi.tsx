"use client";

import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Hành động phụ của hero: một dòng chữ, không phải một cái nút nữa.
 *
 * VÌ SAO BỎ VIÊN THUỐC THỨ HAI. Hai nút cũ cùng cao 44px, cùng bo tròn
 * viên thuốc, cùng chữ hoa giãn cách, cùng mũi tên sang phải, cùng màu
 * chữ. Thứ duy nhất phân biệt chúng là màu viền — mà đo trên nền navy
 * thì viền vàng chỉ đạt 1,09:1 và viền kem 1,15:1, tức là không ai nhìn
 * thấy. Hai viên thuốc giống hệt nhau đặt cạnh nhau thì không có cái
 * nào là chính.
 *
 * Hạ cái thứ hai xuống thành chữ thường là cách rẻ nhất để có thứ bậc:
 * không cần tô vẽ gì thêm, chỉ cần một cái thôi không giả vờ làm nút.
 *
 * MŨI TÊN CHỈ XUỐNG, KHÔNG CHỈ SANG PHẢI. Cả hai nút cũ đều đeo mũi tên
 * sang phải, trong khi việc của cái này là CUỘN XUỐNG mục "Trong này có
 * gì" nằm ngay bên dưới. Mũi tên sai hướng là một lời nói dối nhỏ về
 * chuyện sắp xảy ra.
 *
 * Màu chữ để nguyên độ đục của kem chứ không hạ opacity: thứ bậc đã do
 * cỡ chữ và việc bỏ viền gánh rồi, hạ thêm độ đục chỉ làm chữ khó đọc
 * trên nền navy mà không được gì.
 */
export function XemCoGi({ text = "Có gì trong này" }: { text?: string }) {
  const it = !!useReducedMotion();

  return (
    <a
      href="#co-gi"
      className="group inline-flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold tracking-[0.14em] uppercase outline-none transition-opacity duration-300 hover:opacity-70 focus-visible:ring-4 focus-visible:ring-[#dcae42]/35"
      style={{ color: "#f2ede3" }}
    >
      <span className="border-b border-transparent pb-0.5 transition-colors duration-300 group-hover:border-[#f2ede3]/50">
        {text}
      </span>

      {/* Nhịp trôi xuống rất nhẹ — đủ để mắt hiểu là "ở dưới còn nữa",
          chưa tới mức thành một thứ nhấp nháy đòi chú ý. */}
      <motion.span
        aria-hidden
        animate={it ? undefined : { y: [0, 4, 0] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="size-4" />
      </motion.span>
    </a>
  );
}
