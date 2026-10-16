"use client";

import * as React from "react";
import { motion, AnimatePresence, useInView } from "motion/react";

import { useCalm } from "@/components/landing/use-calm";

export interface TeamMember {
  id: string;
  name: string;
  nickname: string;
  quote: string;
  x: number; // Tọa độ X trên nền (%)
  y: number; // Tọa độ Y trên nền (%)
  rotate: number; // Góc nghiêng chữ ký (độ)
  color: string; // Mã màu vàng kim / trắng
  glowColor: string;
  scale: number;
  flourish: "swoosh" | "loop" | "wave" | "star" | "heart";
}

/**
 * Danh sách thành viên team Light Human theo đúng yêu cầu:
 * Nhi, Thư, Hiền, Thùy, Khuyết, Bảo, Minh, Trượng, Trâm, Kiệt, Hùng, Ngân, Hạnh, Linh, Uyên, Phúc.
 */
export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "bao",
    name: "Bảo",
    nickname: "Kẻ Gác Đền Số 1",
    quote: "Phản xạ thần tốc, bắt lưới không trượt quả nào!",
    x: 18,
    y: 20,
    rotate: -8,
    color: "#ffd700",
    glowColor: "rgba(255, 215, 0, 0.7)",
    scale: 1.15,
    flourish: "swoosh",
  },
  {
    id: "hien",
    name: "Hiền",
    nickname: "Cứu Cầu Ngoạn Mục",
    quote: "Dù cầu sát sàn vẫn lăn xả cứu bằng được 🔥",
    x: 76,
    y: 18,
    rotate: 7,
    color: "#ffeaa0",
    glowColor: "rgba(255, 234, 160, 0.65)",
    scale: 1.1,
    flourish: "loop",
  },
  {
    id: "hung",
    name: "Hùng",
    nickname: "Đập Cầu Sấm Sét",
    quote: "Nhảy đập uy lực, cắm thẳng góc chết cuối sân!",
    x: 82,
    y: 68,
    rotate: -9,
    color: "#f5c042",
    glowColor: "rgba(245, 192, 66, 0.7)",
    scale: 1.18,
    flourish: "wave",
  },
  {
    id: "truong",
    name: "Trượng",
    nickname: "Bức Tường Phòng Thủ",
    quote: "Thủ chắc như bàn thạch, đối thủ đánh mãi không thủng.",
    x: 16,
    y: 72,
    rotate: 10,
    color: "#ffffff",
    glowColor: "rgba(255, 255, 255, 0.6)",
    scale: 1.1,
    flourish: "swoosh",
  },
  {
    id: "tram",
    name: "Trâm",
    nickname: "Hoa Khôi Cầu Lông",
    quote: "Giao cầu chuẩn xác, chém cầu xéo cực kỳ tinh tế ✨",
    x: 48,
    y: 13,
    rotate: -4,
    color: "#ffd166",
    glowColor: "rgba(255, 209, 102, 0.7)",
    scale: 1.12,
    flourish: "heart",
  },
  {
    id: "minh",
    name: "Minh",
    nickname: "Bỏ Nhỏ Nghệ Thuật",
    quote: "Cú vuốt cầu sát mép lưới khiến đối phương bất ngờ.",
    x: 14,
    y: 44,
    rotate: -11,
    color: "#fff7d6",
    glowColor: "rgba(255, 247, 214, 0.6)",
    scale: 1.06,
    flourish: "loop",
  },
  {
    id: "nhi",
    name: "Nhi",
    nickname: "Di Chuyển Thanh Thoát",
    quote: "Bộ chân linh hoạt, bao quát khắp mặt sân.",
    x: 82,
    y: 42,
    rotate: 6,
    color: "#fef08a",
    glowColor: "rgba(254, 240, 138, 0.7)",
    scale: 1.08,
    flourish: "star",
  },
  {
    id: "thu",
    name: "Thư",
    nickname: "Lưới Thép Bất Bại",
    quote: "Chụp lưới nhanh như chớp, dứt điểm chớp nhoáng ⚡",
    x: 64,
    y: 84,
    rotate: 5,
    color: "#ffffff",
    glowColor: "rgba(255, 255, 255, 0.6)",
    scale: 1.08,
    flourish: "wave",
  },
  {
    id: "khuyet",
    name: "Khuyết",
    nickname: "Vua Trái Tay",
    quote: "Cú ve cầu trái tay hiểm hóc đổi hướng thần sầu!",
    x: 36,
    y: 82,
    rotate: -8,
    color: "#fcd34d",
    glowColor: "rgba(252, 211, 77, 0.7)",
    scale: 1.14,
    flourish: "swoosh",
  },
  {
    id: "thuy",
    name: "Thùy",
    nickname: "Đội Trưởng Nhiệt Huyết",
    quote: "Người kết nối anh em mỗi sáng thứ 7 lên sân đầy đủ 👑",
    x: 26,
    y: 28,
    rotate: 8,
    color: "#ffd700",
    glowColor: "rgba(255, 215, 0, 0.65)",
    scale: 1.08,
    flourish: "star",
  },
  {
    id: "kiet",
    name: "Kiệt",
    nickname: "Pháo Binh Tầm Xa",
    quote: "Phông cầu sâu tận vạch cuối, áp đảo đối phương.",
    x: 70,
    y: 28,
    rotate: -6,
    color: "#ffeaa0",
    glowColor: "rgba(255, 234, 160, 0.6)",
    scale: 1.05,
    flourish: "swoosh",
  },
  {
    id: "linh",
    name: "Linh",
    nickname: "Chiến Thuật Gia",
    quote: "Đọc đường cầu thông minh, phân phối bóng bài bản.",
    x: 24,
    y: 60,
    rotate: -5,
    color: "#fef08a",
    glowColor: "rgba(254, 240, 138, 0.6)",
    scale: 1.05,
    flourish: "heart",
  },
  {
    id: "ngan",
    name: "Ngân",
    nickname: "Giao Cầu Thần Sầu",
    quote: "Giao ngắn sát lưới, đối thủ chỉ biết đứng nhìn.",
    x: 50,
    y: 92,
    rotate: 4,
    color: "#ffd166",
    glowColor: "rgba(255, 209, 102, 0.65)",
    scale: 1.06,
    flourish: "star",
  },
  {
    id: "hanh",
    name: "Hạnh",
    nickname: "Nụ Cười Sân Cầu",
    quote: "Thắng hay thua cũng vui, có mặt là sân rộn ràng 😄",
    x: 84,
    y: 86,
    rotate: -6,
    color: "#fff7d6",
    glowColor: "rgba(255, 247, 214, 0.6)",
    scale: 1.05,
    flourish: "heart",
  },
  {
    id: "phuc",
    name: "Phúc",
    nickname: "Tay Vợt Bền Bỉ",
    quote: "Đánh đủ ba set vẫn chạy như lúc mới khởi động 💪",
    x: 88,
    y: 55,
    rotate: 5,
    color: "#ffeaa0",
    glowColor: "rgba(255, 234, 160, 0.65)",
    scale: 1.05,
    flourish: "swoosh",
  },
  {
    id: "uyen",
    name: "Uyên",
    nickname: "Cầu Cao Sâu Bền",
    quote: "Đánh cầu cao tận cuối sân, rally bao lâu cũng không nản.",
    x: 14,
    y: 90,
    rotate: 7,
    color: "#fcd34d",
    glowColor: "rgba(252, 211, 77, 0.65)",
    scale: 1.05,
    flourish: "loop",
  },
];

/**
 * Cây bút lông vàng kim mô phỏng nét viết tay (Golden Pen Nib)
 */
function GoldenPen({
  x,
  y,
  isWriting,
}: {
  x: number;
  y: number;
  isWriting: boolean;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute z-50 select-none"
      animate={{
        left: `${x}%`,
        top: `${y}%`,
        x: -4,
        y: -36,
        rotate: isWriting ? [32, 38, 30, 36, 32] : 32,
      }}
      transition={{
        left: { duration: 0.35, ease: "easeInOut" },
        top: { duration: 0.35, ease: "easeInOut" },
        rotate: { duration: 0.18, repeat: isWriting ? Infinity : 0 },
      }}
    >
      <svg
        viewBox="0 0 50 50"
        width="44"
        height="44"
        fill="none"
        className="overflow-visible"
        style={{
          filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.65)) drop-shadow(0 0 10px rgba(245,192,66,0.5))",
        }}
      >
        <defs>
          <linearGradient id="pen-gold-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#ffd700" />
            <stop offset="70%" stopColor="#f5c042" />
            <stop offset="100%" stopColor="#875e0f" />
          </linearGradient>
        </defs>

        {/* Thân bút sang trọng */}
        <path
          d="M 12 4 L 20 4 L 18 30 L 14 30 Z"
          fill="url(#pen-gold-grad)"
          stroke="#ffeaa0"
          strokeWidth="0.8"
        />
        {/* Vòng đai cổ bút */}
        <rect x="13.5" y="27" width="5" height="3" fill="#ffffff" />
        {/* Ngòi bút nhọn sắc sảo */}
        <path
          d="M 14 30 L 16 40 L 18 30 Z"
          fill="#ffd700"
          stroke="#ffffff"
          strokeWidth="0.75"
        />
        {/* Khe mực trên ngòi */}
        <line x1="16" y1="30" x2="16" y2="38" stroke="#00081a" strokeWidth="0.6" />
        {/* Giọt mực phát sáng ở ngòi bút khi đang ký */}
        <circle
          cx="16"
          cy="40"
          r="2.2"
          fill="#ffffff"
          className={isWriting ? "animate-ping" : ""}
          style={{ filter: "drop-shadow(0 0 6px #ffd700)" }}
        />
        <circle cx="16" cy="40" r="1.5" fill="#ffd700" />
      </svg>
    </motion.div>
  );
}

/**
 * Nét bút gạch chân nghệ thuật dưới chữ ký (Flourish)
 */
function SignatureFlourish({
  type,
  color,
  isDrawn,
}: {
  type: TeamMember["flourish"];
  color: string;
  isDrawn: boolean;
}) {
  let pathD = "M 4 8 C 30 18, 70 2, 96 12 C 85 18, 55 20, 20 18";
  if (type === "loop") pathD = "M 6 10 C 35 18, 65 6, 82 8 C 94 9, 92 20, 80 18 C 50 14, 25 18, 12 16";
  if (type === "heart") pathD = "M 6 10 C 30 16, 60 12, 78 12";
  if (type === "star") pathD = "M 6 10 C 35 15, 65 9, 82 12";
  if (type === "wave") pathD = "M 6 12 Q 25 4, 45 12 T 85 12 T 96 10";

  return (
    <svg viewBox="0 0 100 24" className="w-full h-4 overflow-visible" fill="none">
      <motion.path
        d={pathD}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.9"
        initial={isDrawn ? false : { pathLength: 0 }}
        animate={{ pathLength: isDrawn ? 1 : 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      {type === "heart" && isDrawn && (
        <motion.path
          d="M 84 10 C 84 7, 88 6, 90 9 C 92 6, 96 7, 96 10 C 96 13, 90 16, 90 16 C 90 16, 84 13, 84 10 Z"
          fill={color}
          fillOpacity="0.9"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.25 }}
        />
      )}
      {type === "star" && isDrawn && (
        <motion.path
          d="M 90 6 L 91.5 10.5 L 96 12 L 91.5 13.5 L 90 18 L 88.5 13.5 L 84 12 L 88.5 10.5 Z"
          fill={color}
          fillOpacity="0.95"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.25 }}
        />
      )}
    </svg>
  );
}

/**
 * Hàm xáo trộn danh sách ngẫu nhiên (Fisher-Yates Shuffle)
 */
function shuffleMembers(list: TeamMember[]): TeamMember[] {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}


/**
 * COMPONENT MÔ PHỎNG NGƯỜI KÝ TÊN THẬT (LIVE SIGNING SIMULATION)
 * Không hiển thị sẵn: từng thành viên lần lượt được cây bút vàng vẽ ký lên mặt lưới ngẫu nhiên!
 *
 *  - Lớp này thuần trang trí (tên đã nằm trong nhãn của khung hero), nên
 *    `aria-hidden`: trình đọc màn hình không phải đọc 12 cái tên rời rạc.
 *  - Ra khỏi màn hình thì DỪNG hẳn: không hẹn giờ, không lơ lửng, không
 *    lắc bút. Cuộn vào lại thì ký tiếp từ người đang dở.
 *  - Người bật giảm chuyển động: hiện sẵn đủ mọi chữ ký, đứng yên.
 */
export function TeamSignaturesLayer() {
  const layerRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(layerRef, { margin: "80px" });
  const calm = useCalm();
  const chay = inView && !calm;

  // Hàng đợi ký tên theo thứ tự ngẫu nhiên
  const [memberQueue, setMemberQueue] = React.useState<TeamMember[]>(TEAM_MEMBERS);

  // Xáo trộn ngẫu nhiên thứ tự ký ngay khi vào trang trên client
  React.useEffect(() => {
    setMemberQueue(shuffleMembers(TEAM_MEMBERS));
  }, []);

  // Danh sách ID các chữ ký đã hoàn thành
  const [signedIds, setSignedIds] = React.useState<string[]>([]);
  // Vị trí người đang được ký trong hàng đợi ngẫu nhiên
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  // Trạng thái của chữ ký hiện tại: 'arriving' | 'writing' | 'flourish' | 'completed'
  const [signingPhase, setSigningPhase] = React.useState<
    "arriving" | "writing" | "flourish" | "completed"
  >("arriving");
  // Tooltip tương tác
  const [activeMember, setActiveMember] = React.useState<TeamMember | null>(null);

  // Người đang được ký hiện tại (giảm chuyển động: không ai "đang ký", tất cả đã ký)
  const currentMember = calm ? null : (memberQueue[currentIndex] ?? null);
  const isSimulationFinished = calm || currentIndex >= memberQueue.length;

  // Chuỗi hành động mô phỏng người ký tên
  React.useEffect(() => {
    // Khuất màn hình hoặc giảm chuyển động: không hẹn giờ gì cả.
    if (!chay) return;

    if (isSimulationFinished) {
      // Ký xong toàn bộ: hiển thị trọn vẹn trong 3.5s rồi tự động xáo trộn ngẫu nhiên và ký lại lượt mới
      const tReset = setTimeout(() => {
        setSignedIds([]);
        setMemberQueue(shuffleMembers(TEAM_MEMBERS));
        setCurrentIndex(0);
        setSigningPhase("arriving");
      }, 3500);

      return () => clearTimeout(tReset);
    }

    // 1. Cây bút di chuyển tới vị trí (300ms)
    const t0 = setTimeout(() => setSigningPhase("arriving"), 0);
    const t1 = setTimeout(() => {
      // 2. Bắt đầu viết tên nét mực (700ms)
      setSigningPhase("writing");
    }, 320);

    // 3. Viết nét gạch chân nghệ thuật (flourish) (450ms)
    const t2 = setTimeout(() => {
      setSigningPhase("flourish");
    }, 1050);

    // 4. Ký xong, lưu vào danh sách đã ký và chuyển người tiếp theo (350ms)
    const t3 = setTimeout(() => {
      if (currentMember) {
        setSignedIds((prev) => (prev.includes(currentMember.id) ? prev : [...prev, currentMember.id]));
      }
      setSigningPhase("completed");
      setCurrentIndex((prev) => prev + 1);
    }, 1550);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [chay, currentIndex, isSimulationFinished, currentMember]);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-25 overflow-visible"
    >
      {/* ================= CÂY BÚT VÀNG KIM ĐANG KÝ TÊN ================= */}
      {!isSimulationFinished && currentMember && (
        <GoldenPen
          x={
            signingPhase === "writing"
              ? currentMember.x + 4
              : signingPhase === "flourish"
                ? currentMember.x + 6
                : currentMember.x - 2
          }
          y={
            signingPhase === "flourish"
              ? currentMember.y + 3
              : currentMember.y - 1
          }
          isWriting={chay && (signingPhase === "writing" || signingPhase === "flourish")}
        />
      )}

      {/* ================= CÁC CHỮ KÝ ĐÃ VÀ ĐANG ĐƯỢC KÝ ================= */}
      {TEAM_MEMBERS.map((member, index) => {
        const isSigned = calm || signedIds.includes(member.id);
        const isCurrentlySigning = currentMember?.id === member.id;
        // Không hiển thị nếu chưa tới lượt ký
        if (!isSigned && !isCurrentlySigning) return null;

        const isHovered = activeMember?.id === member.id;
        const isWritingNow = isCurrentlySigning && signingPhase === "writing";
        const isFlourishingNow = isCurrentlySigning && signingPhase === "flourish";
        // Lơ lửng nhẹ chỉ khi đã ký xong VÀ đang trong màn hình.
        const troi = isSigned && chay;

        return (
          /*
           * Hai lớp: lớp ngoài giữ vị trí + góc nghiêng tĩnh, lớp trong để
           * motion chạy scale/y. Gộp chung một lớp thì motion ghi đè cả
           * `transform`, mất `translate(-50%, -50%) rotate(...)`.
           */
          <div
            key={member.id}
            className="absolute"
            style={{
              left: `${member.x}%`,
              top: `${member.y}%`,
              transform: `translate(-50%, -50%) rotate(${member.rotate}deg)`,
            }}
          >
            <motion.div
              initial={calm ? false : { opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: isHovered ? member.scale * 1.15 : member.scale,
                y: troi ? [0, -3, 0] : 0,
              }}
              transition={{
                scale: { duration: 0.2 },
                y: troi
                  ? {
                      duration: 4 + (index % 3),
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }
                  : { duration: 0.3 },
              }}
              className="pointer-events-auto relative cursor-pointer select-none"
              onMouseEnter={() => setActiveMember(member)}
              onMouseLeave={() => setActiveMember(null)}
            >
              <div
                className="relative flex flex-col items-center transition-all duration-300"
                style={{
                  filter: isHovered
                    ? `drop-shadow(0 0 16px ${member.glowColor}) drop-shadow(0 0 24px rgba(245,192,66,0.6))`
                    : `drop-shadow(0 2px 6px rgba(0,0,0,0.65))`,
                }}
              >
                {/* Tên thành viên viết tay */}
                <div className="relative overflow-visible">
                  <motion.span
                    className="font-signature text-[27px] sm:text-[32px] font-bold tracking-wide block"
                    style={{
                      color: member.color,
                      textShadow: `0 0 12px ${member.glowColor}`,
                    }}
                    initial={isCurrentlySigning ? { clipPath: "inset(0 100% 0 0)" } : { clipPath: "inset(0 0% 0 0)" }}
                    animate={{
                      clipPath: isSigned || isFlourishingNow ? "inset(0 0% 0 0)" : isWritingNow ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                    }}
                    transition={{ duration: 0.65, ease: "easeInOut" }}
                  >
                    {member.name}
                  </motion.span>
                </div>
  
                {/* Nét gạch chân uốn lượn dưới chữ ký */}
                <div className="w-[72px] sm:w-[82px] -mt-2">
                  <SignatureFlourish
                    type={member.flourish}
                    color={member.color}
                    isDrawn={isSigned || isFlourishingNow}
                  />
                </div>
  
                {/* Đốm sáng mực vàng kim lấp lánh khi ký xong */}
                {isSigned && (
                  <span
                    className="absolute -top-1 -right-2 text-[10px] animate-pulse select-none"
                    style={{ color: member.color }}
                  >
                    ✦
                  </span>
                )}
              </div>
  
              {/* Tooltip kỷ niệm hiển thị khi rê chuột vào */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-lg border border-gold-400/40 bg-navy-950/95 px-3 py-1.5 shadow-2xl backdrop-blur-md"
                  >
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="font-bold text-gold-300 text-[12px]">{member.name}</span>
                      <span className="text-white/40 text-[10px]">·</span>
                      <span className="text-white/90 text-[11px] font-medium">{member.nickname}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/70 italic font-sans">{member.quote}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
