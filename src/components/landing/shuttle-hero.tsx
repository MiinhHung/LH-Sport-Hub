"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import Image from "next/image";
import * as React from "react";
import * as THREE from "three";

import { ShuttleCrystal } from "./shuttle-crystal";

/* ------------------------------------------------------------------ */
/* Bụi sáng lơ lửng                                                    */
/* ------------------------------------------------------------------ */

/** Bộ sinh số giả ngẫu nhiên cố định — để đám bụi giống hệt nhau mọi lần
 *  dựng, tránh lệch giữa máy chủ và trình duyệt. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Motes({ count, color }: { count: number; color: string }) {
  const ref = React.useRef<THREE.Points>(null);

  const { positions, speeds } = React.useMemo(() => {
    const rand = mulberry32(1337);
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 18;
      pos[i * 3 + 1] = (rand() - 0.5) * 11;
      pos[i * 3 + 2] = (rand() - 0.5) * 6 - 1;
      spd[i] = 0.02 + rand() * 0.05;
    }
    return { positions: pos, speeds: spd };
  }, [count]);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta;
      if (arr[i * 3 + 1] > 5.5) arr[i * 3 + 1] = -5.5;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={color}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Cảnh                                                                */
/* ------------------------------------------------------------------ */

/** Đẩy quả cầu lên cao để chừa một phần ba dưới cho chữ. Màn hình dựng
 *  đứng thì đẩy ít hơn và lùi cả nhóm ra sau, nếu không quả cầu phóng to
 *  dòng tiêu đề thành một vệt nhoè không đọc được trên điện thoại. */
/**
 * Đặt quả cầu PHÍA TRÊN dòng chữ, chỉ để đế chạm vào đỉnh các con chữ.
 *
 * Hai bản trước cho nó nằm đè giữa dòng chữ, vì hồi đó lông còn là thuỷ
 * tinh và chỗ chồng nhau chính là chỗ khúc xạ. Từ khi lông chuyển sang
 * trắng đục thì chồng lên chỉ còn tác hại: nó ăn mất một con chữ, đọc
 * thành "Sport Iub".
 */
function ShuttleOffset({ children }: { children: React.ReactNode }) {
  const { viewport } = useThree();
  const portrait = viewport.width < viewport.height;
  return (
    <group position={[portrait ? 0.1 : 0.3, portrait ? 0.95 : 1.12, 0]}>
      {children}
    </group>
  );
}

function FocalGroup({ children }: { children: React.ReactNode }) {
  const { viewport } = useThree();
  const portrait = viewport.width < viewport.height;
  return (
    <group position={[0, portrait ? 0.2 : 0.15, portrait ? -0.7 : 0]}>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Bậc chất lượng                                                      */
/* ------------------------------------------------------------------ */

type Quality = "low" | "medium" | "high";

type Spec = { motes: number; maxDpr: number };

/**
 * Từ khi lông cầu chuyển sang vật liệu thường (không còn khúc xạ), cảnh
 * chỉ còn vài trăm tam giác. Hai thứ còn đáng chỉnh là mật độ điểm ảnh và
 * số hạt bụi — chứ không phải chất lượng vật liệu như trước.
 */
const QUALITY: Record<Quality, Spec> = {
  low: { motes: 30, maxDpr: 1.5 },
  medium: { motes: 55, maxDpr: 1.75 },
  high: { motes: 90, maxDpr: 2 },
};

function subscribeToViewport(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const w = window.innerWidth;
  if (w < 768 || cores <= 4) return "low";
  if (w < 1440 || cores <= 8) return "medium";
  return "high";
}

/* ------------------------------------------------------------------ */
/* Chuyển động vào                                                     */
/* ------------------------------------------------------------------ */

const ENTER = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 96,
      damping: 17,
      mass: 0.9,
    },
  },
};

const GROUP = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
};

/* ------------------------------------------------------------------ */
/* Dòng tiêu đề                                                        */
/* ------------------------------------------------------------------ */

/**
 * Tiêu đề là CHỮ HTML THẬT, từng ký tự trồi lên lệch nhau một nhịp.
 *
 * Bản trước vẽ dòng này lên một tấm canvas rồi dán vào cảnh 3D, vì hồi đó
 * quả cầu bằng thuỷ tinh nằm đè lên và cần khúc xạ chính dòng chữ. Cái giá
 * phải trả là chữ bị rasterise ở một cỡ cố định rồi phóng to — nét mềm oặt,
 * không bôi chọn được, máy đọc màn hình không thấy, và không thể làm hiệu
 * ứng trên từng ký tự. Đó chính là lý do nhìn chữ thấy xấu.
 *
 * Từ khi quả cầu dời lên phía trên và lông không còn trong suốt, chỗ chồng
 * nhau chẳng còn tác dụng gì. Trả chữ về DOM thì được cả nét sắc lẫn hiệu
 * ứng, mà không mất thứ gì.
 */
function Headline({ text }: { text: string }) {
  const chars = React.useMemo(() => Array.from(text), [text]);
  const wrapRef = React.useRef<HTMLSpanElement>(null);

  /*
   * Chữ nào gần con trỏ thì nhấc lên và sáng hơn.
   *
   * Cả vòng lặp ghi thẳng vào style qua DOM, không đụng state: mười một ký
   * tự nhân với mỗi lần chuột nhúc nhích mà đi qua React thì render liên
   * miên. Cũng không dùng transition — vị trí được cập nhật mỗi khung hình
   * nên transition chỉ làm nó lết theo sau con trỏ.
   *
   * Chỉ chạy khi có chuột thật và người dùng không bật "giảm chuyển động".
   */
  React.useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const letters = Array.from(
      wrap.querySelectorAll<HTMLElement>("[data-char]"),
    );
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    /** Bán kính ảnh hưởng quanh con trỏ, pixel. */
    const REACH = 190;

    const frame = () => {
      raf = 0;
      for (const el of letters) {
        const r = el.getBoundingClientRect();
        const dx = mouse.x - (r.left + r.width / 2);
        const dy = mouse.y - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        const k = Math.max(0, 1 - d / REACH);
        // Bình phương cho đường cong dốc hơn ở gần, thoải ở xa.
        const e = k * k;
        el.style.transform = `translateY(${(-14 * e).toFixed(2)}px) scale(${(1 + 0.08 * e).toFixed(4)})`;
        el.style.color = e > 0.02 ? GOLD : "";
        el.style.opacity = `${1 - 0.0 * e}`;
      }
    };

    const onMove = (ev: PointerEvent) => {
      mouse.x = ev.clientX;
      mouse.y = ev.clientY;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <h1
      className="font-display text-center text-[13vw] leading-[0.95] font-bold sm:text-[clamp(54px,8.5vw,128px)]"
      style={{ color: CREAM }}
    >
      {/* Máy đọc màn hình đọc nguyên câu, không đọc rời từng chữ cái. */}
      <span className="sr-only select-none">{text}</span>

      {/*
        Hai lớp lồng nhau, và đây là chỗ bắt buộc:

        Lớp ngoài chạy hiệu ứng trồi lên lúc vào trang, lớp trong nhận phép
        biến đổi theo con trỏ. Nếu gộp làm một thì chúng giành nhau cùng
        thuộc tính `transform` — animation của CSS đè lên inline style kể cả
        sau khi chạy xong (vì `both` giữ lại khung cuối), nên hiệu ứng con
        trỏ sẽ không bao giờ ăn.
      */}
      <span aria-hidden ref={wrapRef}>
        {chars.map((c, i) =>
          c === " " ? (
            // Khoảng trắng phải là một ký tự riêng có bề rộng cố định:
            // bọc từng chữ trong inline-block sẽ làm sập khoảng trắng thường.
            <span key={i} className="inline-block w-[0.26em]" />
          ) : (
            <span
              key={i}
              className="inline-block"
              style={{
                animation: `headline-char 820ms ${300 + i * 55}ms both cubic-bezier(0.16,1,0.3,1)`,
              }}
            >
              <span
                data-char
                className="inline-block will-change-transform"
                style={{ transition: "color 260ms ease-out" }}
              >
                {c}
              </span>
            </span>
          ),
        )}
      </span>
    </h1>
  );
}

/* ------------------------------------------------------------------ */
/* Thành phần công khai                                                */
/* ------------------------------------------------------------------ */

/*
 * Riêng hero dùng nền TỐI, trong khi phần còn lại của trang là nền trắng.
 *
 * Không phải để cho khác lạ: thuỷ tinh trong suốt truyền qua đúng màu nền,
 * nên đặt trên trắng thì quả cầu nhợt hẳn và mất chiều sâu. Trên navy thì
 * từng chiếc lông có mép, có bóng, có tán sắc.
 *
 * Chỗ nối hai nền được xử lý bằng một phép hoà tan theo tiến độ cuộn —
 * xem hàm paint bên dưới.
 */
const NAVY = "#00112e";
const PAPER = "#ffffff"; // nền của phần trang phía dưới, dùng khi hoà tan
const CREAM = "#f2ede3";
const GOLD = "#dcae42"; // gold-400 — trên nền tối thì đây mới là sắc vàng đúng
const GOLD_SOLID = "#dcae42";

/**
 * Tiến độ cuộn bắt đầu hoà tan hero sang nền trắng phía dưới.
 *
 * Nhớ rằng quãng cuộn thật chỉ bằng chiều cao khối TRỪ ĐI một màn hình,
 * vì tấm hero dính cứng ở đỉnh. Khối 200vh thì chỉ có 100vh để cuộn, và
 * phép hoà tan ăn 45% cuối của quãng đó.
 */
const FADE_FROM = 0.55;

export function ShuttleHero({
  eyebrow = "Light Human",
  headline = "LH Sport Hub",
  description,
  action,
  secondaryAction,
  meta = [],
}: {
  eyebrow?: string;
  headline?: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  meta?: string[];
}) {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const edgeRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);
  const progress = React.useRef(0);

  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [onScreen, setOnScreen] = React.useState(true);
  const prefersReduced = useReducedMotion();
  const controls = useAnimationControls();

  // useSyncExternalStore chứ không phải effect: ảnh chụp phía máy chủ giữ
  // cho quá trình hydrate nhất quán, không có vòng render thừa lúc mount,
  // và bậc chất lượng tự tính lại khi cửa sổ vượt qua một mốc kích thước.
  const quality = React.useSyncExternalStore(
    subscribeToViewport,
    detectQuality,
    () => "medium" as Quality,
  );
  const spec = QUALITY[quality];

  // Khúc xạ là thứ đắt nhất trên trang; không có lý do gì trả tiền cho nó
  // sau khi hero đã cuộn khuất.
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Quyết định hiệu ứng vào SAU khi hydrate, không phải trong lúc render:
  // đọc `document.hidden` khi đang render sẽ lệch với kết quả máy chủ và
  // gây lỗi hydrate. rAF cũng bị bóp lại ở tab ẩn, nếu không xử lý thì khi
  // quay lại tab sẽ thấy một cái hero mờ dở dang.
  React.useEffect(() => {
    if (prefersReduced || document.hidden) {
      controls.set("show");
      return;
    }
    controls.start("show");
  }, [controls, prefersReduced]);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    const paint = (p: number) => {
      progress.current = p;
      if (railRef.current) railRef.current.style.transform = `scaleX(${p})`;

      /*
       * Hoà tan sang phần trang phía dưới.
       *
       * Hero nền tối còn phần dưới nền trắng, nên nếu để tấm hero trượt đi
       * như bình thường thì mắt hứng nguyên một nhát cắt đen–trắng. Thay vì
       * vậy, ở một phần ba cuối quãng cuộn tấm hero mờ dần đi để lộ nền
       * trắng của khối bao ngoài, và lùi lại một chút cho có chiều sâu.
       *
       * Ghi thẳng vào style qua ref chứ không qua state: đây là mỗi khung
       * hình cuộn, đặt vào state là render lại cả cây component.
       */
      /*
       * Chuyển cảnh: NÉT QUÉT CHẠY LÊN, không phải mờ dần.
       *
       * Bản trước hạ opacity cả tấm hero. Vấn đề của cách đó là suốt quãng
       * chuyển, hai cảnh chồng lên nhau ở trạng thái nửa vời — cảnh tối
       * ngả xám, chữ trắng ngả xám, nhìn như trang bị lỗi tải chứ không
       * phải một ý đồ.
       *
       * Ở đây cảnh tối bị CẮT dần từ dưới lên bằng clip-path, để lộ nền
       * trắng của khối bao ngoài. Mọi điểm ảnh còn lại vẫn đậm đủ màu, chỉ
       * là vùng hiển thị thu lại. Một nét vàng mảnh chạy đúng ở mép cắt
       * biến nó thành một động tác có chủ ý — như gạt một tấm màn lên.
       *
       * Phần bên trong trôi lên chậm hơn mép cắt, tạo lớp sâu.
       */
      const stage = stageRef.current;
      if (stage) {
        const t = Math.min(1, Math.max(0, (p - FADE_FROM) / (1 - FADE_FROM)));
        // Làm mềm hai đầu để không thấy điểm bắt đầu và kết thúc.
        const eased = t * t * (3 - 2 * t);
        const cut = eased * 100;

        stage.style.clipPath = `inset(0 0 ${cut.toFixed(2)}% 0)`;

        const inner = innerRef.current;
        if (inner) inner.style.transform = `translateY(${-eased * 9}%)`;

        const edge = edgeRef.current;
        if (edge) {
          edge.style.bottom = `${cut.toFixed(2)}%`;
          // Nét chỉ hiện trong lúc đang quét, không thò ra ở hai đầu.
          edge.style.opacity = `${Math.min(1, Math.sin(Math.PI * eased) * 1.6)}`;
        }
      }
    };

    if (reducedMotion) {
      paint(0);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      paint(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={sectionRef}
      className="relative z-10 h-[200vh] w-full"
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden will-change-[clip-path]"
        style={{ background: NAVY }}
      >
        {/* Lớp trong — trôi lên chậm hơn mép cắt để tạo chiều sâu */}
        <div
          ref={innerRef}
          className="absolute inset-0 will-change-transform"
        >
        {/* Cảnh 3D */}
        <div
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <Canvas
            frameloop={onScreen ? "always" : "never"}
            dpr={[1, spec.maxDpr]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
            }}
            camera={{ fov: 40, near: 0.1, far: 60, position: [0, 0, 7] }}
            onCreated={({ gl }) => gl.setClearColor(new THREE.Color(NAVY), 1)}
          >
            {/* Dàn đèn dựng bằng lightformer nên không phải tải file HDRI. */}
            <Environment resolution={256}>
              <Lightformer
                intensity={6}
                position={[0, 5, 4]}
                scale={[12, 4, 1]}
                color="#fff6e2"
              />
              <Lightformer
                intensity={3.6}
                position={[-6, 1, 3]}
                scale={[4, 9, 1]}
                color="#bcd6ff"
              />
              <Lightformer
                intensity={3.4}
                position={[6, -2, 2]}
                scale={[5, 6, 1]}
                color={GOLD}
              />
              <Lightformer
                intensity={2.2}
                position={[0, -4, -3]}
                scale={[9, 3, 1]}
                color="#ffffff"
              />
            </Environment>

            <FocalGroup>
              <ShuttleOffset>
                <ShuttleCrystal
                  progress={progress}
                  reducedMotion={reducedMotion}
                  gold={GOLD_SOLID}
                />
              </ShuttleOffset>
            </FocalGroup>
            <Motes color={GOLD_SOLID} count={spec.motes} />
          </Canvas>
        </div>

        {/* Tối dần ra rìa */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 45%, transparent 45%, ${NAVY} 100%)`,
          }}
        />

        {/* Chữ */}
        <motion.div
          variants={GROUP}
          initial="hidden"
          animate={controls}
          className="pointer-events-none absolute inset-0 flex flex-col px-5 py-7 sm:px-10 sm:py-10"
        >
          <motion.div variants={ENTER} className="flex items-center gap-3">
            {/* Logo bản nét sáng, nền trong suốt. File logo.png gốc có nền
                TRẮNG ĐẶC (0% điểm trong suốt) nên đặt lên navy sẽ thành một
                ô trắng; bản này tách nền và tô lại một màu kem, vì phần
                navy trong logo gốc sẽ chìm nghỉm trên nền navy của hero. */}
            <Image
              src="/logo-light.png"
              alt={eyebrow}
              width={656}
              height={562}
              priority
              className="h-11 w-auto object-contain sm:h-12"
            />
          </motion.div>

          {/* Chỗ cho quả cầu 3D phía trên dòng tiêu đề. */}
          <div aria-hidden className="h-[26vh] shrink-0 sm:h-[30vh]" />

          <motion.div variants={ENTER}>
            <Headline text={headline} />
          </motion.div>

          <div aria-hidden className="h-[4vh] shrink-0" />

          <div className="mx-auto w-full max-w-2xl text-center">
            {description ? (
              <motion.p
                variants={ENTER}
                className="mx-auto max-w-md text-[13.5px] leading-relaxed sm:text-[15px]"
                style={{ color: CREAM, opacity: 0.7 }}
              >
                {description}
              </motion.p>
            ) : null}

            {(action || secondaryAction) && (
              <motion.div
                variants={ENTER}
                className="pointer-events-auto mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row"
              >
                {action}
                {secondaryAction}
              </motion.div>
            )}
          </div>

          <div aria-hidden className="flex-1" />

          <motion.div
            variants={ENTER}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div className="hidden flex-wrap items-center gap-x-5 gap-y-2 sm:flex">
              {meta.map((m) => (
                <span
                  key={m}
                  className="text-[10px] font-semibold tracking-[0.22em] uppercase"
                  style={{ color: CREAM, opacity: 0.55 }}
                >
                  {m}
                </span>
              ))}
            </div>

            <div
              className="h-px w-24 overflow-hidden"
              style={{ background: `${CREAM}26` }}
            >
              <div
                ref={railRef}
                className="h-full origin-left"
                style={{ background: GOLD, transform: "scaleX(0)" }}
              />
            </div>
          </motion.div>
        </motion.div>
        </div>

        {/* Nét vàng chạy ở mép cắt. Nằm NGOÀI lớp trôi thị sai để nó bám
            đúng mép, chứ không bị kéo lệch theo. */}
        <div
          ref={edgeRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-10 h-px opacity-0"
          style={{
            bottom: "100%",
            background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
            boxShadow: `0 0 18px 2px ${GOLD}55`,
          }}
        />
      </div>
    </div>
  );
}
