"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import * as React from "react";
import * as THREE from "three";

import { ShuttleCrystal } from "./shuttle-crystal";

/* ------------------------------------------------------------------ */
/* Dòng tiêu đề nằm TRONG cảnh 3D                                      */
/* ------------------------------------------------------------------ */

/**
 * Tiêu đề được vẽ ra canvas rồi dán thành một tấm phẳng phía sau quả cầu,
 * chứ không phải chữ HTML đè lên. Đó là toàn bộ mấu chốt: chỉ khi chữ nằm
 * trong cảnh thì thuỷ tinh mới bẻ cong được nó. Chữ HTML đặt chồng lên chỉ
 * là ảnh dán, quả cầu lướt qua mà không ảnh hưởng gì.
 */

/** `ctx.font` không hiểu biến CSS, phải quy đổi `var(--x)` ra tên phông thật
 *  trước, nếu không phép gán bị từ chối và chữ tụt về 10px mà không báo gì. */
function resolveFontStack(stack: string): string {
  if (typeof window === "undefined") return stack;
  const root = getComputedStyle(document.documentElement);
  return stack.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_m, name: string) => {
    return root.getPropertyValue(name).trim() || "serif";
  });
}

function drawHeadline(
  text: string,
  color: string,
  fontFamily: string,
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const W = 2048;
  const H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const stack = resolveFontStack(fontFamily);
  // Dò cỡ chữ cho vừa bề ngang thay vì đoán một con số cố định.
  let size = 460;
  do {
    ctx.font = `700 ${size}px ${stack}`;
    size -= 8;
  } while (ctx.measureText(text).width > W * 0.92 && size > 40);

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2);

  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function useHeadlineTexture(text: string, color: string, fontFamily: string) {
  // Dựng ngay trong lần render đầu để mesh gắn sẵn ảnh — gắn ảnh vào vật
  // liệu đã mount là một cái bẫy quen thuộc của three.js.
  const [texture, setTexture] = React.useState(() =>
    drawHeadline(text, color, fontFamily),
  );

  React.useEffect(() => {
    let cancelled = false;
    const rebake = () => {
      if (!cancelled) setTexture(drawHeadline(text, color, fontFamily));
    };
    // Vẽ lại khi webfont tải xong, nếu không phông dự phòng bị nướng vào ảnh.
    if (document.fonts?.ready) {
      document.fonts.ready.then(rebake).catch(rebake);
    } else {
      rebake();
    }
    return () => {
      cancelled = true;
    };
  }, [text, color, fontFamily]);

  React.useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

function Headline({
  texture,
  z = -2.2,
}: {
  texture: THREE.CanvasTexture | null;
  z?: number;
}) {
  const { viewport } = useThree();
  const width = Math.min(viewport.width * 0.8, 14);
  const height = width * (640 / 2048);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, z]} renderOrder={-1}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

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
  headline = "Sport Hub",
  description,
  action,
  secondaryAction,
  meta = [],
}: {
  eyebrow?: string;
  /** Vẽ vào trong cảnh để quả cầu khúc xạ được. */
  headline?: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  meta?: string[];
}) {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
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
      const stage = stageRef.current;
      if (stage) {
        const t = Math.min(1, Math.max(0, (p - FADE_FROM) / (1 - FADE_FROM)));
        // Làm mềm hai đầu để không thấy điểm bắt đầu và kết thúc của phép mờ.
        const eased = t * t * (3 - 2 * t);
        stage.style.opacity = `${1 - eased}`;
        stage.style.transform = `scale(${1 - eased * 0.04})`;
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

  const texture = useHeadlineTexture(
    headline,
    CREAM,
    "var(--font-display), 'Playfair Display', Georgia, serif",
  );

  return (
    <div
      ref={sectionRef}
      className="relative h-[200vh] w-full"
      style={{ background: PAPER }}
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full origin-bottom overflow-hidden will-change-[opacity,transform]"
        style={{ background: NAVY }}
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
              <Headline texture={texture} />
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
            <span
              aria-hidden
              className="h-px w-8"
              style={{ background: GOLD, opacity: 0.7 }}
            />
            <span
              className="text-[10px] font-semibold tracking-[0.32em] uppercase"
              style={{ color: GOLD }}
            >
              {eyebrow}
            </span>
          </motion.div>

          {/* Chừa đúng chỗ cho dòng tiêu đề nằm trong cảnh 3D, thay vì
              đẩy chữ xuống tận đáy. */}
          <div aria-hidden className="h-[56vh] shrink-0 sm:h-[60vh]" />

          <div className="mx-auto w-full max-w-2xl text-center">
            <motion.p
              variants={ENTER}
              className="mx-auto max-w-md text-[13.5px] leading-relaxed sm:text-[15px]"
              style={{ color: CREAM, opacity: 0.7 }}
            >
              {description}
            </motion.p>

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
    </div>
  );
}
