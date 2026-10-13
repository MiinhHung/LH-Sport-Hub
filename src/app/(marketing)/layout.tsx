import { AppHeader } from "@/components/app-header";
import { MOTION_CSS_VARS } from "@/components/landing/motion";
import { getCurrentProfile } from "@/lib/auth";
import { unreadConversationCount } from "@/lib/chat";
import { unreadCount } from "@/lib/notifications";

/**
 * Khung cho nhánh giới thiệu / marketing.
 * Hiển thị AppHeader variant landing (tự đóng gói màu sáng, hai trạng thái theo cuộn), hỗ trợ cả khách vãng lai và thành viên đã đăng nhập. Có cuộn mượt Lenis.
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const [unread, unreadMessages] = profile
    ? await Promise.all([
        unreadCount(profile.id),
        unreadConversationCount(profile.id),
      ])
    : [0, 0];

  return (
    <div
      className="relative isolate min-h-dvh flex flex-col"
      style={MOTION_CSS_VARS}
    >
      <AppHeader
        profile={profile}
        unread={unread}
        unreadMessages={unreadMessages}
        variant="landing"
      />
      <div className="theme-sang flex-1 bg-white">{children}</div>
    </div>
  );
}
