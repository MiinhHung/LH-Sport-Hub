/*
 * BIỂU TƯỢNG CHO DỮ LIỆU CỦA APP: môn chơi, phần thưởng kèo, loại bài,
 * cảm xúc.
 *
 * Trước đây những thứ này là emoji viết thẳng trong `lib/constants.ts`
 * (🏸 🍜 👍 🔥…). Emoji vẽ theo font của hệ điều hành, nên cùng một thẻ
 * kèo mà Windows, iPhone, Android ra ba bộ mặt khác nhau, không cái nào
 * ăn với màu navy–vàng. Và một hàng emoji cạnh nhãn chữ là dấu hiệu dễ
 * nhận nhất của giao diện do máy dựng.
 *
 * Emoji VẪN GIỮ trong constants: chúng còn đi vào chữ thuần — tiêu đề
 * thông báo lưu trong cơ sở dữ liệu, thẻ <option> — nơi không đặt được
 * một component. Chỗ nào dựng giao diện thì dùng các component ở đây.
 */
import {
  BowlSteam,
  ChatText,
  Coffee,
  Drop,
  Fire,
  Gift,
  HandsClapping,
  HandWaving,
  Heart,
  Image,
  LinkSimple,
  MegaphoneSimple,
  PersonSimpleRun,
  PersonSimpleSwim,
  PintGlass,
  Racquet,
  SmileySad,
  SmileyWink,
  ThumbsUp,
  Trophy,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import type { ComponentType } from "react";

import type {
  PostTypeKey,
  ReactionKey,
  SportKey,
  StakeKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Glyph = ComponentType<IconProps & { className?: string }>;


function ve(bang: Record<string, Glyph>, key: string, className?: string, weight: IconProps["weight"] = "bold") {
  const G = bang[key];
  if (!G) return null;
  return (
    <G
      weight={weight}
      aria-hidden
      className={cn("inline-block size-[1.1em] shrink-0 align-[-0.15em]", className)}
    />
  );
}

/* --- Môn chơi --- */
const SPORT: Record<SportKey, Glyph> = {
  cau_long: Racquet,
  boi: PersonSimpleSwim,
  khac: PersonSimpleRun,
};

export function SportIcon({ sport, className }: { sport: SportKey; className?: string }) {
  return ve(SPORT, sport, className);
}

/* --- Phần thưởng kèo --- */
const STAKE: Record<StakeKey, Glyph> = {
  nuoc: Drop,
  an_sang: BowlSteam,
  tra_sua: PintGlass,
  ca_phe: Coffee,
  ong_cau: Racquet,
  danh_du: Trophy,
  khac: Gift,
};

export function StakeIcon({ stake, className }: { stake: StakeKey; className?: string }) {
  return ve(STAKE, stake, className);
}

/* --- Loại bài --- */
const POST_TYPE: Record<PostTypeKey, Glyph> = {
  text: ChatText,
  image: Image,
  announcement: MegaphoneSimple,
  looking_for_player: HandWaving,
  link: LinkSimple,
};

export function PostTypeIcon({ type, className }: { type: PostTypeKey; className?: string }) {
  return ve(POST_TYPE, type, className);
}

/* --- Cảm xúc --- */

/**
 * Mỗi cảm xúc là một hình đặc trên nền tròn có màu riêng, kiểu huy hiệu.
 *
 * Màu cố định, không theo nền sáng/tối: đây là "con dấu", người ta nhận ra
 * bằng màu trước khi kịp nhìn hình. Chữ trắng trên cả sáu nền đều trên 3:1
 * — đủ cho hình đồ hoạ.
 */
const REACTION: Record<ReactionKey, { glyph: Glyph; nen: string }> = {
  like: { glyph: ThumbsUp, nen: "bg-navy-700" },
  love: { glyph: Heart, nen: "bg-rose-600" },
  haha: { glyph: SmileyWink, nen: "bg-gold-600" },
  fire: { glyph: Fire, nen: "bg-orange-600" },
  clap: { glyph: HandsClapping, nen: "bg-emerald-700" },
  sad: { glyph: SmileySad, nen: "bg-slate-500" },
};

export function ReactionBadge({
  reaction,
  size = "md",
  className,
}: {
  reaction: ReactionKey;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { glyph: G, nen } = REACTION[reaction];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full text-white",
        nen,
        size === "sm" && "size-[18px]",
        size === "md" && "size-6",
        size === "lg" && "size-8",
        className,
      )}
    >
      <G
        weight="fill"
        className={cn(
          size === "sm" && "size-[11px]",
          size === "md" && "size-3.5",
          size === "lg" && "size-[18px]",
        )}
      />
    </span>
  );
}
