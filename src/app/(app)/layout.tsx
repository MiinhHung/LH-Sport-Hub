import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/nav";
import { requireProfile } from "@/lib/auth";
import { unreadConversationCount } from "@/lib/chat";
import { unreadCount } from "@/lib/notifications";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const [unread, unreadMessages] = await Promise.all([
    unreadCount(profile.id),
    unreadConversationCount(profile.id),
  ]);

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <AppHeader
        profile={profile}
        unread={unread}
        unreadMessages={unreadMessages}
        variant="default"
      />

      <main
        id="noi-dung"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-28 sm:px-6 sm:pt-6 lg:px-8 lg:pt-6 lg:pb-16"
      >
        {children}
      </main>

      <BottomNav unread={unread} unreadMessages={unreadMessages} />
    </div>
  );
}
