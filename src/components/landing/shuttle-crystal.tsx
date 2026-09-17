"use client";

import { MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Quả cầu lông bằng pha lê.
 *
 * BẢN TRƯỚC DÙNG MỘT CÁI VÁY LIỀN (LatheGeometry) VÀ NÓ TRÔNG NHƯ CHỤP ĐÈN.
 *
 * Quả cầu lông thật không phải khối tròn xoay liền mạch — nó là 16 CHIẾC
 * LÔNG RỜI cắm vòng quanh, có khe hở giữa các chiếc, và mỗi chiếc hơi xoay
 * nghiêng để quả cầu tự xoáy khi bay. Chính những khe hở đó mới là thứ làm
 * mắt nhận ra ngay. Một mặt nón liền thì dù có kẻ thêm nan vàng lên vẫn chỉ
 * là mặt nón.
 *
 * Nên ở đây mỗi chiếc lông là một phiến dẹt thuôn — hẹp ở cuống, xoè ở
 * ngọn — dựng bằng `Shape` rồi ép dày ra một chút cho có thân.
 *
 * MỘT VẬT LIỆU CHO CẢ 16 CHIẾC, và đây là chỗ bắt buộc phải cẩn thận.
 * `MeshTransmissionMaterial` cấp riêng một bộ đệm khung hình cho MỖI thực
 * thể vật liệu. Dựng 16 mesh với 16 vật liệu là 16 lần vẽ lại toàn cảnh
 * mỗi khung hình — đủ để treo máy. Vì vậy 16 hình học được biến đổi sẵn
 * rồi gộp thành MỘT, dùng chung đúng một vật liệu.
 */

const FEATHERS = 16;

/** Chỗ cuống lông cắm vào đế. */
const RIM_R = 0.4;
const RIM_Y = -0.52;

/** Độ ngả ra ngoài của lông, và độ xoay nghiêng tạo xoáy. */
const TILT = 0.27; // ~15,5° — cho tỉ lệ cao/rộng ≈ 1,3 như quả thật
const CANT = 0.2; // ~11,5°

/**
 * Mặt cắt đế bần: đáy tròn, hông thẳng, mặt trên phẳng.
 * Quay quanh trục đứng thành khối đặc.
 */
const CORK_PROFILE: [number, number][] = [
  [0, -1.08],
  [0.16, -1.06],
  [0.29, -0.99],
  [0.38, -0.87],
  [0.42, -0.72],
  [0.42, -0.55],
  [0.4, -0.49],
  [0, -0.49],
];

/** Một chiếc lông: hẹp ở cuống, xoè dần, đầu bo tròn. */
function featherShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.035, 0);
  s.lineTo(-0.075, 0.42);
  s.lineTo(-0.15, 1.05);
  s.lineTo(-0.175, 1.5);
  s.quadraticCurveTo(-0.17, 1.84, -0.055, 1.87);
  s.quadraticCurveTo(0.055, 1.89, 0.175, 1.5);
  s.lineTo(0.15, 1.05);
  s.lineTo(0.075, 0.42);
  s.lineTo(0.035, 0);
  s.closePath();
  return s;
}

export type ShuttleQuality = {
  samples: number;
  resolution: number;
  backside: boolean;
};

export function ShuttleCrystal({
  progress,
  reducedMotion,
  dispersion,
  tint,
  gold = "#c8951a",
  spec,
}: {
  /** 0→1 theo tiến độ cuộn trang. */
  progress: React.RefObject<number>;
  reducedMotion: boolean;
  dispersion: number;
  tint: string;
  gold?: string;
  spec: ShuttleQuality;
}) {
  const ref = React.useRef<THREE.Group>(null);
  const pointer = React.useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  /** Cả 16 chiếc lông gộp làm một hình học duy nhất. */
  const feathers = React.useMemo(() => {
    const base = new THREE.ExtrudeGeometry(featherShape(), {
      depth: 0.04,
      bevelEnabled: false,
      curveSegments: 8,
    });
    // Dời để bề dày nằm cân hai bên mặt phẳng của chiếc lông.
    base.translate(0, 0, -0.02);

    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < FEATHERS; i++) {
      const g = base.clone();

      // Ngả ra ngoài + xoay nghiêng, quanh chính cuống lông…
      const m = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(0, CANT, -TILT),
      );
      // …rồi mới đẩy ra vành đế.
      m.setPosition(RIM_R, RIM_Y, 0);
      g.applyMatrix4(m);

      // Cuối cùng xoay quanh trục đứng để rải đều vòng tròn.
      g.applyMatrix4(
        new THREE.Matrix4().makeRotationY((i / FEATHERS) * Math.PI * 2),
      );

      parts.push(g);
    }
    base.dispose();

    const merged = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    return merged;
  }, []);

  const cork = React.useMemo(
    () =>
      new THREE.LatheGeometry(
        CORK_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)),
        48,
      ),
    [],
  );

  React.useEffect(() => {
    return () => {
      feathers?.dispose();
      cork.dispose();
    };
  }, [feathers, cork]);

  // Đo theo cạnh NGẮN của khung nhìn, nếu không trên điện thoại dựng đứng
  // quả cầu sẽ tràn hết màn hình.
  const portrait = viewport.width < viewport.height;
  const fit = Math.min(viewport.width, viewport.height);
  const baseScale = THREE.MathUtils.clamp(
    fit / 7.8,
    portrait ? 0.22 : 0.3,
    0.72,
  );

  React.useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const p = progress.current ?? 0;
    const t = state.clock.elapsedTime;

    // Quả cầu lông bay thì luôn chúc đế xuống. Giữ đúng điều đó: xoay quanh
    // trục đứng là chính, chỉ nghiêng nhẹ chứ không lộn nhào.
    g.rotation.y = reducedMotion ? 0 : t * 0.26 + p * Math.PI * 0.9;
    g.rotation.z = Math.sin(t * 0.34) * 0.1 - pointer.current.x * 0.18;
    g.rotation.x = Math.cos(t * 0.27) * 0.06 + p * 0.2;

    // Đuổi theo con trỏ nhưng có độ trễ — bám sát quá thì thành dính chuột,
    // mất cảm giác nặng của thuỷ tinh.
    const tx = pointer.current.x * 0.42;
    const ty = -pointer.current.y * 0.3;
    g.position.x += (tx - g.position.x) * Math.min(1, delta * 2);
    g.position.y += (ty - g.position.y) * Math.min(1, delta * 2);

    g.scale.setScalar(baseScale * (1 + p * 0.16));
  });

  return (
    <group ref={ref}>
      {/* 16 chiếc lông pha lê — một mesh, một vật liệu */}
      {feathers && (
        <mesh geometry={feathers}>
          <MeshTransmissionMaterial
            transmission={1}
            thickness={0.5}
            roughness={0.05}
            ior={1.58}
            chromaticAberration={dispersion}
            anisotropy={0.16}
            distortion={0.1}
            distortionScale={0.24}
            temporalDistortion={0.03}
            backside={spec.backside}
            backsideThickness={0.3}
            samples={spec.samples}
            resolution={spec.resolution}
            color={tint}
            attenuationColor={tint}
            attenuationDistance={5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Đế bần */}
      <mesh geometry={cork}>
        <meshStandardMaterial
          color={gold}
          metalness={0.86}
          roughness={0.26}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vòng chỉ buộc chỗ cuống lông cắm vào đế */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.43, 0.035, 12, 48]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.16} />
      </mesh>
    </group>
  );
}
