/**
 * Sân phối cảnh và lưới của màn mở đầu: phông nền tĩnh, không chuyển động
 * gì ngoài lúc hiện dần. Người chơi (IntroAthlete) và quả cầu bay nằm ở lớp
 * HTML phía trên, để transform của chúng chạy trên compositor.
 *
 * Hai bố cục: ngang (màn rộng hơn cao) và dọc (điện thoại). Đổi bằng
 * @media aspect-ratio chứ không theo bề rộng, để điện thoại xoay ngang vẫn
 * thấy đủ người chơi.
 */
export function IntroScene() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg
        className="intro-scene intro-scene-d absolute inset-0 size-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient
            id="d-court-line"
            x1="0"
            y1="280"
            x2="0"
            y2="900"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="40%" stopColor="#e8c56a" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {/* Sân phối cảnh và lưới. */}
        <g className="intro-court" stroke="url(#d-court-line)">
          <path
            d="M 520 280 L 920 280 L 1260 880 L 180 880 Z"
            strokeWidth="2.2"
          />
          <path
            d="M 552 280 L 888 280 L 1180 880 L 260 880 Z"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            strokeOpacity="0.5"
          />
          <line x1="720" y1="280" x2="720" y2="880" strokeWidth="1.75" />
          <line x1="450" y1="400" x2="990" y2="400" strokeWidth="1.5" />
          <line x1="360" y1="520" x2="1080" y2="520" strokeWidth="1.75" />
          <line
            x1="220"
            y1="820"
            x2="1220"
            y2="820"
            strokeWidth="1.4"
            strokeOpacity="0.4"
          />
          <rect
            x="320"
            y="460"
            width="800"
            height="20"
            fill="#ffffff"
            fillOpacity="0.05"
            stroke="none"
          />
          <line
            x1="310"
            y1="460"
            x2="1130"
            y2="460"
            stroke="#ffffff"
            strokeOpacity="0.7"
            strokeWidth="2.5"
          />
          <line
            x1="310"
            y1="450"
            x2="310"
            y2="490"
            stroke="#e8c56a"
            strokeWidth="3"
          />
          <line
            x1="1130"
            y1="450"
            x2="1130"
            y2="490"
            stroke="#e8c56a"
            strokeWidth="3"
          />
        </g>
      </svg>
      <svg
        className="intro-scene intro-scene-m absolute inset-0 size-full"
        viewBox="0 0 600 1000"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <linearGradient
            id="m-court-line"
            x1="0"
            y1="200"
            x2="0"
            y2="1000"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="40%" stopColor="#e8c56a" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {/* Sân phối cảnh và lưới. */}
        <g className="intro-court" stroke="url(#m-court-line)">
          <path
            d="M 170 200 L 430 200 L 660 1000 L -60 1000 Z"
            strokeWidth="2.2"
          />
          <path
            d="M 190 200 L 410 200 L 600 1000 L 0 1000 Z"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            strokeOpacity="0.5"
          />
          <line x1="300" y1="200" x2="300" y2="1000" strokeWidth="1.75" />
          <line x1="104" y1="430" x2="496" y2="430" strokeWidth="1.5" />
          <line x1="52" y1="610" x2="548" y2="610" strokeWidth="1.75" />
          <line
            x1="-30"
            y1="940"
            x2="630"
            y2="940"
            strokeWidth="1.4"
            strokeOpacity="0.4"
          />
          <rect
            x="78"
            y="520"
            width="444"
            height="20"
            fill="#ffffff"
            fillOpacity="0.05"
            stroke="none"
          />
          <line
            x1="68"
            y1="520"
            x2="532"
            y2="520"
            stroke="#ffffff"
            strokeOpacity="0.7"
            strokeWidth="2.5"
          />
          <line
            x1="68"
            y1="510"
            x2="68"
            y2="550"
            stroke="#e8c56a"
            strokeWidth="3"
          />
          <line
            x1="532"
            y1="510"
            x2="532"
            y2="550"
            stroke="#e8c56a"
            strokeWidth="3"
          />
        </g>
      </svg>
    </div>
  );
}
