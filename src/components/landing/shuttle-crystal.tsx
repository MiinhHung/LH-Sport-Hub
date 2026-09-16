"use client";

import { MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";

/**
 * Quả cầu lông bằng pha lê.
 *
 * Gồm ba phần, cố ý KHÔNG làm tất cả bằng thuỷ tinh:
 *
 *  - Váy lông  — pha lê trong, khúc xạ thật.
 *  - Đế bần    — vàng đặc. Bản thử đầu tiên để cả quả bằng thuỷ tinh thì
 *                nó thành cái ly, vì không có điểm đặc nào neo mắt lại.
 *  - 16 cọng lông — nan vàng mảnh. Đây mới là thứ khiến người ta nhận ra
 *                ngay là quả cầu lông chứ không phải một khối trừu tượng.
 *
 * Váy dựng bằng LatheGeometry: quả cầu lông là khối tròn xoay nên quay một
 * đường biên quanh trục đứng là xong. Đường biên đi lên theo mặt NGOÀI rồi
 * vòng xuống theo mặt TRONG, nên khối kín và có bề dày thật — ánh sáng
 * xuyên qua hai lớp thuỷ tinh, đó là thứ tạo chiều sâu. Ghép hình cầu với
 * hình nón thay vào đó sẽ để lại khe hở, mà vật liệu khúc xạ soi ra mọi
 * khe hở thành vệt đen.
 *
 * 16 không phải con số tuỳ tiện: quả cầu lông thật cắm đúng 16 chiếc lông.
 */

const FEATHERS = 16;

/** Nửa mặt cắt của váy, từ chân lên vành rồi vòng xuống mặt trong. */
const SKIRT_PROFILE: [number, number][] = [
  [0.44, -0.62],
  [0.52, -0.5],
  [0.62, -0.2],
  [0.75, 0.2],
  [0.9, 0.62],
  [1.06, 1.0],
  [1.17, 1.28],
  [1.1, 1.33],
  [0.99, 1.24],
  [0.84, 0.86],
  [0.7, 0.4],
  [0.58, 0.0],
  [0.47, -0.4],
  [0.38, -0.62],
];

/** Chân váy cắm vào đế, và đỉnh váy ở vành — dùng để đặt các cọng lông. */
const RIB_BOTTOM = new THREE.Vector2(0.5, -0.58);
const RIB_TOP = new THREE.Vector2(1.13, 1.24);

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
  gold = "#dcae42",
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

  const skirt = React.useMemo(() => {
    const points = SKIRT_PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(points, FEATHERS);
  }, []);

  React.useEffect(() => () => skirt.dispose(), [skirt]);

  // Vị trí và độ nghiêng của một cọng lông, tính từ hai đầu chân và vành
  // thay vì gõ tay — sửa đường biên váy thì cọng lông tự bám theo.
  const rib = React.useMemo(() => {
    const d = RIB_TOP.clone().sub(RIB_BOTTOM);
    return {
      length: d.length(),
      midR: (RIB_BOTTOM.x + RIB_TOP.x) / 2,
      midY: (RIB_BOTTOM.y + RIB_TOP.y) / 2,
      // Góc nghiêng so với trục đứng; âm để đầu trên ngả ra ngoài.
      tilt: -Math.atan2(d.x, d.y),
    };
  }, []);

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
    g.rotation.y = reducedMotion ? 0 : t * 0.22 + p * Math.PI * 0.9;
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
      {/* Váy pha lê */}
      <mesh geometry={skirt}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.58}
          roughness={0.04}
          ior={1.52}
          chromaticAberration={dispersion}
          anisotropy={0.2}
          distortion={0.12}
          distortionScale={0.28}
          temporalDistortion={0.04}
          backside={spec.backside}
          backsideThickness={0.35}
          samples={spec.samples}
          resolution={spec.resolution}
          color={tint}
          attenuationColor={tint}
          attenuationDistance={22}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cọng lông */}
      {Array.from({ length: FEATHERS }, (_, i) => (
        <group key={i} rotation={[0, (i / FEATHERS) * Math.PI * 2, 0]}>
          <mesh
            position={[rib.midR, rib.midY, 0]}
            rotation={[0, 0, rib.tilt]}
            castShadow={false}
          >
            <boxGeometry args={[0.035, rib.length, 0.02]} />
            <meshStandardMaterial
              color={gold}
              metalness={0.9}
              roughness={0.24}
              emissive={gold}
              emissiveIntensity={0.16}
            />
          </mesh>
        </group>
      ))}

      {/* Đế bần */}
      <mesh position={[0, -0.92, 0]}>
        <sphereGeometry args={[0.5, 40, 28]} />
        <meshStandardMaterial
          color={gold}
          metalness={0.92}
          roughness={0.28}
        />
      </mesh>
      {/* Vành nối đế với váy */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, 40]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.18} />
      </mesh>
    </group>
  );
}
