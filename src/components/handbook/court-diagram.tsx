import { cn } from "@/lib/utils";

/**
 * Sơ đồ sân cầu lông vẽ đúng tỉ lệ thật (đơn vị: cm), nhìn từ trên xuống.
 *
 *   Dài 13,40 m · rộng 6,10 m (đánh đôi) · 5,18 m (đánh đơn)
 *   Vạch giao cầu ngắn cách lưới 1,98 m
 *   Vạch giao cầu dài của đánh đôi cách biên cuối 0,76 m
 *
 * Vẽ bằng SVG thay vì dùng ảnh: nét luôn sắc ở mọi cỡ màn hình, đổi màu
 * theo hệ màu của app, và nặng chưa tới 2KB.
 */

const W = 610; // bề ngang sân đôi
const L = 1340; // chiều dài sân
const NET = L / 2; // lưới nằm giữa
const SHORT = 198; // vạch giao cầu ngắn, tính từ lưới
const LONG_D = 76; // vạch giao cầu dài của đánh đôi, tính từ biên cuối
const SIDE = 46; // khoảng lùi của biên dọc đánh đơn
const MID = W / 2;

export type CourtHighlight =
  | "none"
  | "singles"
  | "doubles"
  | "service-singles"
  | "service-doubles";

export function CourtDiagram({
  highlight = "none",
  caption,
  className,
}: {
  highlight?: CourtHighlight;
  caption?: string;
  className?: string;
}) {
  const line = "var(--color-ink-600)";
  const fill = "var(--color-gold-300)";

  return (
    <figure className={cn("my-7", className)}>
      <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-850/60 p-5 sm:p-7">
        <svg
          viewBox={`-30 -30 ${W + 60} ${L + 60}`}
          className="mx-auto block h-auto w-full max-w-[290px]"
          role="img"
          aria-label={caption ?? "Sơ đồ sân cầu lông"}
        >
          {/* Vùng được tô sáng */}
          {highlight === "singles" && (
            <rect
              x={SIDE}
              y={0}
              width={W - SIDE * 2}
              height={L}
              fill={fill}
              opacity={0.22}
            />
          )}
          {highlight === "doubles" && (
            <rect x={0} y={0} width={W} height={L} fill={fill} opacity={0.22} />
          )}
          {/* Ô giao cầu bên phải người giao (điểm chẵn) */}
          {highlight === "service-singles" && (
            <rect
              x={MID}
              y={NET + SHORT}
              width={MID - SIDE}
              height={L - NET - SHORT}
              fill={fill}
              opacity={0.3}
            />
          )}
          {highlight === "service-doubles" && (
            <rect
              x={MID}
              y={NET + SHORT}
              width={MID}
              height={L - NET - SHORT - LONG_D}
              fill={fill}
              opacity={0.3}
            />
          )}

          <g stroke={line} strokeWidth={4} fill="none" strokeLinecap="square">
            {/* Biên ngoài (sân đôi) */}
            <rect x={0} y={0} width={W} height={L} strokeWidth={5} />

            {/* Biên dọc sân đơn */}
            <line x1={SIDE} y1={0} x2={SIDE} y2={L} />
            <line x1={W - SIDE} y1={0} x2={W - SIDE} y2={L} />

            {/* Vạch giao cầu ngắn hai bên lưới */}
            <line x1={0} y1={NET - SHORT} x2={W} y2={NET - SHORT} />
            <line x1={0} y1={NET + SHORT} x2={W} y2={NET + SHORT} />

            {/* Vạch giao cầu dài của đánh đôi */}
            <line
              x1={0}
              y1={LONG_D}
              x2={W}
              y2={LONG_D}
              strokeDasharray="14 10"
            />
            <line
              x1={0}
              y1={L - LONG_D}
              x2={W}
              y2={L - LONG_D}
              strokeDasharray="14 10"
            />

            {/* Vạch giữa, chỉ kéo từ vạch giao cầu ngắn ra biên cuối */}
            <line x1={MID} y1={0} x2={MID} y2={NET - SHORT} />
            <line x1={MID} y1={NET + SHORT} x2={MID} y2={L} />
          </g>

          {/* Lưới: ink-100 thay vì navy-900, để nền tối vẫn thấy lưới */}
          <line
            x1={-22}
            y1={NET}
            x2={W + 22}
            y2={NET}
            stroke="var(--color-ink-100)"
            strokeWidth={9}
          />
          <circle cx={-22} cy={NET} r={11} fill="var(--color-ink-100)" />
          <circle cx={W + 22} cy={NET} r={11} fill="var(--color-ink-100)" />
        </svg>
      </div>

      {caption && (
        <figcaption className="mt-3 text-center text-[12.5px] text-ink-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Sơ đồ đội hình đánh đôi: công thì một trên một dưới, thủ thì dàn ngang.
 */
export function DoublesFormation({
  mode,
  caption,
}: {
  mode: "attack" | "defend";
  caption?: string;
}) {
  const attack = mode === "attack";

  // Toạ độ hai người chơi, tính theo nửa sân dưới.
  const spots = attack
    ? [
        { x: MID, y: NET + 300 },
        { x: MID, y: NET + 560 },
      ]
    : [
        { x: MID - 150, y: NET + 430 },
        { x: MID + 150, y: NET + 430 },
      ];

  return (
    <figure className="my-7">
      <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-850/60 p-5 sm:p-7">
        <svg
          viewBox={`-30 ${NET - 60} ${W + 60} ${L / 2 + 90}`}
          className="mx-auto block h-auto w-full max-w-[290px]"
          role="img"
          aria-label={caption ?? "Sơ đồ đội hình đánh đôi"}
        >
          <g stroke="var(--color-ink-600)" strokeWidth={4} fill="none">
            <rect x={0} y={NET} width={W} height={L / 2} strokeWidth={5} />
            <line x1={SIDE} y1={NET} x2={SIDE} y2={L} />
            <line x1={W - SIDE} y1={NET} x2={W - SIDE} y2={L} />
            <line x1={0} y1={NET + SHORT} x2={W} y2={NET + SHORT} />
            <line x1={MID} y1={NET + SHORT} x2={MID} y2={L} />
          </g>

          <line
            x1={-22}
            y1={NET}
            x2={W + 22}
            y2={NET}
            stroke="var(--color-ink-100)"
            strokeWidth={9}
          />

          {spots.map((s, i) => (
            <g key={i}>
              <circle
                cx={s.x}
                cy={s.y}
                r={52}
                fill="var(--color-navy-900)"
                stroke="var(--color-gold-400)"
                strokeWidth={6}
              />
              <text
                x={s.x}
                y={s.y + 17}
                textAnchor="middle"
                fontSize={46}
                fontWeight="700"
                fill="#fff"
              >
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {caption && (
        <figcaption className="mt-3 text-center text-[12.5px] text-ink-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
