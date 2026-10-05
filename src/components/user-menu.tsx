"use client";

import {
  ChevronDown,
  LoaderCircle,
  LogOut,
  Moon,
  Shield,
  Sun,
  SunMoon,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { PanInfo, Variants } from "motion/react";
import Link from "next/link";
import * as React from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";

import { signOutAction } from "@/actions/auth";
import { useTheme, type Theme } from "@/components/theme";
import { Avatar } from "@/components/ui";
import { ROLES, type RoleKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Menu tài khoản.
 *
 * DỰNG LẠI TỪ MẪU "Arc user menu" CỦA 21st.dev, nhưng không chép được
 * nguyên bản, và dưới đây là lý do từng chỗ:
 *
 * 1. MẪU GỐC DÙNG CSS MODULES, mà tệp `.module.css` thì không nằm trong
 *    đoạn mã được gửi — chép phần tsx về sẽ ra một menu không có một
 *    dòng kiểu dáng nào. Viết lại bằng Tailwind, cũng là thứ cả app đang
 *    dùng; trộn thêm một hệ kiểu dáng thứ hai cho đúng một thành phần là
 *    chuốc nợ.
 *
 * 2. BỎ PHẦN TRẠNG THÁI CÓ MẶT (rảnh / bận / đi vắng). App này không có
 *    khái niệm đó ở đâu cả, thêm vào là bịa ra một tính năng không có
 *    thật phía sau.
 *
 * 3. BỎ GỢI Ý PHÍM TẮT (⌘ ,). App chưa có phím tắt nào, in ra thì thành
 *    nói dối người dùng.
 *
 * 4. CÔNG TẮC NỀN CHỈ HAI NẤC, không phải ba. Mẫu gốc có "theo máy", còn
 *    `Theme` của app chỉ là `light | dark`. Vẽ thêm nấc thứ ba thì phải
 *    sửa cả hệ theme, mà việc đó không nằm trong điều được yêu cầu.
 *
 * Giữ lại đúng những thứ làm nên hiệu ứng:
 *
 *   — Bảng menu nở ra TỪ CHÍNH CÁI AVATAR bằng lò xo, các dòng hiện so le
 *     theo sau.
 *   — Một vệt sáng trượt theo dòng đang được chọn, dù chọn bằng chuột hay
 *     bằng bàn phím.
 *   — Dưới 640px thì mở thành tấm trượt từ đáy màn hình, kéo xuống để
 *     đóng.
 *   — Đi lại bằng phím mũi tên, Home/End, Esc, và gõ chữ để nhảy tới dòng.
 *   — Nút đăng xuất tự báo đang chạy.
 */

/* ------------------------------------------------------------------ */
/* Nhịp chuyển động                                                    */
/* ------------------------------------------------------------------ */

const VAO = [0.16, 1, 0.3, 1] as const;
const RA = [0.4, 0, 1, 1] as const;

const BANG: Variants = {
  dong: { opacity: 0, scale: 0.94 },
  mo: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      visualDuration: 0.3,
      bounce: 0,
      opacity: { duration: 0.14, ease: VAO },
      delayChildren: 0.03,
      staggerChildren: 0.016,
    },
  },
  thoat: { opacity: 0, scale: 0.97, transition: { duration: 0.12, ease: RA } },
};

const TAM_TRUOT: Variants = {
  dong: { y: "100%" },
  mo: {
    y: 0,
    transition: {
      type: "spring",
      visualDuration: 0.36,
      bounce: 0,
      delayChildren: 0.06,
      staggerChildren: 0.02,
    },
  },
  thoat: { y: "100%", transition: { duration: 0.22, ease: RA } },
};

/** Bản cho máy bật "giảm chuyển động": chỉ mờ dần, không nở không trượt. */
const DUNG_YEN: Variants = {
  dong: { opacity: 0 },
  mo: { opacity: 1, transition: { duration: 0.12 } },
  thoat: { opacity: 0, transition: { duration: 0.1 } },
};

const DONG: Variants = {
  dong: { opacity: 0, y: 3 },
  mo: { opacity: 1, y: 0, transition: { duration: 0.2, ease: VAO } },
};

/* ------------------------------------------------------------------ */
/* Mảnh nhỏ                                                            */
/* ------------------------------------------------------------------ */

const MUC =
  "relative z-10 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-300 outline-none transition-colors focus-visible:text-ink-100";

/** Chữ đổi thì chữ cũ bay lên, chữ mới trồi lên từ một lớp mờ. */
function ChuTroi({ chu, it }: { chu: string; it: boolean }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={chu}
        className="inline-block"
        initial={
          it ? { opacity: 0 } : { opacity: 0, y: "0.35em", filter: "blur(2px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={
          it
            ? { opacity: 0, transition: { duration: 0 } }
            : {
                opacity: 0,
                y: "-0.35em",
                filter: "blur(2px)",
                transition: { duration: 0.16 },
              }
        }
        transition={it ? { duration: 0 } : { duration: 0.24, ease: VAO }}
      >
        {chu}
      </motion.span>
    </AnimatePresence>
  );
}

/**
 * Dãy hai nấc chọn nền sáng/tối, nằm gọn trong một dòng của menu.
 *
 * Là MỘT điểm dừng trong menu chứ không phải hai: mũi tên lên xuống đi
 * qua nó, mũi tên trái phải mới chọn bên trong. Nếu để hai nút thành hai
 * điểm dừng thì người đi bằng bàn phím phải bấm thêm mấy nhịp vô nghĩa
 * mới qua được một dòng.
 */
function ChonNen({ theme, dat }: { theme: Theme; dat: (t: Theme) => void }) {
  const nac: { gt: Theme; nhan: string; icon: React.ReactNode }[] = [
    {
      gt: "light",
      nhan: "Sáng",
      icon: <Sun className="size-4" strokeWidth={2} />,
    },
    {
      gt: "dark",
      nhan: "Tối",
      icon: <Moon className="size-4" strokeWidth={2} />,
    },
  ];
  const i = Math.max(
    0,
    nac.findIndex((n) => n.gt === theme),
  );

  return (
    <motion.div
      variants={DONG}
      data-diem-dung="nhom"
      data-nhan="Giao diện"
      className="relative z-10 flex items-center gap-3 px-3 py-2"
    >
      <SunMoon className="size-4 shrink-0 text-ink-500" aria-hidden />
      <span className="flex-1 text-sm font-medium text-ink-300">Giao diện</span>

      <div
        role="group"
        aria-label="Giao diện"
        className="relative grid grid-cols-2 gap-0.5 rounded-lg border border-ink-800 bg-ink-850 p-0.5"
      >
        {/* Con trượt chạy sau lưng hai nút */}
        <motion.span
          aria-hidden
          className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-[7px] bg-gold-400"
          animate={{ x: i === 0 ? 0 : "100%" }}
          transition={{ type: "spring", visualDuration: 0.26, bounce: 0.12 }}
        />
        {nac.map((n) => (
          <button
            key={n.gt}
            type="button"
            role="menuitemradio"
            tabIndex={-1}
            aria-checked={n.gt === theme}
            aria-label={n.gt === "light" ? "Nền sáng" : "Nền tối"}
            title={n.nhan}
            onClick={() => dat(n.gt)}
            className={cn(
              "relative grid size-7 place-items-center rounded-[7px] outline-none transition-colors",
              n.gt === theme
                ? "text-navy-900"
                : "text-ink-500 hover:text-ink-200",
            )}
          >
            {n.icon}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/** Nút đăng xuất: tự biết lúc nào đang chạy nhờ nằm trong thẻ form. */
function NutDangXuat({ it }: { it: boolean }) {
  const { pending } = useFormStatus();

  return (
    <motion.button
      type="submit"
      role="menuitem"
      tabIndex={-1}
      variants={DONG}
      data-diem-dung="muc"
      data-nhan="Đăng xuất"
      data-sac="nguy"
      aria-busy={pending || undefined}
      className={cn(
        MUC,
        "text-rose-600 focus-visible:text-rose-700 dark:text-rose-400 dark:focus-visible:text-rose-300",
      )}
    >
      <span className="grid size-4 shrink-0 place-items-center" aria-hidden>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
      </span>
      <ChuTroi chu={pending ? "Đang đăng xuất…" : "Đăng xuất"} it={it} />
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */

type ViTri = { top: number; height: number; nguy?: boolean; truot: boolean };
type LyDoMo = "dau" | "cuoi" | "chuot" | null;

const diemDung = (goc: HTMLElement | null) =>
  Array.from(goc?.querySelectorAll<HTMLElement>("[data-diem-dung]") ?? []);

function veDiemDung(d: HTMLElement | undefined) {
  if (!d) return;
  const dich =
    d.dataset.diemDung === "nhom"
      ? (d.querySelector<HTMLElement>('[aria-checked="true"]') ??
        d.querySelector<HTMLElement>("button"))
      : d;
  dich?.focus({ preventScroll: true });
}

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
  const [mo, setMo] = React.useState(false);
  const [vet, setVet] = React.useState<ViTri | null>(null);
  const [daGan, setDaGan] = React.useState(false);
  const [hep, setHep] = React.useState(false);

  const it = !!useReducedMotion();
  const { theme, dat } = useTheme();

  const nutRef = React.useRef<HTMLButtonElement>(null);
  const bangRef = React.useRef<HTMLDivElement>(null);
  const dsRef = React.useRef<HTMLDivElement>(null);
  const lyDo = React.useRef<LyDoMo>(null);
  const goPhim = React.useRef({ chu: "", hen: 0 });

  const canSeeAdmin = role === "admin" || role === "moderator";

  /*
   * ĐỢI GẮN XONG MỚI ĐỌC BỀ NGANG MÀN HÌNH.
   *
   * Máy chủ không biết màn hình rộng bao nhiêu. Đọc `matchMedia` ngay
   * trong lúc dựng sẽ cho kết quả khác giữa hai phía và làm hỏng hydrate
   * — đúng cái lỗi đã gặp ở thẻ kính trang đăng nhập. Nên lần dựng đầu
   * luôn coi là màn rộng, rồi chỉnh lại sau.
   */
  React.useEffect(() => {
    setDaGan(true);
    const mq = window.matchMedia("(max-width: 639px)");
    const xet = () => setHep(mq.matches);
    xet();
    mq.addEventListener("change", xet);
    return () => {
      mq.removeEventListener("change", xet);
      window.clearTimeout(goPhim.current.hen);
    };
  }, []);

  const tamTruot = daGan && hep;

  function doiMo(moi: boolean, vi: LyDoMo = null) {
    lyDo.current = moi ? vi : null;
    setVet(null);
    setMo(moi);
  }
  function dong(traTieuDiem: boolean) {
    doiMo(false);
    if (traTieuDiem) nutRef.current?.focus({ preventScroll: true });
  }

  // Chỉ đưa tiêu điểm vào khi CHÍNH NGƯỜI DÙNG mở menu, để menu mở sẵn
  // không cướp tiêu điểm và không kéo trang nhảy.
  React.useEffect(() => {
    if (!mo) return;
    const vi = lyDo.current;
    lyDo.current = null;
    if (!vi) return;
    const khung = requestAnimationFrame(() => {
      const ds = diemDung(dsRef.current);
      if (vi === "dau") veDiemDung(ds[0]);
      else if (vi === "cuoi") veDiemDung(ds.at(-1));
      else bangRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(khung);
  }, [mo, tamTruot]);

  /*
   * Đặt bảng menu sát cái nút, và cho nó nở ra từ tâm avatar.
   *
   * Dựng trong một portal ở thẻ body chứ không nằm trong header. Header
   * có `backdrop-blur`, mà `backdrop-filter` tạo ra một khối chứa mới —
   * phần tử `fixed` bên trong sẽ bị khối đó giữ lại và cắt mất, chứ
   * không bám theo khung nhìn như mong đợi.
   */
  React.useLayoutEffect(() => {
    if (!mo || tamTruot) return;
    const dat = () => {
      const bang = bangRef.current;
      const nut = nutRef.current;
      if (!bang || !nut) return;
      const o = nut.getBoundingClientRect();
      const rong = bang.offsetWidth;
      const cao = bang.offsetHeight;

      const muon = o.right - rong;
      const trai = Math.min(Math.max(12, muon), window.innerWidth - rong - 12);
      const duoi = o.bottom + 8;
      const tren =
        duoi + cao > window.innerHeight - 12 && o.top - 8 - cao > 12
          ? o.top - 8 - cao
          : duoi;

      bang.style.left = `${trai}px`;
      bang.style.top = `${tren}px`;
      bang.style.setProperty(
        "--goc-x",
        `${Math.min(Math.max(0, o.left + Math.min(o.width, 40) / 2 - trai), rong)}px`,
      );
      bang.style.setProperty("--goc-y", tren < o.top ? `${cao}px` : "0px");
    };
    dat();
    window.addEventListener("resize", dat);
    window.addEventListener("scroll", dat, true);
    return () => {
      window.removeEventListener("resize", dat);
      window.removeEventListener("scroll", dat, true);
    };
  }, [mo, tamTruot]);

  // Bấm ra ngoài thì đóng. Tấm trượt có lớp phủ riêng lo việc này.
  React.useEffect(() => {
    if (!mo || tamTruot) return;
    const xuong = (e: globalThis.PointerEvent) => {
      const dich = e.target as Node;
      if (bangRef.current?.contains(dich) || nutRef.current?.contains(dich))
        return;
      lyDo.current = null;
      setVet(null);
      setMo(false);
    };
    document.addEventListener("pointerdown", xuong, true);
    return () => document.removeEventListener("pointerdown", xuong, true);
  }, [mo, tamTruot]);

  // Trang phía sau tấm trượt đứng yên.
  React.useEffect(() => {
    if (!mo || !tamTruot) return;
    const goc = document.documentElement;
    const truoc = goc.style.overflow;
    goc.style.overflow = "hidden";
    return () => {
      goc.style.overflow = truoc;
    };
  }, [mo, tamTruot]);

  function khiNhanTieuDiem(e: React.FocusEvent<HTMLDivElement>) {
    const d =
      e.target instanceof HTMLElement
        ? e.target.closest<HTMLElement>("[data-diem-dung]")
        : null;
    if (!d) {
      setVet(null);
      return;
    }
    setVet((cu) => ({
      top: d.offsetTop,
      height: d.offsetHeight,
      nguy: d.dataset.sac === "nguy",
      truot: cu !== null,
    }));
  }

  // Tiêu điểm đi theo chuột, để bàn phím tiếp tục từ đúng chỗ con trỏ vừa
  // bỏ lại chứ không nhảy về đầu danh sách.
  function khiReChuot(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType === "touch") return;
    if (document.activeElement !== e.currentTarget) {
      e.currentTarget.focus({ preventScroll: true });
    }
  }
  function khiRoiDanhSach(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType === "touch") return;
    setVet(null);
    bangRef.current?.focus({ preventScroll: true });
  }

  function khiGoPhim(e: React.KeyboardEvent<HTMLDivElement>) {
    const ds = diemDung(dsRef.current);
    const dangO =
      document.activeElement instanceof HTMLElement
        ? document.activeElement.closest<HTMLElement>("[data-diem-dung]")
        : null;
    const i = dangO ? ds.indexOf(dangO) : -1;
    const buoc = (toi: HTMLElement | undefined) => {
      e.preventDefault();
      veDiemDung(toi);
    };

    switch (e.key) {
      case "ArrowDown":
        return buoc(ds[(i + 1) % ds.length]);
      case "ArrowUp":
        return buoc(ds[i <= 0 ? ds.length - 1 : i - 1]);
      case "Home":
        return buoc(ds[0]);
      case "End":
        return buoc(ds.at(-1));
      case "Escape":
      case "Tab":
        e.preventDefault();
        return dong(true);
      case "ArrowLeft":
      case "ArrowRight": {
        if (dangO?.dataset.diemDung !== "nhom") return;
        e.preventDefault();
        const nut = Array.from(
          dangO.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'),
        );
        const at = Math.max(
          0,
          nut.findIndex((n) => n.getAttribute("aria-checked") === "true"),
        );
        const tiep =
          nut[
            (at + (e.key === "ArrowRight" ? 1 : -1) + nut.length) % nut.length
          ];
        tiep?.focus({ preventScroll: true });
        tiep?.click();
        return;
      }
    }

    if (
      e.key.length !== 1 ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.key === " "
    )
      return;

    // Gõ chữ để nhảy tới dòng bắt đầu bằng chữ đó.
    const nho = goPhim.current;
    window.clearTimeout(nho.hen);
    nho.chu += e.key.toLowerCase();
    nho.hen = window.setTimeout(() => {
      nho.chu = "";
    }, 500);
    const xep = [...ds.slice(i + 1), ...ds.slice(0, i + 1)];
    const thay = xep.find((d) =>
      d.dataset.nhan?.toLowerCase().startsWith(nho.chu),
    );
    if (thay) buoc(thay);
  }

  /* --------------------------------------------------------------- */

  const dongVar = it ? undefined : DONG;

  const noiDung = (
    <>
      {/* Danh tính */}
      <motion.div
        variants={dongVar}
        className="flex items-center gap-3 border-b border-ink-800 px-3 pt-1 pb-3"
      >
        <Avatar name={fullName} src={avatarUrl} seed={id} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink-100">{fullName}</p>
          <p className="mt-0.5 text-[11.5px] font-semibold text-gold-600 dark:text-gold-300">
            {ROLES[role].label}
          </p>
        </div>
      </motion.div>

      <div
        ref={dsRef}
        className="relative pt-1.5"
        onFocus={khiNhanTieuDiem}
        onPointerLeave={khiRoiDanhSach}
      >
        {/* Vệt sáng trượt theo dòng đang chọn */}
        <motion.span
          aria-hidden
          className={cn(
            "absolute inset-x-1 top-0 z-0 rounded-xl",
            vet?.nguy ? "bg-rose-50 dark:bg-rose-500/10" : "bg-ink-850",
          )}
          initial={false}
          animate={
            vet
              ? { y: vet.top, height: vet.height, opacity: 1 }
              : { opacity: 0 }
          }
          transition={{
            default:
              vet?.truot && !it
                ? { type: "spring", visualDuration: 0.26, bounce: 0.12 }
                : { duration: 0 },
            opacity: { duration: it ? 0 : 0.1 },
          }}
        />

        {[
          {
            href: "/ho-so",
            nhan: "Hồ sơ của tôi",
            icon: User,
            chiDienThoai: false,
          },
          {
            href: "/thanh-vien",
            nhan: "Thành viên",
            icon: Users,
            chiDienThoai: false,
          },
          {
            href: "/bang-phong-than",
            nhan: "Bảng phong thần",
            icon: Trophy,
            chiDienThoai: true,
          },
          ...(canSeeAdmin
            ? [
                {
                  href: "/quan-tri",
                  nhan: "Quản trị",
                  icon: Shield,
                  chiDienThoai: false,
                },
              ]
            : []),
        ].map((m) => (
          <motion.div key={m.href} variants={dongVar}>
            <Link
              href={m.href}
              role="menuitem"
              tabIndex={-1}
              data-diem-dung="muc"
              data-nhan={m.nhan}
              onPointerMove={khiReChuot}
              onClick={() => dong(false)}
              className={cn(MUC, m.chiDienThoai && "md:hidden")}
            >
              <m.icon className="size-4 shrink-0 text-ink-500" aria-hidden />
              {m.nhan}
            </Link>
          </motion.div>
        ))}

        <div className="my-1.5 h-px bg-ink-800" role="separator" />

        <ChonNen theme={theme} dat={dat} />

        <div className="my-1.5 h-px bg-ink-800" role="separator" />

        <form action={signOutAction}>
          <NutDangXuat it={it} />
        </form>
      </div>
    </>
  );

  const thuocTinhMenu = {
    role: "menu" as const,
    "aria-label": "Menu tài khoản",
    tabIndex: -1,
    onKeyDown: khiGoPhim,
  };

  const bang = (
    <AnimatePresence>
      {mo && !tamTruot && (
        <motion.div
          key="bang"
          ref={bangRef}
          {...thuocTinhMenu}
          variants={it ? DUNG_YEN : BANG}
          initial="dong"
          animate="mo"
          exit="thoat"
          style={{ transformOrigin: "var(--goc-x, 100%) var(--goc-y, 0px)" }}
          className="fixed z-[70] w-64 rounded-2xl border border-ink-800 bg-ink-900 p-1.5 shadow-[var(--shadow-pop)] outline-none"
        >
          {noiDung}
        </motion.div>
      )}
    </AnimatePresence>
  );

  function khiThaKeo(_: unknown, tin: PanInfo) {
    if (tin.offset.y > 80 || tin.velocity.y > 500) dong(true);
  }

  const truot = (
    <AnimatePresence>
      {mo && tamTruot && (
        <>
          <motion.div
            key="phu"
            aria-hidden
            className="fixed inset-0 z-[69] bg-navy-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: it ? 0.1 : 0.2 }}
            onClick={() => dong(true)}
          />
          <motion.div
            key="truot"
            ref={bangRef}
            {...thuocTinhMenu}
            aria-modal="true"
            variants={it ? DUNG_YEN : TAM_TRUOT}
            initial="dong"
            animate="mo"
            exit="thoat"
            drag={it ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.9 }}
            dragMomentum={false}
            onDragEnd={khiThaKeo}
            className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl border-t border-ink-800 bg-ink-900 px-2 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-pop)] outline-none"
          >
            <span
              aria-hidden
              className="mx-auto mb-2 block h-1 w-9 rounded-full bg-ink-700"
            />
            {noiDung}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative shrink-0">
      <button
        ref={nutRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={mo}
        aria-label={`Menu tài khoản, ${fullName}`}
        onClick={(e) => {
          if (mo) return dong(false);
          // `detail === 0` nghĩa là bấm bằng bàn phím, không phải chuột.
          doiMo(true, e.detail === 0 ? "dau" : "chuot");
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          doiMo(true, e.key === "ArrowDown" ? "dau" : "cuoi");
        }}
        className={cn(
          "flex items-center gap-1.5 rounded-xl p-1 pr-1.5 transition-colors",
          mo ? "bg-ink-850" : "hover:bg-ink-850",
        )}
      >
        <Avatar name={fullName} src={avatarUrl} seed={id} size="sm" />
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 text-ink-500 transition-transform duration-200",
            mo && "rotate-180",
          )}
        />
      </button>

      {daGan && createPortal(tamTruot ? truot : bang, document.body)}
    </div>
  );
}
