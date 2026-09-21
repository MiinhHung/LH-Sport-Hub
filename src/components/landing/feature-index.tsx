"use client";

import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Reveal } from "@/components/landing/reveal";

/**
 * Mục lục "1 chỗ cho tất cả" — rê chuột vào dòng nào thì ảnh của mục đó
 * hiện ra và bám theo con trỏ.
 *
 * BỐN ĐIỀU KHÔNG CÓ TRONG BẢN MẪU, nhưng bỏ đi thì hỏng thật:
 *
 *  1. CHỈ BẬT KHI CÓ CHUỘT THẬT. Trên điện thoại không có "rê chuột": một
 *     cú chạm vừa là hover vừa là bấm, nên ảnh sẽ loé lên rồi trang nhảy
 *     đi. Kiểm `(pointer: fine)` trước khi gắn gì.
 *
 *  2. BỐN ẢNH DỰNG SẴN TRONG CÂY, chỉ đổi độ mờ. Nếu đợi tới lúc rê mới
 *     nạp thì lần đầu người ta thấy một ô trống rồi ảnh mới nhảy vào.
 *
 *  3. GIỮ ẢNH TRONG LÒNG KHỐI. Ảnh neo giữa con trỏ, rê sát mép phải là
 *     nó thò ra ngoài và đẻ ra thanh cuộn ngang cho cả trang. Nên toạ độ
 *     bị kẹp lại trong phạm vi khối.
 *
 *  4. BẬT SAU KHI HYDRATE. Đọc `matchMedia` ngay lúc render thì máy chủ
 *     và trình duyệt ra hai kết quả khác nhau — đúng lỗi đã gặp ở thẻ
 *     kính trang đăng nhập.
 */

export type Feature = {
  href: string;
  title: string;
  body: string;
  /** Ảnh hiện lên khi rê chuột vào dòng này. */
  anh: string;
  alt: string;
};

/** Cỡ ô ảnh xem trước, pixel. */
const ANH_W = 260;
const ANH_H = 186;

export function FeatureIndex({
  items,
  gold,
  ink,
  muted,
  line,
}: {
  items: Feature[];
  gold: string;
  ink: string;
  muted: string;
  line: string;
}) {
  const [batDuoc, setBatDuoc] = React.useState(false);
  const [dangXem, setDangXem] = React.useState<number | null>(null);
  const khoiRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const coChuot = window.matchMedia("(pointer: fine)").matches;
    const itChuyenDong = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setBatDuoc(coChuot && !itChuyenDong);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Lò xo hơi chậm: ảnh đuổi theo chứ không dán vào con trỏ.
  const lx = useSpring(x, { stiffness: 220, damping: 28, mass: 0.7 });
  const ly = useSpring(y, { stiffness: 220, damping: 28, mass: 0.7 });

  // Nghiêng theo vận tốc ngang — chi tiết làm ảnh có vẻ "bị kéo" theo tay
  // chứ không phải một ô trôi cứng đờ.
  const vx = useVelocity(lx);
  const nghieng = useTransform(vx, [-900, 900], [-9, 9], { clamp: true });
  const nghiengMem = useSpring(nghieng, { stiffness: 200, damping: 24 });

  const theoChuot = (e: React.PointerEvent) => {
    const khoi = khoiRef.current;
    if (!khoi) return;
    const r = khoi.getBoundingClientRect();
    const nua = ANH_W / 2;
    // Kẹp lại để ảnh không thò ra ngoài khối — xem ghi chú số 3.
    const tx = Math.min(Math.max(e.clientX - r.left, nua), r.width - nua);
    x.set(tx);
    y.set(e.clientY - r.top);
  };

  return (
    <div
      ref={khoiRef}
      className="relative mt-14"
      onPointerLeave={() => setDangXem(null)}
    >
      {batDuoc && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute z-20"
          style={{
            x: lx,
            y: ly,
            rotate: nghiengMem,
            width: ANH_W,
            height: ANH_H,
            translateX: "-50%",
            translateY: "-50%",
          }}
        >
          {items.map((it, i) => (
            <div
              key={it.href}
              className="absolute inset-0 overflow-hidden rounded-2xl shadow-[0_24px_60px_-20px_rgba(0,26,74,0.45)] transition-[opacity,transform] duration-300 ease-out"
              style={{
                opacity: dangXem === i ? 1 : 0,
                transform: dangXem === i ? "scale(1)" : "scale(0.92)",
              }}
            >
              <Image
                src={it.anh}
                alt=""
                fill
                sizes={`${ANH_W}px`}
                className="object-cover"
              />
            </div>
          ))}
        </motion.div>
      )}

      <ul className="border-t" style={{ borderColor: line }}>
        {items.map(({ href, title, body }, i) => (
          <li key={href} className="border-b" style={{ borderColor: line }}>
            <Reveal delay={i * 60}>
              <Link
                href={href}
                onPointerEnter={() => batDuoc && setDangXem(i)}
                onPointerMove={batDuoc ? theoChuot : undefined}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-5 gap-y-1.5 py-6 transition-opacity duration-300 md:grid-cols-[3.5rem_minmax(0,15rem)_minmax(0,1fr)_2rem] md:gap-x-8 md:py-7"
                style={{
                  // Dòng đang trỏ vào nổi lên bằng cách làm mờ mấy dòng
                  // kia, chứ không phải tô đậm chính nó — cách này không
                  // đụng tới màu chữ nên không phá độ tương phản.
                  opacity: dangXem === null || dangXem === i ? 1 : 0.4,
                }}
              >
                <span
                  aria-hidden
                  className="font-display tabular text-[15px] leading-none font-bold transition-colors duration-300 md:text-[17px]"
                  style={{ color: gold, opacity: 0.55 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3
                  className="font-display text-[22px] leading-tight font-bold transition-colors duration-300 group-hover:text-navy-700 md:text-[26px]"
                  style={{ color: ink }}
                >
                  {title}
                </h3>

                {/* Trên điện thoại câu mô tả xuống dòng riêng, nhảy qua
                    cột số để thẳng hàng với tên mục. */}
                <p
                  className="col-start-2 col-end-4 text-[14px] leading-relaxed md:col-auto md:text-[14.5px]"
                  style={{ color: muted }}
                >
                  {body}
                </p>

                <ArrowRight
                  aria-hidden
                  className="col-start-3 row-start-1 size-4 self-center opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:col-auto md:row-auto"
                  style={{ color: gold }}
                />
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
