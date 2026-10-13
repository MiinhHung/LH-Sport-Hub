import type { LucideIcon, LucideProps } from "lucide-react";
import {
  AlertTriangle as LucideAlertTriangle,
  ArrowLeft as LucideArrowLeft,
  ArrowRight as LucideArrowRight,
  ArrowUpRight as LucideArrowUpRight,
  Award as LucideAward,
  Ban as LucideBan,
  Bell as LucideBell,
  BookOpen as LucideBookOpen,
  CalendarClock as LucideCalendarClock,
  CalendarDays as LucideCalendarDays,
  CalendarX as LucideCalendarX,
  Camera as LucideCamera,
  Check as LucideCheck,
  CheckCheck as LucideCheckCheck,
  CheckCircle2 as LucideCheckCircle2,
  ChevronDown as LucideChevronDown,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  ClipboardPen as LucideClipboardPen,
  Clock as LucideClock,
  Download as LucideDownload,
  Eye as LucideEye,
  EyeOff as LucideEyeOff,
  FileText as LucideFileText,
  Flag as LucideFlag,
  Flame as LucideFlame,
  Ghost as LucideGhost,
  Handshake as LucideHandshake,
  Home as LucideHome,
  ImagePlus as LucideImagePlus,
  Info as LucideInfo,
  Layers as LucideLayers,
  Link as LucideLink,
  Link2 as LucideLink2,
  Loader2 as LucideLoader2,
  LoaderCircle as LucideLoaderCircle,
  Lock as LucideLock,
  LogOut as LucideLogOut,
  Mail as LucideMail,
  MapPin as LucideMapPin,
  Medal as LucideMedal,
  Megaphone as LucideMegaphone,
  MessageCircle as LucideMessageCircle,
  MessageSquare as LucideMessageSquare,
  MessagesSquare as LucideMessagesSquare,
  Menu as LucideMenu,
  Minus as LucideMinus,
  Moon as LucideMoon,
  MoreHorizontal as LucideMoreHorizontal,
  Navigation as LucideNavigation,
  Newspaper as LucideNewspaper,
  Pencil as LucidePencil,
  Pin as LucidePin,
  PinOff as LucidePinOff,
  Plus as LucidePlus,
  RotateCcw as LucideRotateCcw,
  Search as LucideSearch,
  Send as LucideSend,
  SendHorizontal as LucideSendHorizontal,
  Shield as LucideShield,
  ShieldAlert as LucideShieldAlert,
  ShieldCheck as LucideShieldCheck,
  Smile as LucideSmile,
  SmilePlus as LucideSmilePlus,
  Sparkles as LucideSparkles,
  Sun as LucideSun,
  SunMoon as LucideSunMoon,
  Swords as LucideSwords,
  Target as LucideTarget,
  ThumbsUp as LucideThumbsUp,
  Trash2 as LucideTrash2,
  TriangleAlert as LucideTriangleAlert,
  Trophy as LucideTrophy,
  Unlock as LucideUnlock,
  User as LucideUser,
  UserCog as LucideUserCog,
  UserPlus as LucideUserPlus,
  UserSearch as LucideUserSearch,
  Users as LucideUsers,
  Wallet as LucideWallet,
  X as LucideX,
  Zap as LucideZap,
} from "lucide-react";
import * as React from "react";

export type IconProps = LucideProps & {
  strokeWidth?: number;
  weight?: string; // Hỗ trợ tương thích ngược
};

export type IconType = ((props: IconProps) => React.ReactElement) & {
  displayName?: string;
};

/**
 * Chuẩn hóa toàn bộ icon sang lucide-react với nét strokeWidth (1.75)
 * và kích thước mặc định đồng nhất cho toàn bộ hệ thống.
 */
function ve(Icon: LucideIcon): IconType {
  const BieuTuong: IconType = ({
    strokeWidth = 1.75,
    size = 18,
    weight: _weight,
    className,
    ...props
  }: IconProps): React.ReactElement => {
    return (
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        className={className}
        aria-hidden={props["aria-label"] ? undefined : true}
        {...props}
      />
    );
  };
  BieuTuong.displayName = Icon.displayName || "LucideIcon";
  return BieuTuong;
}

/* --- Điều hướng --- */
export const Home = ve(LucideHome);
export const Newspaper = ve(LucideNewspaper);
export const Bell = ve(LucideBell);
export const BookOpen = ve(LucideBookOpen);
export const Trophy = ve(LucideTrophy);
export const Medal = ve(LucideMedal);
export const Award = ve(LucideAward);
export const CheckCircle2 = ve(LucideCheckCircle2);
export const MessagesSquare = ve(LucideMessagesSquare);
export const MessageSquare = ve(LucideMessageSquare);
export const MessageCircle = ve(LucideMessageCircle);
export const Navigation = ve(LucideNavigation);
export const Menu = ve(LucideMenu);

/* --- Thể thao & Tương tác --- */
export const Swords = ve(LucideSwords);
export const Target = ve(LucideTarget);
export const Flame = ve(LucideFlame);
export const Zap = ve(LucideZap);
export const Sparkles = ve(LucideSparkles);

/* --- Lịch, địa điểm --- */
export const CalendarDays = ve(LucideCalendarDays);
export const CalendarClock = ve(LucideCalendarClock);
export const CalendarX = ve(LucideCalendarX);
export const Clock = ve(LucideClock);
export const MapPin = ve(LucideMapPin);

/* --- Người dùng --- */
export const User = ve(LucideUser);
export const Users = ve(LucideUsers);
export const UserCog = ve(LucideUserCog);
export const UserPlus = ve(LucideUserPlus);
export const Handshake = ve(LucideHandshake);
export const UserSearch = ve(LucideUserSearch);
export const Ghost = ve(LucideGhost);
export const Smile = ve(LucideSmile);
export const ThumbsUp = ve(LucideThumbsUp);
export const SmilePlus = ve(LucideSmilePlus);

/* --- Hành động --- */
export const Plus = ve(LucidePlus);
export const Minus = ve(LucideMinus);
export const Pencil = ve(LucidePencil);
export const ClipboardPen = ve(LucideClipboardPen);
export const Trash2 = ve(LucideTrash2);
export const Send = ve(LucideSend);
export const SendHorizontal = ve(LucideSendHorizontal);
export const Search = ve(LucideSearch);
export const Download = ve(LucideDownload);
export const Camera = ve(LucideCamera);
export const ImagePlus = ve(LucideImagePlus);
export const Link = ve(LucideLink);
export const Link2 = ve(LucideLink2);
export const Pin = ve(LucidePin);
export const PinOff = ve(LucidePinOff);
export const Layers = ve(LucideLayers);
export const Flag = ve(LucideFlag);
export const RotateCcw = ve(LucideRotateCcw);
export const LogOut = ve(LucideLogOut);
export const Mail = ve(LucideMail);
export const FileText = ve(LucideFileText);
export const Megaphone = ve(LucideMegaphone);
export const Wallet = ve(LucideWallet);
export const MoreHorizontal = ve(LucideMoreHorizontal);
export const Eye = ve(LucideEye);
export const EyeOff = ve(LucideEyeOff);
export const Lock = ve(LucideLock);
export const Unlock = ve(LucideUnlock);

/* --- Mũi tên --- */
export const ArrowLeft = ve(LucideArrowLeft);
export const ArrowRight = ve(LucideArrowRight);
export const ArrowUpRight = ve(LucideArrowUpRight);
export const ChevronDown = ve(LucideChevronDown);
export const ChevronLeft = ve(LucideChevronLeft);
export const ChevronRight = ve(LucideChevronRight);

/* --- Trạng thái --- */
export const Check = ve(LucideCheck);
export const CheckCheck = ve(LucideCheckCheck);
export const X = ve(LucideX);
export const Info = ve(LucideInfo);
export const AlertTriangle = ve(LucideAlertTriangle);
export const TriangleAlert = ve(LucideTriangleAlert);
export const Ban = ve(LucideBan);
export const Shield = ve(LucideShield);
export const ShieldCheck = ve(LucideShieldCheck);
export const ShieldAlert = ve(LucideShieldAlert);
export const Loader2 = ve(LucideLoader2);
export const LoaderCircle = ve(LucideLoaderCircle);

/* --- Giao diện --- */
export const Sun = ve(LucideSun);
export const Moon = ve(LucideMoon);
export const SunMoon = ve(LucideSunMoon);
