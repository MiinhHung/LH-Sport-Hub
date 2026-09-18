"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Quả cầu lông 3D.
 *
 * LÔNG MÀU TRẮNG ĐỤC, KHÔNG PHẢI THUỶ TINH TRONG. Hai bản trước dùng vật
 * liệu khúc xạ và đều hỏng theo cùng một cách: vật trong suốt truyền qua
 * đúng màu nền, nên trên nền trắng quả cầu nhợt đi, còn trên nền navy thì
 * mấy chiếc lông thành que đen. Chỉnh thông số chỉ đổi từ lỗi này sang lỗi
 * kia. Lông cầu lông thật vốn màu trắng — dùng đúng màu trắng thì nó nổi
 * trên mọi nền, và tinh thần pha lê giữ lại bằng lớp bóng phủ ngoài cộng
 * một chút ánh cầu vồng ở rìa.
 *
 * Đổi vật liệu cũng gỡ luôn thứ đắt nhất trên trang: vật liệu khúc xạ vẽ
 * lại TOÀN CẢNH vào một bộ đệm sau mỗi khung hình.
 *
 * BẢN TRƯỚC NỮA DÙNG MỘT CÁI VÁY LIỀN (LatheGeometry) VÀ NÓ TRÔNG NHƯ CHỤP ĐÈN.
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
 * 16 hình học được biến đổi sẵn rồi gộp thành MỘT mesh: mười sáu mesh rời
 * là mười sáu lời gọi vẽ mỗi khung hình, trong khi chúng dùng chung đúng
 * một vật liệu.
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

/**
 * Từ khi bỏ vật liệu khúc xạ thì không còn bộ đệm khung hình nào để
 * chỉnh, nên bậc chất lượng chỉ còn lo phần hạt bụi và mật độ điểm ảnh.
 * Giữ lại kiểu rỗng này để bên gọi khỏi phải sửa, và để sau có thêm nút
 * chỉnh nào thì đã có chỗ.
 */
export type ShuttleQuality = Record<string, never>;

export function ShuttleCrystal({
  progress,
  reducedMotion,
  gold = "#c8951a",
}: {
  /** 0→1 theo tiến độ cuộn trang. */
  progress: React.RefObject<number>;
  reducedMotion: boolean;
  gold?: string;
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
    fit / 7.4,
    portrait ? 0.22 : 0.3,
    0.78,
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

    /*
     * LẮC THEO KIỂU TIẾN ĐỘNG, không phải nghiêng qua nghiêng lại.
     *
     * Bản trước cho `rotation.z` và `rotation.x` chạy theo hai hàm sin rời
     * nhau, kết quả là quả cầu lắc lư trên một mặt phẳng cố định — nhìn ra
     * máy móc.
     *
     * Quả cầu lông thật có đế bần nặng ở dưới, nên nó cư xử như con quay:
     * trục nghiêng một góc rồi chính cái góc nghiêng ấy QUAY VÒNG quanh
     * phương thẳng đứng. Muốn vậy thì hai trục phải là cos và sin của cùng
     * một pha, chứ không phải hai dao động độc lập.
     *
     * Biên độ nghiêng cũng tự phình ra thu vào theo một nhịp chậm hơn, để
     * chuyển động không lặp lại y hệt sau mỗi vòng.
     */
    const bienDo = 0.075 + 0.04 * Math.sin(t * 0.31);
    const pha = t * 0.85;

    g.rotation.y = reducedMotion ? 0 : t * 0.26 + p * Math.PI * 2.2;
    g.rotation.z = Math.cos(pha) * bienDo - pointer.current.x * 0.18;
    g.rotation.x = Math.sin(pha) * bienDo * 0.7;

    /*
     * Cuộn thì quả cầu RƠI, và xoáy nhanh dần.
     *
     * Bình phương tiến độ cho ra gia tốc: chậm lúc đầu rồi nhanh dần, như
     * vật rơi thật. Nó cũng nối thẳng vào dải kể chuyện ngay phía dưới —
     * nơi người chơi đánh quả cầu bay đi.
     */
    const roi = p * p * 1.5;

    // Đuổi theo con trỏ nhưng có độ trễ — bám sát quá thì thành dính chuột,
    // mất cảm giác nặng của quả cầu. Cộng thêm một nhịp bồng bềnh rất nhẹ.
    const tx = pointer.current.x * 0.42;
    const ty =
      -pointer.current.y * 0.3 + Math.sin(t * 0.58) * 0.045 - roi;
    g.position.x += (tx - g.position.x) * Math.min(1, delta * 2);
    g.position.y += (ty - g.position.y) * Math.min(1, delta * 2);

    g.scale.setScalar(baseScale * (1 + p * 0.16));
  });

  return (
    <group ref={ref}>
      {/* 16 chiếc lông — một mesh, một vật liệu */}
      {feathers && (
        <mesh geometry={feathers}>
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.34}
            metalness={0}
            // Hơi trong để thấy được chiếc lông phía sau, nhưng KHÔNG dùng
            // transmission: lông cầu lông thật là trắng đục chứ không phải
            // thuỷ tinh, và vật liệu trong suốt thì truyền qua đúng màu nền.
            transparent
            opacity={0.94}
            // Lớp bóng phủ ngoài: chính nó bắt đèn thành vệt sáng dọc sống
            // lông, thứ khiến khối có chiều mà không cần khúc xạ.
            clearcoat={1}
            clearcoatRoughness={0.16}
            // Ánh mượt như lông vũ thật, hơi ngả xanh cho hợp nền navy.
            sheen={1}
            sheenRoughness={0.35}
            sheenColor="#cfe0ff"
            // Một chút cầu vồng ở rìa — giữ lại tinh thần pha lê mà không
            // phải trả giá bằng việc khối chuyển thành màu của nền.
            iridescence={0.35}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[100, 420]}
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
